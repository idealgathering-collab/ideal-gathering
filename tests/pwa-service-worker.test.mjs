import { readFileSync } from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import test from "node:test";

const source = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
const origin = "https://havato.example";

function worker() {
  const handlers = {};
  const stores = new Map();
  const state = { calls: [], skipped: false, claimed: false, offline: false, policy: "", type: "text/javascript" };
  const key = (request) => new URL(typeof request === "string" ? request : request.url, origin).href;
  const caches = {
    keys: async () => [...stores.keys()],
    delete: async (name) => stores.delete(name),
    open: async (name) => {
      if (!stores.has(name)) stores.set(name, new Map());
      const entries = stores.get(name);
      return {
        addAll: async (requests) => {
          for (const request of requests) {
            assert.equal(request.credentials, "omit");
            assert.equal(request.cache, "reload");
            entries.set(key(request), new Response(request.url.endsWith("offline.html") ? "offline fallback" : "icon"));
          }
        },
        match: async (request) => entries.get(key(request))?.clone(),
        put: async (request, response) => entries.set(key(request), response),
        keys: async () => [...entries.keys()].map((url) => new Request(url)),
        delete: async (request) => entries.delete(key(request)),
      };
    },
  };
  // The browser resolves relative service-worker Request URLs against its origin.
  class WorkerRequest extends Request {
    constructor(input, options) { super(typeof input === "string" ? new URL(input, origin) : input, options); }
  }
  vm.runInNewContext(source, {
    URL, Request: WorkerRequest, Response, caches,
    self: {
      location: { origin },
      addEventListener: (name, fn) => { handlers[name] = fn; },
      skipWaiting: async () => { state.skipped = true; },
      clients: { claim: async () => { state.claimed = true; } },
    },
    fetch: async (request) => {
      state.calls.push(request);
      if (state.offline) throw new TypeError("Network unavailable");
      return new Response("fresh response", { headers: { "content-type": state.type, "cache-control": state.policy } });
    },
  });
  const dispatch = async (path, options = {}) => {
    const request = new WorkerRequest(path, options);
    if (options.navigate) Object.defineProperty(request, "mode", { value: "navigate" });
    let response;
    handlers.fetch({ request, respondWith: (value) => { response = value; } });
    return response;
  };
  const lifecycle = async (name) => {
    let promise;
    handlers[name]({ waitUntil: (value) => { promise = value; } });
    await promise;
  };
  return { state, stores, caches, dispatch, lifecycle };
}

test("install precaches only public fallback/icons and activates immediately", async () => {
  const w = worker(); await w.lifecycle("install");
  const keys = [...w.stores.get("havato-pwa-v2").keys()];
  assert.equal(keys.length, 6); assert.ok(keys.includes(`${origin}/offline.html`));
  assert.ok(w.state.skipped);
});

test("activation deletes only old Havato caches and claims clients", async () => {
  const w = worker(); await w.caches.open("havato-pwa-old"); await w.caches.open("unrelated-cache");
  await w.lifecycle("install"); await w.lifecycle("activate");
  assert.ok(!w.stores.has("havato-pwa-old")); assert.ok(w.stores.has("unrelated-cache")); assert.ok(w.state.claimed);
});

test("online authenticated navigation is network-only and never cached", async () => {
  const w = worker(); await w.lifecycle("install");
  assert.equal(await (await w.dispatch("/owner/account", { navigate: true, credentials: "include" })).text(), "fresh response");
  assert.equal(w.state.calls[0].credentials, "include");
  assert.equal(w.stores.get("havato-pwa-v2").size, 6);
});

test("offline navigation returns only the generic fallback", async () => {
  const w = worker(); await w.lifecycle("install"); w.state.offline = true;
  assert.equal(await (await w.dispatch("/auth?private=value", { navigate: true })).text(), "offline fallback");
  assert.equal(w.stores.get("havato-pwa-v2").size, 6);
});

test("evicted fallback still produces an offline page instead of a browser error", async () => {
  const w = worker(); w.state.offline = true;
  const response = await w.dispatch("/waitlist", { navigate: true });
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.match(await response.text(), /You're offline/);
});

test("POST, API, Supabase, foreign origin, authorization and queried assets bypass worker", async () => {
  const w = worker();
  for (const [url, options] of [
    ["/waitlist", { method: "POST" }], ["/api/user", {}], ["/_server/session", {}],
    ["https://backend.supabase.co/auth/v1/user", {}], ["/auth", {}],
    ["/assets/app-abcdefgh.js?token=private", {}],
    ["/assets/app-abcdefgh.js", { headers: { authorization: "Bearer private" } }],
  ]) assert.equal(await w.dispatch(url, options), undefined, url);
  assert.equal(w.state.calls.length, 0); assert.equal(w.stores.size, 0);
});

test("fingerprinted static assets are network-first, omit credentials and work offline", async () => {
  const w = worker();
  assert.equal(await (await w.dispatch("/assets/app-abcdefgh.js")).text(), "fresh response");
  assert.equal(w.state.calls[0].credentials, "omit");
  w.state.offline = true;
  assert.equal(await (await w.dispatch("/assets/app-abcdefgh.js")).text(), "fresh response");
  await assert.rejects(w.dispatch("/assets/new-abcdefgh.js"));
});

test("private, no-store and unexpected HTML responses are never cached", async () => {
  for (const [policy, type] of [["private", "text/javascript"], ["no-store", "text/css"], ["", "text/html"]]) {
    const w = worker(); w.state.policy = policy; w.state.type = type;
    await w.dispatch("/assets/app-abcdefgh.js");
    assert.equal(w.stores.get("havato-pwa-v2").size, 0);
  }
});

test("static cache stays bounded and preserves the offline fallback", async () => {
  const w = worker(); await w.lifecycle("install");
  for (let index = 0; index < 70; index++) await w.dispatch(`/assets/app${index}-abcdefgh.js`);
  assert.equal(w.stores.get("havato-pwa-v2").size, 64);
  assert.ok(w.stores.get("havato-pwa-v2").has(`${origin}/offline.html`));
});
