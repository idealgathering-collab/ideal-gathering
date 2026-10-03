import { expect, it, vi } from "vitest";
import {
  defaultNotificationPreferences as defaults,
  notificationCategories,
  notificationAllowed,
} from "../../src/lib/notification-preferences";
import {
  createPreferenceEventSender,
  createEventRunner,
  type PushEvent,
} from "../../src/lib/push-events.server";

const event: PushEvent = {
  id: "fixture",
  recipient_id: "fixture-user",
  resource_id: "fixture-resource",
  kind: "gathering_reminder",
};
it.each(Object.keys(notificationCategories) as PushEvent["kind"][])(
  "allows defaults and gates master/category for %s",
  async (kind) => {
    const category = notificationCategories[kind];
    expect(notificationAllowed(null, kind)).toBe(true);
    expect(notificationAllowed({ ...defaults, enabled: false }, kind)).toBe(false);
    expect(notificationAllowed({ ...defaults, [category]: false }, kind)).toBe(false);
    const deliver = vi.fn();
    let preferences = { ...defaults, [category]: false };
    const send = createPreferenceEventSender({
      authorize: async () => true,
      preferences: async () => preferences,
      deliver,
    });
    await send({ ...event, kind });
    expect(deliver).not.toHaveBeenCalled();
    preferences = { ...defaults };
    await send({ ...event, kind });
    expect(deliver).toHaveBeenCalledTimes(1);
  },
);
it("disabled categories leave other categories available", () => {
  for (const category of new Set(Object.values(notificationCategories))) {
    for (const [kind, target] of Object.entries(notificationCategories)) {
      expect(
        notificationAllowed({ ...defaults, [category]: false }, kind as PushEvent["kind"]),
      ).toBe(target !== category);
    }
  }
});
it("rechecks a queued/claimed event's latest preference after authorization", async () => {
  let preferences = { ...defaults };
  const deliver = vi.fn();
  const send = createPreferenceEventSender({
    authorize: async () => {
      preferences = { ...defaults, enabled: false };
      return true;
    },
    preferences: async () => preferences,
    deliver,
  });
  await createEventRunner({ claim: async () => [event], send, log: vi.fn() })(60);
  expect(deliver).not.toHaveBeenCalled();
});
it("does not read preferences or deliver for unauthorized recipients", async () => {
  const preferences = vi.fn();
  const deliver = vi.fn();
  await createPreferenceEventSender({ authorize: async () => false, preferences, deliver })(event);
  expect(preferences).not.toHaveBeenCalled();
  expect(deliver).not.toHaveBeenCalled();
});
it("fails closed on preference read errors and isolates the next event", async () => {
  const deliver = vi.fn();
  const log = vi.fn();
  const preferences = vi
    .fn()
    .mockRejectedValueOnce(new Error("private detail"))
    .mockResolvedValue(null);
  const send = createPreferenceEventSender({ authorize: async () => true, preferences, deliver });
  await createEventRunner({ claim: async () => [event, { ...event, id: "next" }], send, log })(60);
  expect(deliver).toHaveBeenCalledTimes(1);
  expect(log).toHaveBeenCalledWith("event_delivery_failed");
});
it.each(["fa", "en"] as const)(
  "uses persisted %s language after authorization",
  async (language) => {
    const preferences = vi.fn(async () => ({ ...defaults, language }));
    const deliver = vi.fn();
    await createPreferenceEventSender({ authorize: async () => true, preferences, deliver })(event);
    expect(preferences).toHaveBeenCalledWith(event.recipient_id);
    expect(deliver.mock.calls[0][1].lang).toBe(language);
  },
);
