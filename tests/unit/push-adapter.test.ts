import { afterEach, expect, it, vi } from "vitest";
import webpush from "web-push";
import { handleTestPush } from "../../src/lib/push-delivery.server";

const adapter = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { auth: { getUser: adapter.getUser }, from: adapter.from },
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

it("production adapter verifies the bearer token, scopes reads/deletes and guards refreshed snapshots", async () => {
  const userId = "00000000-0000-4000-8000-000000000010";
  const keys = webpush.generateVAPIDKeys();
  const subscription = {
    endpoint: "https://fcm.googleapis.com/fcm/send/synthetic",
    p256dh: keys.publicKey,
    auth: "a".repeat(22),
    application_server_key: keys.publicKey,
    updated_at: "2026-10-03T00:00:00Z",
  };
  for (const [name, value] of Object.entries({
    SUPABASE_URL: "https://ntmnpmdjfrbporcvafei.supabase.co",
    WEB_PUSH_TEST_USER_IDS: userId,
    WEB_PUSH_VAPID_PUBLIC_KEY: keys.publicKey,
    WEB_PUSH_VAPID_PRIVATE_KEY: keys.privateKey,
    WEB_PUSH_VAPID_SUBJECT: "mailto:push@example.test",
  }))
    vi.stubEnv(name, value);
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    limit: vi.fn(async () => ({ data: [subscription], error: null })),
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve({ data: [subscription], error: null }).then(resolve),
  };
  adapter.getUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
  adapter.from.mockReturnValue(query);
  const send = vi.spyOn(webpush, "sendNotification").mockRejectedValueOnce({ statusCode: 410 });
  const response = await handleTestPush(
    new Request("https://havato-test.darkube.ir/api/push/test", {
      method: "POST",
      headers: {
        origin: "https://havato-test.darkube.ir",
        authorization: "Bearer synthetic-session",
        "content-type": "application/json",
      },
      body: "{}",
    }),
  );
  expect(response.status).toBe(200);
  expect(adapter.getUser).toHaveBeenCalledWith("synthetic-session");
  expect(adapter.from).toHaveBeenCalledTimes(2);
  expect(adapter.from).toHaveBeenCalledWith("push_subscriptions");
  expect(query.eq.mock.calls.filter(([field]) => field === "user_id")).toEqual([
    ["user_id", userId],
    ["user_id", userId],
  ]);
  for (const field of [
    "endpoint",
    "updated_at",
    "p256dh",
    "auth",
    "application_server_key",
  ] as const) {
    expect(query.eq).toHaveBeenCalledWith(field, subscription[field]);
  }
  expect(send).toHaveBeenCalledWith(
    {
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.p256dh, auth: subscription.auth },
    },
    expect.any(String),
    expect.objectContaining({ TTL: 300, timeout: 10_000, contentEncoding: "aes128gcm" }),
  );
  expect(await response.text()).not.toContain(keys.privateKey);
});
