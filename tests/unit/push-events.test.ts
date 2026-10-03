import { expect, it, vi } from "vitest";
import webpush from "web-push";
import {
  buildEventPayload,
  createEventRunner,
  eventKinds,
  reminderLeadMinutes,
} from "../../src/lib/push-events.server";
import { deliverUserPush, validatePushPayload } from "../../src/lib/push-delivery.server";

const event = {
  id: "synthetic-event",
  kind: "gathering_reminder" as const,
  recipient_id: "11111111-1111-4111-8111-111111111111",
  resource_id: "22222222-2222-4222-8222-222222222222",
};
it.each(eventKinds)("builds private, bounded EN/FA %s templates", (kind) => {
  for (const lang of ["en", "fa"] as const) {
    const payload = buildEventPayload({ ...event, kind }, lang);
    expect(payload.lang).toBe(lang);
    expect(payload.body).not.toContain(event.resource_id);
    expect(payload.body).not.toContain(event.recipient_id);
    expect(validatePushPayload(payload)).toEqual(payload);
    expect(payload.title).toBe("Havato / هواتو");
  }
});
it("falls back to the existing Persian default and ignores untrusted event content", () => {
  const payload = buildEventPayload(
    {
      ...event,
      title: "secret name",
      body: "secret message",
      url: "https://evil.invalid",
    } as typeof event,
    "ru",
  );
  expect(payload.lang).toBe("fa");
  expect(payload.url).toBe("/");
  expect(JSON.stringify(payload)).not.toMatch(/secret|evil/);
  expect(buildEventPayload(event).tag).toBe(buildEventPayload(event).tag);
  expect(buildEventPayload({ ...event, id: "other" }).tag).not.toBe(payload.tag);
});
it("rejects unknown event types", () => {
  expect(() =>
    buildEventPayload({ ...event, kind: "forged" } as unknown as typeof event),
  ).toThrow();
});
it.each([
  "https://evil.invalid",
  "//evil.invalid",
  "/pending?user=other",
  "/settings#secret",
  "/admin",
  "/%2f%2fevil.invalid",
])("rejects unsafe destination %s", (url) => {
  expect(() => validatePushPayload({ ...buildEventPayload(event), url })).toThrow();
});
it("bounds configurable reminder lead time", () => {
  expect(reminderLeadMinutes(undefined)).toBe(60);
  expect(reminderLeadMinutes("15")).toBe(15);
  for (const value of ["0", "1441", "NaN", "1.5", "", "-1"])
    expect(() => reminderLeadMinutes(value)).toThrow();
});
it("prevents overlapping polls and consumes only service-claimed recipients", async () => {
  let resolve!: (events: (typeof event)[]) => void;
  const claim = vi.fn(
    () =>
      new Promise<(typeof event)[]>((done) => {
        resolve = done;
      }),
  );
  const send = vi.fn();
  const log = vi.fn();
  const run = createEventRunner({ claim, send, log });
  const first = run(60);
  await run(60);
  expect(claim).toHaveBeenCalledTimes(1);
  resolve([event]);
  await first;
  expect(send).toHaveBeenCalledWith(event, buildEventPayload(event));
});
it("isolates failed events and logs no private error content", async () => {
  const log = vi.fn();
  const send = vi.fn().mockRejectedValueOnce(new Error("secret endpoint"));
  await createEventRunner({ claim: async () => [event, { ...event, id: "next" }], send, log })(60);
  expect(send).toHaveBeenCalledTimes(2);
  expect(log).toHaveBeenCalledWith("event_delivery_failed");
});
it("treats zero subscriptions as normal and scopes sender reads to the recipient", async () => {
  const keys = webpush.generateVAPIDKeys();
  const subscriptions = vi.fn(async () => []);
  const send = vi.fn();
  const result = await deliverUserPush(
    { authenticate: vi.fn(), subscriptions, send, remove: vi.fn(), log: vi.fn() },
    event.recipient_id,
    buildEventPayload(event),
    { ...keys, subject: "mailto:test@example.invalid" },
  );
  expect(result).toEqual({ accepted: 0, failed: 0, removed: 0, skipped: 0 });
  expect(subscriptions).toHaveBeenCalledWith(event.recipient_id);
  expect(send).not.toHaveBeenCalled();
});
