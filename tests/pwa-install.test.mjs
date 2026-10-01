import { test } from "node:test";
import assert from "node:assert/strict";
import { createPwaInstall } from "../src/lib/pwa-install.ts";

function setup({ ios = false, standalone = false, ipad = false } = {}) {
  const target = new EventTarget();
  const display = new EventTarget();
  display.matches = standalone;
  target.matchMedia = () => display;
  const nav = { userAgent: ios ? "iPhone" : "Android Chrome", platform: ipad ? "MacIntel" : "", maxTouchPoints: ipad ? 5 : 0 };
  const install = createPwaInstall(target, nav);
  return { target, display, install };
}
function offer(target, outcome = "dismissed", fail = false) {
  const event = new Event("beforeinstallprompt", { cancelable: true });
  let calls = 0;
  event.prompt = () => { calls++; return fail ? Promise.reject(Error("failed")) : Promise.resolve(); };
  event.userChoice = Promise.resolve({ outcome });
  target.dispatchEvent(event);
  return { event, calls: () => calls };
}

test("capture before subscribers mount; prompt once synchronously on tap; clear after dismissal", async () => {
  const { target, install } = setup();
  assert.equal(install.getSnapshot(), "hidden");
  const offered = offer(target);
  assert.equal(offered.event.defaultPrevented, true);
  assert.equal(install.getSnapshot(), "ready");
  const observed = [];
  const unsubscribe = install.subscribe(() => observed.push(install.getSnapshot()));
  const promise = install.prompt();
  assert.equal(offered.calls(), 1);
  assert.equal(install.getSnapshot(), "pending");
  await install.prompt();
  await promise;
  assert.deepEqual(observed, ["pending", "hidden"]);
  await install.prompt();
  assert.equal(offered.calls(), 1);
  offer(target);
  assert.equal(install.getSnapshot(), "ready");
  unsubscribe();
});
test("appinstalled clears CTA, rejects future offers, and never prompts an installed app", async () => {
  const { target, install } = setup();
  const offered = offer(target, "accepted");
  const pending = install.prompt();
  target.dispatchEvent(new Event("appinstalled"));
  await pending;
  assert.equal(install.getSnapshot(), "hidden");
  offer(target);
  await install.prompt();
  assert.equal(install.getSnapshot(), "hidden");
  assert.equal(offered.calls(), 1);
});
test("standalone launch and runtime display changes suppress installation", async () => {
  const initial = setup({ standalone: true });
  const offered = offer(initial.target);
  await initial.install.prompt();
  assert.equal(offered.calls(), 0);
  assert.equal(initial.install.getSnapshot(), "hidden");
  const { target, display, install } = setup();
  offer(target);
  display.matches = true;
  display.dispatchEvent(new Event("change"));
  assert.equal(install.getSnapshot(), "hidden");
});
test("iPhone and iPad offer instructions only, including standalone suppression", async () => {
  for (const options of [{ ios: true }, { ipad: true }]) {
    const { target, install } = setup(options);
    const offered = offer(target);
    assert.equal(install.getSnapshot(), "ios");
    assert.equal(offered.event.defaultPrevented, false);
    await install.prompt();
    assert.equal(offered.calls(), 0);
  }
  assert.equal(setup({ ios: true, standalone: true }).install.getSnapshot(), "hidden");
});
test("prompt failure consumes the event without claiming success", async () => {
  const { target, install } = setup();
  const offered = offer(target, "dismissed", true);
  await assert.rejects(install.prompt(), /failed/);
  assert.equal(install.getSnapshot(), "hidden");
  await install.prompt();
  assert.equal(offered.calls(), 1);
});
