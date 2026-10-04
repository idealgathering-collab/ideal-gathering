// Review artifact only: all server/backend settings below are dummy loopback fixtures.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const origin = "http://127.0.0.1:4189";
const child = spawn(process.execPath, [resolve(".output/server/index.mjs")], {
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
child.stdout.on("data", (data) => (logs += data));
child.stderr.on("data", (data) => (logs += data));
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(origin + "/auth")).ok) {
        ready = true;
        break;
      }
    } catch {
      // Wait for the built server; no hosted requests.
    }
    if (child.exitCode !== null) break;
    await delay(250);
  }
  assert.ok(ready, logs);
  for (const path of [
    "/",
    "/our-story",
    "/terms",
    "/privacy",
    "/terms?lang=en",
    "/privacy?lang=en",
    "/auth?mode=signin",
    "/auth?mode=signup",
    "/venue/auth",
  ]) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get("content-type"), /text\/html/);
    const html = await response.text();
    assert.match(html, /Havato/);
    if (path === "/" || path === "/our-story") {
      assert.match(html, /dir="rtl"/);
      assert.match(html, /داستان ما/);
      assert.ok(!html.includes('href="/auth"'), "public member sign-in stays hidden");
      assert.match(html, /href="\/venue\/auth"/);
    }
    if (path.startsWith("/terms") || path.startsWith("/privacy")) {
      assert.match(html, /id="havato-legal-title"/);
      assert.match(html, /id="contact"/);
      assert.match(html, /havato-public/);
      assert.match(html, /dir="rtl"/);
      assert.doesNotMatch(
        html,
        /Ideal Gathering|idealgathering\.com|Armenia|Yerevan|ارمنستان|ایروان|mailto:/i,
      );
    }
    if (path === "/") assert.match(html, /id="waitlist"/);
    if (path === "/our-story") {
      assert.match(html, /id="havato-story-title"/);
      assert.equal((html.match(/class="havato-story-chapter"/g) ?? []).length, 8);
    }
  }
  const manifest = await (await fetch(origin + "/manifest.webmanifest")).json();
  assert.equal(manifest.name, "Havato");
  assert.equal(manifest.theme_color, "#E87524");
  console.log(
    "PASS: candidate SSR home/story/legal routes, default Farsi/RTL, member and venue auth routes, eight story chapters, retained Havato PWA manifest. No hosted writes or authenticated journey tested.",
  );
} finally {
  child.kill();
}
