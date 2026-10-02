import { describe, expect, it, vi } from "vitest";
import {
  disablePush,
  enablePush,
  inspectPush,
  publicPushKey,
  pushCapability,
  type PushStore,
} from "@/lib/web-push";

const key = "B" + "A".repeat(86);
function fixture(existing = false) {
  const store: PushStore = {
    save: vi.fn(async () => {}),
    remove: vi.fn(async () => {}),
    has: vi.fn(async () => true),
  };
  let active = existing;
  const subscription = {
    endpoint: "https://push.example.invalid/subscription",
    expirationTime: null,
    options: { applicationServerKey: publicPushKey(key)!.buffer },
    toJSON: () => ({ keys: { p256dh: key, auth: "A".repeat(22) } }),
    unsubscribe: vi.fn(async () => {
      active = false;
      return true;
    }),
  } as unknown as PushSubscription;
  const registration = {
    pushManager: {
      getSubscription: vi.fn(async () => (active ? subscription : null)),
      subscribe: vi.fn(async () => {
        active = true;
        return subscription;
      }),
    },
  } as unknown as ServiceWorkerRegistration;
  const notification = {
    permission: "default" as NotificationPermission,
    requestPermission: vi.fn(async () => "granted" as NotificationPermission),
  };
  const options = {
    registration,
    store,
    publicKey: key,
    notification,
    stillAuthenticated: vi.fn(async () => true),
  };
  return { ...options, subscription, options };
}
describe("Web Push capability", () => {
  const nav = {
    userAgent: "Chrome",
    platform: "Linux",
    maxTouchPoints: 0,
    serviceWorker: {},
  } as unknown as Navigator;
  const target = {
    isSecureContext: true,
    PushManager: {},
    Notification: {},
    matchMedia: () => ({ matches: false }),
  } as unknown as Window;
  it("is SSR-safe", () => expect(pushCapability()).toBe("unsupported"));
  it("detects secure desktop and Android support", () =>
    expect(pushCapability(target, nav)).toBe("supported"));
  it("requires HTTPS", () =>
    expect(pushCapability({ ...target, isSecureContext: false }, nav)).toBe("insecure"));
  it("detects missing APIs", () =>
    expect(pushCapability({ isSecureContext: true } as Window, nav)).toBe("unsupported"));
  it("requires Home Screen launch on iOS", () =>
    expect(pushCapability(target, { ...nav, userAgent: "iPhone" })).toBe("ios-install"));
  it("supports iOS standalone when APIs exist", () =>
    expect(
      pushCapability({ ...target, matchMedia: () => ({ matches: true }) } as unknown as Window, {
        ...nav,
        userAgent: "iPhone",
      }),
    ).toBe("supported"));
  it("detects iPad desktop UA", () =>
    expect(pushCapability(target, { ...nav, platform: "MacIntel", maxTouchPoints: 5 })).toBe(
      "ios-install",
    ));
  it("rejects absent, malformed and non-P256 public keys", () => {
    for (const value of [undefined, "secret", "A".repeat(87)])
      expect(publicPushKey(value)).toBeNull();
    expect(publicPushKey(key)?.length).toBe(65);
  });
});
describe("Web Push lifecycle", () => {
  it("does not re-prompt a blocked browser", async () => {
    const f = fixture();
    f.notification.permission = "denied";
    expect(await enablePush(f.options)).toBeNull();
    expect(f.notification.requestPermission).not.toHaveBeenCalled();
    expect(f.registration.pushManager.subscribe).not.toHaveBeenCalled();
  });
  it("re-registers after a public key change", async () => {
    const f = fixture(true);
    const changedKey = "B" + "B".repeat(86);
    await enablePush({ ...f.options, publicKey: changedKey });
    expect(f.store.remove).toHaveBeenCalledWith(f.subscription.endpoint);
    expect(f.subscription.unsubscribe).toHaveBeenCalledOnce();
    expect(f.registration.pushManager.subscribe).toHaveBeenCalledOnce();
    expect(f.store.save).toHaveBeenCalledWith(
      expect.objectContaining({ application_server_key: changedKey }),
    );
  });
  it("revokes if the session changes during the backend save", async () => {
    const f = fixture();
    f.stillAuthenticated
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValue(false);
    await expect(enablePush(f.options)).rejects.toThrow("Session changed");
    expect(f.subscription.unsubscribe).toHaveBeenCalled();
  });
  it("reports a stale browser subscription as needing persistence repair", async () => {
    const f = fixture(true);
    vi.mocked(f.store.has).mockResolvedValue(false);
    expect((await inspectPush(f.registration, f.store)).saved).toBe(false);
    expect(f.store.save).not.toHaveBeenCalled();
  });
  it("never prompts or writes on initial inspection", async () => {
    const f = fixture(true);
    expect((await inspectPush(f.registration, f.store)).saved).toBe(true);
    expect(f.notification.requestPermission).not.toHaveBeenCalled();
    expect(f.store.save).not.toHaveBeenCalled();
  });
  it("requests permission before the first asynchronous operation", async () => {
    const f = fixture();
    const pending = enablePush(f.options);
    expect(f.notification.requestPermission).toHaveBeenCalledOnce();
    expect(f.stillAuthenticated).not.toHaveBeenCalled();
    expect(await pending).toBe(f.subscription);
    expect(f.registration.pushManager.subscribe).toHaveBeenCalledWith({
      userVisibleOnly: true,
      applicationServerKey: publicPushKey(key),
    });
    expect(f.store.save).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: f.subscription.endpoint, application_server_key: key }),
    );
  });
  it.each(["denied", "default"] as const)(
    "does not subscribe on %s permission",
    async (permission) => {
      const f = fixture();
      f.notification.requestPermission.mockResolvedValue(permission);
      expect(await enablePush(f.options)).toBeNull();
      expect(f.store.save).not.toHaveBeenCalled();
    },
  );
  it("does not re-prompt when already granted", async () => {
    const f = fixture(true);
    f.notification.permission = "granted";
    await enablePush(f.options);
    expect(f.notification.requestPermission).not.toHaveBeenCalled();
    expect(f.registration.pushManager.subscribe).not.toHaveBeenCalled();
    expect(f.store.save).toHaveBeenCalledOnce();
  });
  it("does not prompt when configuration is absent", async () => {
    const f = fixture();
    await expect(enablePush({ ...f.options, publicKey: "" })).rejects.toThrow("configured");
    expect(f.notification.requestPermission).not.toHaveBeenCalled();
  });
  it("revokes newly created subscriptions when persistence fails", async () => {
    const f = fixture();
    vi.mocked(f.store.save).mockRejectedValue(new Error("offline"));
    await expect(enablePush(f.options)).rejects.toThrow("offline");
    expect(f.subscription.unsubscribe).toHaveBeenCalledOnce();
  });
  it("retains an existing endpoint for retry after persistence failure", async () => {
    const f = fixture(true);
    vi.mocked(f.store.save).mockRejectedValue(new Error("offline"));
    await expect(enablePush(f.options)).rejects.toThrow("offline");
    expect(f.subscription.unsubscribe).not.toHaveBeenCalled();
  });
  it("refuses creation after account/session change", async () => {
    const f = fixture();
    f.stillAuthenticated.mockResolvedValue(false);
    await expect(enablePush(f.options)).rejects.toThrow("Session changed");
    expect(f.store.save).not.toHaveBeenCalled();
  });
  it("revokes when the account changes during creation", async () => {
    const f = fixture();
    f.stillAuthenticated.mockResolvedValueOnce(true).mockResolvedValue(false);
    await expect(enablePush(f.options)).rejects.toThrow("Session changed");
    expect(f.subscription.unsubscribe).toHaveBeenCalled();
    expect(f.store.save).not.toHaveBeenCalled();
  });
  it("deletes only this endpoint and then unsubscribes", async () => {
    const f = fixture(true);
    await disablePush(f.registration, f.store);
    expect(f.store.remove).toHaveBeenCalledWith(f.subscription.endpoint);
    expect(f.subscription.unsubscribe).toHaveBeenCalledOnce();
  });
  it("keeps the endpoint for retry if backend deletion fails", async () => {
    const f = fixture(true);
    vi.mocked(f.store.remove).mockRejectedValue(new Error("offline"));
    await expect(disablePush(f.registration, f.store)).rejects.toThrow();
    expect(f.subscription.unsubscribe).not.toHaveBeenCalled();
  });
  it("handles already unsubscribed browsers", async () => {
    const f = fixture();
    await disablePush(f.registration, f.store);
    expect(f.store.remove).not.toHaveBeenCalled();
  });
});
