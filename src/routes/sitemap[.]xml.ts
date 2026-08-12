import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { PUBLIC_ROUTES, SEO_LANGS, SITE_URL } from "@/lib/seo";
import { listSitemapGatherings } from "@/lib/public-data.functions";

const XHTML = "http://www.w3.org/1999/xhtml";

function loc(path: string) {
  return `${SITE_URL}${path}`;
}

function urlBlock(path: string, changefreq: string, priority: string) {
  const alternates = SEO_LANGS.map(
    (l) =>
      `    <xhtml:link rel="alternate" hreflang="${l}" href="${loc(path)}${l === "en" ? "" : `?lang=${l}`}" />`,
  ).join("\n");
  return [
    "  <url>",
    `    <loc>${loc(path)}</loc>`,
    alternates,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${loc(path)}" />`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].join("\n");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        let gatherings: Array<{ id: string }> = [];
        try {
          gatherings = await listSitemapGatherings();
        } catch {
          gatherings = [];
        }

        const blocks = [
          ...PUBLIC_ROUTES.map((p) =>
            urlBlock(p, p === "/explore" ? "daily" : "weekly", p === "/" ? "1.0" : "0.7"),
          ),
          ...gatherings.map((g) => urlBlock(`/gatherings/${g.id}`, "daily", "0.6")),
        ];

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="${XHTML}">`,
          ...blocks,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
