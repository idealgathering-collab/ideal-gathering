import { beforeEach, expect, it, vi } from "vitest";
import { defaultNotificationPreferences as defaults } from "../../src/lib/notification-preferences";
import { notificationPreferencesStore } from "../../src/lib/notification-preferences-store";
const adapter = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: adapter }));
let query: {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
};
beforeEach(() => {
  query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
  };
  adapter.from.mockReturnValue(query);
});
it("reads only the authenticated owner's preferences, defaulting only on absence", async () => {
  query.maybeSingle.mockResolvedValue({ data: null, error: null });
  expect(await notificationPreferencesStore("a").read()).toEqual(defaults);
  expect(adapter.from).toHaveBeenCalledWith("notification_preferences");
  expect(query.eq).toHaveBeenCalledWith("user_id", "a");
  query.maybeSingle.mockResolvedValue({ data: { ...defaults, enabled: false }, error: null });
  expect((await notificationPreferencesStore("a").read()).enabled).toBe(false);
});
it("does not turn read errors into enabled defaults", async () => {
  query.maybeSingle.mockResolvedValue({ data: null, error: { message: "private" } });
  await expect(notificationPreferencesStore("a").read()).rejects.toThrow("Could not load");
});
it("partial upsert carries ownership and preserves other device/category choices", async () => {
  query.single.mockResolvedValue({
    data: { ...defaults, enabled: false, language: "en" },
    error: null,
  });
  const result = await notificationPreferencesStore("a").save({ language: "en" });
  expect(query.upsert).toHaveBeenCalledWith(
    { user_id: "a", language: "en" },
    { onConflict: "user_id" },
  );
  expect(result.enabled).toBe(false);
  expect(result.language).toBe("en");
});
it("surfaces persistence errors so the UI retains its last saved choice", async () => {
  query.single.mockResolvedValue({ data: null, error: {} });
  await expect(notificationPreferencesStore("a").save({ enabled: false })).rejects.toThrow(
    "Could not save",
  );
});
