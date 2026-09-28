// Run only against an artifact built with the documented dummy loopback config.
// This verifies the deployment boundary, not hosted Supabase journeys.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { resolve, join } from "node:path";
import { readFile, readdir } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

const origin = "http://127.0.0.1:4189";
const artifact = resolve(process.argv[2] || ".output");
const child = spawn(process.execPath, [join(artifact, "server/index.mjs")], {
  cwd: artifact,
  env: {
    ...process.env,
    HOST: "127.0.0.1",
    PORT: "4189",
    SUPABASE_URL: "http://127.0.0.1:54321",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_ig009_local_fixture",
    SUPABASE_SERVICE_ROLE_KEY: "ig009_server_only_sentinel",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let logs = "";
child.stdout.on("data", (data) => {
  logs += data;
});
child.stderr.on("data", (data) => {
  logs += data;
});
child.on("error", (error) => {
  logs += error.message;
});
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(`${origin}/auth`);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      /* Wait for Node to bind its local port. */
    }
    if (child.exitCode !== null) break;
    await delay(250);
  }
  assert.ok(ready, `Standalone server failed to start: ${logs}`);
  for (const path of ["/auth", "/terms", "/privacy", "/our-story"]) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get("content-type"), /text\/html/);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    const html = await response.text();
    assert.ok(html.includes("Havato"), `${path}: SSR content`);
    assert.ok(!html.includes("/__l5e/"), `${path}: no Lovable asset proxy`);
  }
  const manifest = await (await fetch(`${origin}/manifest.webmanifest`)).json();
  assert.equal(manifest.name, "Havato");
  assert.equal(manifest.theme_color, "#6b21a8");
  for (const name of await readdir("public/assets")) {
    const response = await fetch(`${origin}/assets/${name}`);
    assert.equal(response.status, 200, name);
    assert.match(response.headers.get("content-type"), /^image\//);
    assert.equal(
      (await response.arrayBuffer()).byteLength,
      (await readFile(`public/assets/${name}`)).length,
    );
  }
  const metadata = await (await fetch(`${origin}/.well-known/oauth-protected-resource`)).json();
  assert.ok(
    JSON.stringify(metadata).includes("http://127.0.0.1:54321/auth/v1"),
    "MCP uses configured issuer",
  );
  const anonymous = await fetch(`${origin}/mcp`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
  });
  assert.equal(anonymous.status, 401, "MCP retains authentication");
  for (const file of await readdir(join(artifact, "public/assets"))) {
    if (!/\.(js|css)$/.test(file)) continue;
    const contents = await readFile(join(artifact, "public/assets", file), "utf8");
    assert.ok(
      !contents.includes("ig009_server_only_sentinel"),
      "server secret not in browser artifact",
    );
    assert.ok(
      !contents.includes("msmmvtmgfmwwtipairsu"),
      "no historical production project in browser artifact",
    );
  }
  console.log(
    "PASS: standalone Node SSR, security headers, manifest, seven local assets, configured MCP issuer/authentication and browser secret/production-default scan. Hosted backend journeys NOT RUN.",
  );
} finally {
  child.kill();
}
