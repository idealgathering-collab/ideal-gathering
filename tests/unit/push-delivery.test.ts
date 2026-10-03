import { describe, expect, it, vi } from "vitest";
import webpush from "web-push";
import {
  createTestPushHandler,
  safePushEndpoint,
  validatePushPayload,
  validateVapidConfig,
} from "../../src/lib/push-delivery.server";

const userId = "00000000-0000-4000-8000-000000000001";
const otherId = "00000000-0000-4000-8000-000000000002";
const keys = webpush.generateVAPIDKeys();
const env = {
  SUPABASE_URL: "https://ntmnpmdjfrbporcvafei.supabase.co",
  WEB_PUSH_TEST_USER_IDS: userId,
  WEB_PUSH_VAPID_PUBLIC_KEY: keys.publicKey,
  WEB_PUSH_VAPID_PRIVATE_KEY: keys.privateKey,
  WEB_PUSH_VAPID_SUBJECT: "mailto:push@example.test",
};
const subscription = {
  endpoint: "https://fcm.googleapis.com/fcm/send/synthetic",
  p256dh: keys.publicKey,
  auth: "a".repeat(22),
  application_server_key: keys.publicKey,
  updated_at: "2026-10-03T00:00:00Z",
};
const payload = {
  version: 1,
  title: "Havato",
  body: "Test",
  url: "/pending",
  tag: "test",
  lang: "en",
};
function request(body: unknown = {}, headers: Record<string, string> = {}, method = "POST") {
  return new Request("https://havato-test.darkube.ir/api/push/test", {
    method,
    headers: {
      origin: "https://havato-test.darkube.ir",
      authorization: "Bearer synthetic",
      "content-type": "application/json",
      ...headers,
    },
    ...(method === "POST" ? { body: typeof body === "string" ? body : JSON.stringify(body) } : {}),
  });
}
function fixture(overrides = {}) {
  const dependencies = {
    authenticate: vi.fn(async () => userId as string | null),
    subscriptions: vi.fn(async () => [subscription]),
    remove: vi.fn(async () => true),
    send: vi.fn(async () => {}),
    log: vi.fn(),
    now: vi.fn(() => 100_000),
  };
  return {
    dependencies,
    handler: createTestPushHandler(dependencies, () => ({ ...env, ...overrides })),
  };
}

describe("VAPID and payload validation", () => {
  it("accepts a matching real library-generated pair without exposing it", () => {
    expect(validateVapidConfig(env).publicKey).toBe(keys.publicKey);
    expect(
      validateVapidConfig({ ...env, WEB_PUSH_VAPID_SUBJECT: "https://havato-test.darkube.ir/" })
        .subject,
    ).toMatch(/^https:/);
  });
  it.each(["WEB_PUSH_VAPID_PUBLIC_KEY", "WEB_PUSH_VAPID_PRIVATE_KEY", "WEB_PUSH_VAPID_SUBJECT"])(
    "fails closed when %s is absent",
    (name) => {
      expect(() => validateVapidConfig({ ...env, [name]: "" })).toThrow(
        "Invalid Web Push VAPID configuration",
      );
    },
  );
  it("rejects mismatched keys with a redacted error", () => {
    const mismatch = webpush.generateVAPIDKeys();
    expect(() =>
      validateVapidConfig({ ...env, WEB_PUSH_VAPID_PRIVATE_KEY: mismatch.privateKey }),
    ).toThrow(/^Invalid Web Push VAPID configuration$/);
  });
  it.each([
    "mailto:not-an-address",
    "mailto:push@example.test?subject=x",
    "http://example.test",
    "https://user:secret@example.test",
    "https://localhost",
  ])("rejects invalid subject %s", (subject) => {
    expect(() => validateVapidConfig({ ...env, WEB_PUSH_VAPID_SUBJECT: subject })).toThrow();
  });
  it("accepts EN/FA and canonicalizes safe same-origin URLs", () => {
    expect(validatePushPayload(payload).url).toBe("/pending");
    expect(
      validatePushPayload({
        ...payload,
        lang: "fa",
        body: "آزمایش",
        url: "https://havato-test.darkube.ir/settings",
      }).url,
    ).toBe("/settings");
  });
  it.each([
    "https://evil.test",
    "//evil.test",
    "javascript:alert(1)",
    "/auth?redirect=https://evil.test",
    "/settings#external",
    "/pending\\evil",
  ])("rejects unsafe payload URL %s", (url) => {
    expect(() => validatePushPayload({ ...payload, url })).toThrow();
  });
  it.each([
    { title: "" },
    { title: "a".repeat(101) },
    { body: "a".repeat(501) },
    { version: 2 },
    { lang: "tr" },
    { targetUserId: otherId },
    { body: "bad\ncontrol" },
  ])("rejects malformed payload %j", (change) => {
    expect(() => validatePushPayload({ ...payload, ...change })).toThrow();
  });
});

describe("provider egress boundary", () => {
  it.each([
    "https://fcm.googleapis.com/fcm/send/token",
    "https://updates.push.services.mozilla.com/wpush/v2/token",
    "https://web.push.apple.com/token",
    "https://wns2.notify.windows.com/w/?token=synthetic",
  ])("accepts approved provider %s", (url) => expect(safePushEndpoint(url)).toBe(true));
  it.each([
    "http://fcm.googleapis.com/fcm/send/token",
    "https://127.0.0.1/internal",
    "https://169.254.169.254/metadata",
    "https://fcm.googleapis.com.evil.test/fcm/send/token",
    "https://user@fcm.googleapis.com/fcm/send/token",
    "https://fcm.googleapis.com:444/fcm/send/token",
    "https://fcm.googleapis.com/internal",
    "https://evil.notify.windows.com.evil.test/w/?x=1",
    "not-a-url",
  ])("rejects arbitrary/SSRF destination %s", (url) => expect(safePushEndpoint(url)).toBe(false));
});

describe("authenticated self-only test sender", () => {
  it("is absent until explicitly enabled", async () => {
    const { handler, dependencies } = fixture({ WEB_PUSH_TEST_USER_IDS: "" });
    expect((await handler(request())).status).toBe(404);
    expect(dependencies.authenticate).not.toHaveBeenCalled();
  });
  it.each([
    { SUPABASE_URL: "https://other.supabase.co" },
    { WEB_PUSH_TEST_USER_IDS: "not-a-uuid" },
  ])("rejects wrong backend or malformed allowlist", async (change) => {
    const { handler, dependencies } = fixture(change);
    expect((await handler(request())).status).toBe(503);
    expect(dependencies.authenticate).not.toHaveBeenCalled();
  });
  it("rejects GET and foreign origins", async () => {
    const { handler, dependencies } = fixture();
    expect((await handler(request({}, {}, "GET"))).status).toBe(405);
    expect((await handler(request({}, { origin: "https://evil.test" }))).status).toBe(403);
    expect(dependencies.subscriptions).not.toHaveBeenCalled();
  });
  it("rejects missing/invalid tokens and users outside the allowlist", async () => {
    const { handler, dependencies } = fixture();
    expect((await handler(request({}, { authorization: "" }))).status).toBe(401);
    dependencies.authenticate.mockResolvedValueOnce(null);
    expect((await handler(request())).status).toBe(401);
    dependencies.authenticate.mockResolvedValueOnce(otherId);
    expect((await handler(request())).status).toBe(403);
    expect(dependencies.subscriptions).not.toHaveBeenCalled();
  });
  it.each([
    { targetUserId: otherId },
    { endpoint: subscription.endpoint },
    { title: "spoofed" },
    { lang: "tr" },
    "not json",
    "a".repeat(513),
    [],
  ])("rejects client targeting/content and oversized input %j", async (body) => {
    const { handler, dependencies } = fixture();
    expect((await handler(request(body))).status).toBe(400);
    expect(dependencies.send).not.toHaveBeenCalled();
  });
  it("sends only the authenticated user's subscriptions with fixed bilingual-ready content", async () => {
    const { handler, dependencies } = fixture();
    const response = await handler(request({ lang: "fa" }));
    expect(await response.json()).toEqual({ accepted: 1, removed: 0, failed: 0, skipped: 0 });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(dependencies.subscriptions).toHaveBeenCalledWith(userId);
    expect(dependencies.send.mock.calls[0][1]).toMatchObject({
      lang: "fa",
      url: "/pending",
      version: 1,
    });
  });
  it("throttles concurrent/repeated attempts and permits retry after a minute", async () => {
    const { handler, dependencies } = fixture();
    const responses = await Promise.all([handler(request()), handler(request())]);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 429]);
    dependencies.now.mockReturnValue(160_000);
    expect((await handler(request())).status).toBe(200);
  });
  it("fails closed on missing configuration before accessing rows", async () => {
    const { handler, dependencies } = fixture({ WEB_PUSH_VAPID_PRIVATE_KEY: "" });
    expect((await handler(request())).status).toBe(503);
    expect(dependencies.subscriptions).not.toHaveBeenCalled();
  });
  it.each([404, 410])("removes only the stale snapshot for status %s", async (statusCode) => {
    const { handler, dependencies } = fixture();
    dependencies.send.mockRejectedValueOnce({ statusCode });
    expect(await (await handler(request())).json()).toMatchObject({ removed: 1, failed: 0 });
    expect(dependencies.remove).toHaveBeenCalledWith(userId, subscription);
  });
  it.each([400, 401, 403, 429, 500, 503, undefined])(
    "retains healthy rows on nonterminal failure %s",
    async (statusCode) => {
      const { handler, dependencies } = fixture();
      dependencies.send.mockRejectedValueOnce({ statusCode, body: "private provider response" });
      expect(await (await handler(request())).json()).toMatchObject({ failed: 1, removed: 0 });
      expect(dependencies.remove).not.toHaveBeenCalled();
      expect(dependencies.log).toHaveBeenCalledWith("provider_delivery_failed", statusCode);
    },
  );
  it("reports cleanup failure without stopping other subscriptions", async () => {
    const { handler, dependencies } = fixture();
    dependencies.subscriptions.mockResolvedValueOnce([
      subscription,
      { ...subscription, endpoint: subscription.endpoint + "2" },
    ]);
    dependencies.send.mockRejectedValueOnce({ statusCode: 410 });
    dependencies.remove.mockRejectedValueOnce(new Error("private database detail"));
    expect(await (await handler(request())).json()).toMatchObject({
      accepted: 1,
      failed: 1,
      removed: 0,
    });
  });
  it("does not count a refreshed or already deleted snapshot as removed", async () => {
    const { handler, dependencies } = fixture();
    dependencies.send.mockRejectedValueOnce({ statusCode: 410 });
    dependencies.remove.mockResolvedValueOnce(false);
    expect(await (await handler(request())).json()).toMatchObject({ removed: 0, skipped: 1 });
  });
  it("skips unsafe endpoints and obsolete VAPID registrations without deleting them", async () => {
    const { handler, dependencies } = fixture();
    dependencies.subscriptions.mockResolvedValueOnce([
      { ...subscription, endpoint: "https://127.0.0.1/x" },
      { ...subscription, application_server_key: "different" },
    ]);
    expect(await (await handler(request())).json()).toMatchObject({ skipped: 2, accepted: 0 });
    expect(dependencies.send).not.toHaveBeenCalled();
    expect(dependencies.remove).not.toHaveBeenCalled();
  });
  it("caps fanout and redacts database failures", async () => {
    const capped = fixture();
    capped.dependencies.subscriptions.mockResolvedValueOnce(Array(21).fill(subscription));
    expect((await capped.handler(request())).status).toBe(409);
    expect(capped.dependencies.send).not.toHaveBeenCalled();
    const failing = fixture();
    failing.dependencies.subscriptions.mockRejectedValueOnce(new Error("private endpoint/key"));
    const response = await failing.handler(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("private");
  });
});
