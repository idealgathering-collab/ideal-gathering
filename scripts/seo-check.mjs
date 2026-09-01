#!/usr/bin/env node
/**
 * Automated SEO checklist for Ideal Gathering.
 *
 * Verifies, across EN/TR/FA:
 *   - /robots.txt      : reachable, not blanket-disallowed, sitemap directive
 *   - /sitemap.xml     : valid XML, absolute self-consistent <loc>s, hreflang alternates
 *   - every page       : unique title + description, canonical self-reference,
 *                        hreflang set (en/ru/fa + x-default) that round-trips,
 *                        og:title/og:description/og:url/og:locale, twitter:card
 *   - JSON-LD          : parses, has @context/@type, Event nodes carry required fields
 *
 * Usage:
 *   node scripts/seo-check.mjs                       # against http://localhost:8080
 *   node scripts/seo-check.mjs https://www.idealgathering.com
 *   node scripts/seo-check.mjs --json                # machine-readable report
 *
 * Exit code 0 = all checks pass, 1 = at least one failure.
 */

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const BASE = (args.find((a) => !a.startsWith("--")) ?? "http://localhost:8080").replace(/\/$/, "");

/** Canonical/hreflang host the source hardcodes (src/lib/seo.ts SITE_URL). */
const SITE_URL = "https://www.idealgathering.com";
const LANGS = ["en", "ru", "fa"];

const results = [];
function check(group, name, ok, detail = "") {
  results.push({ group, name, ok: !!ok, detail });
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { "user-agent": "seo-check/1.0" } });
  return { status: res.status, body: await res.text(), type: res.headers.get("content-type") ?? "" };
}

/* ------------------------------- tiny parsers ----------------------------- */

function tags(html, tagName) {
  const re = new RegExp(`<${tagName}\\b[^>]*>`, "gi");
  return (html.match(re) ?? []).map((raw) => {
    const attrs = {};
    for (const m of raw.matchAll(/([a-zA-Z:-]+)\s*=\s*"([^"]*)"/g)) attrs[m[1].toLowerCase()] = m[2];
    return attrs;
  });
}

function metaContent(html, key) {
  const m = tags(html, "meta").find((a) => a.name === key || a.property === key);
  return m?.content;
}

function titleOf(html) {
  return html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
}

function linksOf(html, rel) {
  return tags(html, "link").filter((a) => (a.rel ?? "").toLowerCase() === rel);
}

function jsonLdBlocks(html) {
  const out = [];
  for (const m of html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    out.push(m[1]);
  }
  return out;
}

/* --------------------------------- checks --------------------------------- */

async function checkRobots() {
  const g = "robots.txt";
  try {
    const { status, body } = await get("/robots.txt");
    check(g, "reachable (200)", status === 200, `status ${status}`);
    if (status !== 200) return;
    const blanket = /^\s*User-agent:\s*\*\s*$[\s\S]*?^\s*Disallow:\s*\/\s*$/im.test(
      body.split(/^\s*User-agent:/im)[1] ? `User-agent:${body.split(/^\s*User-agent:/im)[1]}` : body,
    );
    check(g, "does not block all crawlers", !blanket, blanket ? "found `Disallow: /`" : "");
    const sitemap = body.match(/^\s*Sitemap:\s*(\S+)/im)?.[1];
    check(g, "declares a Sitemap", !!sitemap, sitemap ?? "missing Sitemap: directive");
    if (sitemap) {
      check(g, "sitemap URL is absolute https", /^https:\/\//.test(sitemap), sitemap);
    }
  } catch (e) {
    check(g, "reachable", false, String(e));
  }
}

async function checkSitemap() {
  const g = "sitemap.xml";
  let locs = [];
  try {
    const { status, body, type } = await get("/sitemap.xml");
    check(g, "reachable (200)", status === 200, `status ${status}`);
    check(g, "served as XML", /xml/.test(type), type);
    if (status !== 200) return locs;
    check(g, "has <urlset> root", body.includes("<urlset"), "");
    locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    check(g, "contains at least one URL", locs.length > 0, `${locs.length} urls`);
    check(
      g,
      "all <loc> absolute and on canonical host",
      locs.every((l) => l.startsWith(`${SITE_URL}/`)),
      locs.filter((l) => !l.startsWith(`${SITE_URL}/`)).slice(0, 3).join(", "),
    );
    check(g, "no duplicate <loc>", new Set(locs).size === locs.length, "");
    check(g, "no query-string / hash URLs in <loc>", locs.every((l) => !/[?#]/.test(l)), "");
    check(g, "homepage listed", locs.includes(`${SITE_URL}/`), "");
    const blocks = body.split("<url>").slice(1);
    const missingAlt = blocks.filter(
      (b) => !LANGS.every((l) => b.includes(`hreflang="${l}"`)) || !b.includes('hreflang="x-default"'),
    );
    check(g, "every URL has en/ru/fa + x-default alternates", missingAlt.length === 0, `${missingAlt.length} entries missing`);
    check(g, "no fabricated <lastmod>", !body.includes("<lastmod>"), "");
  } catch (e) {
    check(g, "reachable", false, String(e));
  }
  return locs;
}

function pathOf(loc) {
  return loc.slice(SITE_URL.length) || "/";
}

async function checkPage(path, lang, seen) {
  const g = `${path} [${lang}]`;
  const url = lang === "en" ? path : `${path}?lang=${lang}`;
  let html;
  try {
    const res = await get(url);
    check(g, "renders (200)", res.status === 200, `status ${res.status}`);
    if (res.status !== 200) return;
    html = res.body;
  } catch (e) {
    check(g, "renders", false, String(e));
    return;
  }

  const title = titleOf(html);
  check(g, "has <title>", !!title, title ?? "");
  if (title) {
    check(g, "title length 10-70", title.length >= 10 && title.length <= 70, `${title.length} chars`);
    const key = `${path}`;
    const prev = seen.titles.get(title);
    check(g, "title unique across pages", !prev || prev === key, prev ? `also on ${prev}` : "");
    seen.titles.set(title, key);
  }

  const desc = metaContent(html, "description");
  check(g, "has meta description", !!desc, desc ? "" : "missing");
  if (desc) check(g, "description length 50-300", desc.length >= 50 && desc.length <= 300, `${desc.length} chars`);

  const noindex = /noindex/i.test(metaContent(html, "robots") ?? "");

  // canonical
  const canon = linksOf(html, "canonical").map((l) => l.href);
  check(g, "exactly one canonical", canon.length === 1, canon.join(", "));
  const expectedSelf = `${SITE_URL}${path}${lang === "en" ? "" : `?lang=${lang}`}`;
  if (canon.length === 1) {
    check(g, "canonical self-references this page", canon[0] === expectedSelf, `${canon[0]} vs ${expectedSelf}`);
  }

  // hreflang
  if (!noindex) {
    const alts = linksOf(html, "alternate").filter((l) => l.hreflang);
    const map = new Map(alts.map((a) => [a.hreflang.toLowerCase(), a.href]));
    check(g, "hreflang en/ru/fa present", LANGS.every((l) => map.has(l)), [...map.keys()].join(","));
    check(g, "hreflang x-default present", map.has("x-default"), "");
    check(
      g,
      "hreflang hrefs absolute + correct",
      LANGS.every((l) => map.get(l) === `${SITE_URL}${path}${l === "en" ? "" : `?lang=${l}`}`),
      [...map.entries()].map(([k, v]) => `${k}=${v}`).join(" "),
    );
    check(g, "hreflang self-reference included", map.get(lang) === expectedSelf, map.get(lang) ?? "");
  }

  // open graph / twitter
  for (const key of ["og:title", "og:description", "og:url", "og:locale"]) {
    check(g, `has ${key}`, !!metaContent(html, key), metaContent(html, key) ?? "missing");
  }
  check(g, "og:url matches canonical", metaContent(html, "og:url") === expectedSelf, metaContent(html, "og:url") ?? "");
  check(
    g,
    "og:locale matches language",
    metaContent(html, "og:locale") === { en: "en_US", ru: "ru_RU", fa: "fa_IR" }[lang],
    metaContent(html, "og:locale") ?? "",
  );
  check(g, "has twitter:card", !!metaContent(html, "twitter:card"), "");
  const ogImage = metaContent(html, "og:image");
  if (ogImage) check(g, "og:image is an absolute URL", /^https?:\/\//.test(ogImage), ogImage);

  // JSON-LD
  const blocks = jsonLdBlocks(html);
  check(g, "has JSON-LD", blocks.length > 0, `${blocks.length} blocks`);
  blocks.forEach((raw, i) => {
    let data;
    try {
      data = JSON.parse(raw.replace(/\\u003c/g, "<"));
    } catch (e) {
      check(g, `JSON-LD #${i + 1} parses`, false, String(e));
      return;
    }
    check(g, `JSON-LD #${i + 1} parses`, true, "");
    const nodes = Array.isArray(data) ? data : [data];
    for (const node of nodes) {
      check(g, `JSON-LD #${i + 1} has @context`, node["@context"] === "https://schema.org", node["@context"] ?? "missing");
      check(g, `JSON-LD #${i + 1} has @type`, !!node["@type"], node["@type"] ?? "missing");
      if (/Event$/.test(node["@type"] ?? "")) {
        for (const field of ["name", "startDate", "eventStatus", "eventAttendanceMode", "location"]) {
          check(g, `Event JSON-LD has ${field}`, node[field] != null, "");
        }
        check(
          g,
          "Event startDate is ISO 8601",
          typeof node.startDate === "string" && !Number.isNaN(Date.parse(node.startDate)),
          String(node.startDate),
        );
      }
      if (node["@type"] === "ItemList") {
        check(g, "ItemList has itemListElement", Array.isArray(node.itemListElement), "");
      }
    }
  });
}

/* ---------------------------------- run ----------------------------------- */

const locs = await checkSitemap();
await checkRobots();

// Page set: everything the sitemap advertises, capped so the run stays quick.
const staticPaths = locs.filter((l) => !l.includes("/gatherings/")).map(pathOf);
const gatheringPaths = locs.filter((l) => l.includes("/gatherings/")).slice(0, 2).map(pathOf);
const paths = [...new Set([...(staticPaths.length ? staticPaths : ["/"]), ...gatheringPaths])];

const seen = { titles: new Map() };
for (const path of paths) {
  for (const lang of LANGS) {
    await checkPage(path, lang, seen);
  }
}

const failed = results.filter((r) => !r.ok);

if (asJson) {
  console.log(JSON.stringify({ base: BASE, passed: results.length - failed.length, failed: failed.length, results }, null, 2));
} else {
  let current = "";
  for (const r of results) {
    if (r.group !== current) {
      current = r.group;
      console.log(`\n\x1b[1m${current}\x1b[0m`);
    }
    const mark = r.ok ? "\x1b[32m✔\x1b[0m" : "\x1b[31m✘\x1b[0m";
    console.log(`  ${mark} ${r.name}${r.ok || !r.detail ? "" : ` — ${r.detail}`}`);
  }
  console.log(
    `\n${failed.length === 0 ? "\x1b[32mAll SEO checks passed\x1b[0m" : `\x1b[31m${failed.length} failing\x1b[0m`} (${results.length} checks, ${paths.length} pages × ${LANGS.length} languages, base ${BASE})`,
  );
}

process.exit(failed.length === 0 ? 0 : 1);
