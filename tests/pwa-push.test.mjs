import { readFileSync } from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import test from "node:test";

const source = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
const origin = "https://havato-test.darkube.ir";
const payload = {
  version: 1,
  title: "Havato",
  body: "Test notification",
  url: "/pending",
  tag: "test",
  lang: "en",
};

function worker(windows = []) {
  const handlers = {};
  const state = { notifications: [], opened: [], closed: false, matched: null };
  vm.runInNewContext(source, {
    URL,
    self: {
      location: { origin },
      addEventListener: (name, handler) => {
        handlers[name] = handler;
      },
      registration: {
        showNotification: async (title, options) => {
          state.notifications.push({ title, options });
        },
      },
      clients: {
        matchAll: async (options) => {
          state.matched = options;
          return windows;
        },
        openWindow: async (url) => {
          state.opened.push(url);
        },
      },
    },
  });
  async function dispatch(name, event) {
    let pending;
    handlers[name]({
      ...event,
      waitUntil: (promise) => {
        pending = promise;
      },
    });
    assert.ok(pending instanceof Promise || typeof pending?.then === "function");
    await pending;
  }
  return {
    state,
    push: (value) => dispatch("push", { data: value === undefined ? null : { json: () => value } }),
    malformed: () =>
      dispatch("push", {
        data: {
          json: () => {
            throw new Error("invalid JSON");
          },
        },
      }),
    click: (url) =>
      dispatch("notificationclick", {
        notification: {
          close: () => {
            state.closed = true;
          },
          data: { url },
        },
      }),
  };
}

test("push displays Havato icon/badge and retains only a safe destination", async () => {
  const runtime = worker();
  await runtime.push({
    ...payload,
    arbitraryData: "must not retain",
    icon: "https://evil.test/track",
  });
  const shown = runtime.state.notifications[0];
  assert.equal(shown.title, "Havato");
  assert.equal(shown.options.icon, "/favicon-192.png");
  assert.equal(shown.options.badge, "/favicon.png");
  assert.equal(shown.options.data.url, `${origin}/pending`);
  assert.deepEqual(Object.keys(shown.options.data), ["url"]);
});

test("FA payload carries language and right-to-left direction", async () => {
  const runtime = worker();
  await runtime.push({ ...payload, lang: "fa", body: "آزمایش" });
  assert.equal(runtime.state.notifications[0].options.lang, "fa");
  assert.equal(runtime.state.notifications[0].options.dir, "rtl");
});

test("empty, invalid JSON and malformed payloads still produce a generic visible notification", async () => {
  for (const value of [
    undefined,
    null,
    {},
    { ...payload, version: 2 },
    { ...payload, title: "a".repeat(101) },
    { ...payload, body: "\n" },
  ]) {
    const runtime = worker();
    await runtime.push(value);
    assert.equal(runtime.state.notifications.length, 1);
    assert.equal(runtime.state.notifications[0].options.data.url, `${origin}/`);
  }
  const malformed = worker();
  await malformed.malformed();
  assert.equal(malformed.state.notifications.length, 1);
});

for (const unsafe of [
  "https://evil.test/pending",
  "//evil.test",
  "javascript:alert(1)",
  "data:text/html,bad",
  "/auth?redirect=https://evil.test",
  "/pending#bad",
  "/settings\\bad",
  "https://user:secret@havato-test.darkube.ir/pending",
  "/%2f%2fevil.test",
  "/api/push/test",
  null,
]) {
  test(`push and click sanitize ${String(unsafe)}`, async () => {
    const runtime = worker();
    await runtime.push({ ...payload, url: unsafe });
    assert.equal(runtime.state.notifications[0].options.data.url, `${origin}/`);
    await runtime.click(unsafe);
    assert.equal(runtime.state.opened[0], `${origin}/`);
    assert.ok(runtime.state.closed);
  });
}

test("click focuses an exact existing Havato window without opening another", async () => {
  let focused = 0;
  const runtime = worker([
    {
      url: `${origin}/pending`,
      focus: async () => {
        focused++;
      },
    },
  ]);
  await runtime.click("/pending");
  assert.equal(focused, 1);
  assert.equal(runtime.state.opened.length, 0);
  assert.ok(runtime.state.closed);
  assert.equal(runtime.state.matched.type, "window");
});

test("click navigates and focuses an existing same-origin window", async () => {
  let destination;
  let focused = 0;
  const client = {
    url: `${origin}/settings`,
    navigate: async (url) => {
      destination = url;
      return client;
    },
    focus: async () => {
      focused++;
    },
  };
  const runtime = worker([client]);
  await runtime.click("/pending");
  assert.equal(destination, `${origin}/pending`);
  assert.equal(focused, 1);
  assert.equal(runtime.state.opened.length, 0);
});

test("click never navigates a foreign window and opens only safe Havato URL", async () => {
  const runtime = worker([
    {
      url: "https://evil.test/",
      navigate: async () => assert.fail("foreign navigation"),
      focus: async () => assert.fail("foreign focus"),
    },
  ]);
  await runtime.click("/settings");
  assert.deepEqual(runtime.state.opened, [`${origin}/settings`]);
});

test("failed or closed-window navigation falls back to a new safe window", async () => {
  for (const navigate of [
    async () => null,
    async () => {
      throw new Error("closed");
    },
  ]) {
    const runtime = worker([{ url: `${origin}/settings`, navigate }]);
    await runtime.click("/pending");
    assert.deepEqual(runtime.state.opened, [`${origin}/pending`]);
  }
});
