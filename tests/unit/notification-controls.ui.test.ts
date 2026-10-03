// Opt-in DOM integration; no browser permission or live database/provider.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { pathToFileURL } from "node:url";
import { PushNotificationEntry } from "../../src/components/push-notification-entry";
import { defaultNotificationPreferences as defaults } from "../../src/lib/notification-preferences";
const fixture = vi.hoisted(() => ({
  lang: "fa",
  userId: "a",
  read: vi.fn(),
  save: vi.fn(),
  has: vi.fn(),
  storeSave: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("@/hooks/use-session", () => ({ useSession: () => ({ user: { id: fixture.userId } }) }));
vi.mock("@/i18n", () => ({ useI18n: () => ({ lang: fixture.lang }) }));
vi.mock("@/lib/notification-preferences-store", () => ({
  notificationPreferencesStore: () => ({ read: fixture.read, save: fixture.save }),
}));
vi.mock("@/lib/push-store", () => ({
  pushStore: () => ({ has: fixture.has, save: fixture.storeSave, remove: fixture.remove }),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getSession: async () => ({ data: { session: { user: { id: fixture.userId } } } }) },
  },
}));

describe.skipIf(!process.env.HAVATO_TEST_JSDOM)("notification controls DOM integration", () => {
  let root: Root;
  let host: HTMLElement;
  let dom: { window: Window & typeof globalThis; close?: () => void };
  let subscription: PushSubscription | null;
  let permission: NotificationPermission;
  let requestPermission: ReturnType<typeof vi.fn>;
  let subscribe: ReturnType<typeof vi.fn>;
  let unsubscribe: ReturnType<typeof vi.fn>;
  async function render() {
    await act(async () => {
      root.render(createElement(PushNotificationEntry));
    });
  }
  async function click(element: Element) {
    await act(async () => {
      (element as HTMLElement).click();
    });
  }
  const switches = () =>
    Array.from(host.querySelectorAll<HTMLButtonElement>('button[role="switch"]'));
  beforeEach(async () => {
    const { JSDOM } = await import(
      /* @vite-ignore */ pathToFileURL(process.env.HAVATO_TEST_JSDOM!).href
    );
    dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
      url: "http://localhost",
    });
    vi.stubGlobal("window", dom.window);
    vi.stubGlobal("document", dom.window.document);
    vi.stubGlobal("navigator", dom.window.navigator);
    vi.stubGlobal("HTMLElement", dom.window.HTMLElement);
    vi.stubGlobal("HTMLFormElement", dom.window.HTMLFormElement);
    vi.stubGlobal("HTMLInputElement", dom.window.HTMLInputElement);
    vi.stubGlobal("Element", dom.window.Element);
    vi.stubGlobal("Node", dom.window.Node);
    vi.stubGlobal("Event", dom.window.Event);
    vi.stubGlobal("CustomEvent", dom.window.CustomEvent);
    vi.stubGlobal("MutationObserver", dom.window.MutationObserver);
    vi.stubGlobal("getComputedStyle", dom.window.getComputedStyle.bind(dom.window));
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    Object.defineProperty(dom.window, "isSecureContext", { value: true });
    Object.defineProperty(dom.window, "PushManager", { configurable: true, value: class {} });
    permission = "default";
    subscription = null;
    requestPermission = vi.fn(async () => {
      permission = "granted";
      return permission;
    });
    const notification = {
      get permission() {
        return permission;
      },
      requestPermission,
    };
    Object.defineProperty(dom.window, "Notification", { configurable: true, value: notification });
    vi.stubGlobal("Notification", notification);
    vi.stubEnv("VITE_WEB_PUSH_VAPID_PUBLIC_KEY", "B" + "A".repeat(86));
    unsubscribe = vi.fn(async () => {
      subscription = null;
      return true;
    });
    subscribe = vi.fn(async (options) => {
      subscription = {
        endpoint: "https://fcm.googleapis.com/fcm/send/fixture",
        expirationTime: null,
        options,
        unsubscribe,
        toJSON: () => ({ keys: { p256dh: "B" + "A".repeat(86), auth: "A".repeat(22) } }),
      } as unknown as PushSubscription;
      return subscription;
    });
    Object.defineProperty(dom.window.navigator, "serviceWorker", {
      configurable: true,
      value: {
        ready: Promise.resolve({
          pushManager: { getSubscription: async () => subscription, subscribe },
        }),
      },
    });
    fixture.lang = "fa";
    fixture.userId = "a";
    fixture.read.mockReset().mockResolvedValue({ ...defaults });
    fixture.save.mockReset().mockImplementation(async (patch) => ({ ...defaults, ...patch }));
    fixture.has.mockReset().mockResolvedValue(false);
    fixture.storeSave.mockReset().mockResolvedValue(undefined);
    fixture.remove.mockReset().mockResolvedValue(undefined);
    host = document.getElementById("root")!;
    root = createRoot(host);
  }, 30000);
  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    dom.window.close();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
  it.each(["fa", "en"])(
    "renders %s labels/direction and five simple switches without prompting",
    async (lang) => {
      fixture.lang = lang;
      await render();
      expect(switches()).toHaveLength(5);
      expect(host.querySelector(`[dir="${lang === "fa" ? "rtl" : "ltr"}"]`)).not.toBeNull();
      expect(host.textContent).toContain(
        lang === "fa" ? "دریافت اعلان‌ها" : "Receive notifications",
      );
      expect(requestPermission).not.toHaveBeenCalled();
    },
  );
  it("saves master-off and disables category controls", async () => {
    await render();
    await click(switches()[0]);
    expect(fixture.save).toHaveBeenCalledWith({ enabled: false });
    expect(switches()[0].getAttribute("aria-checked")).toBe("false");
    expect(
      switches()
        .slice(1)
        .every((s) => s.disabled),
    ).toBe(true);
  });
  it("category changes send only that choice", async () => {
    await render();
    await click(switches()[3]);
    expect(fixture.save).toHaveBeenCalledWith({ chat_messages: false });
    expect(switches()[3].getAttribute("aria-checked")).toBe("false");
  });
  it("save failure retains last saved values and shows retryable error", async () => {
    fixture.save.mockRejectedValue(new Error("fixture"));
    await render();
    await click(switches()[0]);
    expect(switches()[0].getAttribute("aria-checked")).toBe("true");
    expect(host.textContent).toContain("تنظیمات ذخیره نشد");
  });
  it("load failure does not show invented enabled preferences; retry loads them", async () => {
    fixture.read.mockRejectedValueOnce(new Error("fixture"));
    await render();
    expect(switches()).toHaveLength(0);
    await click(
      Array.from(host.querySelectorAll("button")).find((b) => b.textContent === "تلاش مجدد")!,
    );
    expect(switches()).toHaveLength(5);
  });
  it("denied permission has a disabled enable button and never prompts", async () => {
    permission = "denied";
    await render();
    expect(host.textContent).toContain("اعلان‌ها مسدود هستند");
    const enable = Array.from(host.querySelectorAll("button")).find(
      (b) => b.textContent === "فعال‌کردن اعلان‌ها",
    )!;
    expect(enable.disabled).toBe(true);
    await click(enable);
    expect(requestPermission).not.toHaveBeenCalled();
    expect(switches()).toHaveLength(5);
  });
  it("unsupported browsers show clear state and retain account-wide controls", async () => {
    Reflect.deleteProperty(dom.window, "PushManager");
    await render();
    expect(host.textContent).toContain("این مرورگر از اعلان وب پشتیبانی نمی‌کند");
    expect(requestPermission).not.toHaveBeenCalled();
    expect(switches()).toHaveLength(5);
  });
  it("subscribes only after a tap and unsubscribes this device separately", async () => {
    await render();
    await click(
      Array.from(host.querySelectorAll("button")).find(
        (b) => b.textContent === "فعال‌کردن اعلان‌ها",
      )!,
    );
    expect(requestPermission).toHaveBeenCalledTimes(1);
    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(fixture.storeSave).toHaveBeenCalledTimes(1);
    await click(
      Array.from(host.querySelectorAll("button")).find(
        (b) => b.textContent === "غیرفعال‌کردن در این دستگاه",
      )!,
    );
    expect(fixture.remove).toHaveBeenCalledTimes(1);
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(fixture.save).not.toHaveBeenCalled();
  });
  it("saves a reliable English push language independently of UI language", async () => {
    await render();
    const select = host.querySelector("select")!;
    await act(async () => {
      select.value = "en";
      select.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    });
    expect(fixture.save).toHaveBeenCalledWith({ language: "en" });
    expect(select.value).toBe("en");
  });
  it("clears the old account's preference controls while loading a new account", async () => {
    await render();
    fixture.userId = "b";
    fixture.read.mockReturnValue(new Promise(() => {}));
    await render();
    expect(switches()).toHaveLength(0);
  });
});
