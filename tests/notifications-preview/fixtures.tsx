import { useSyncExternalStore } from "react";
import {
  defaultNotificationPreferences,
  type NotificationPreferences,
} from "../../src/lib/notification-preferences";
let userId = "fixture-a";
const listeners = new Set<() => void>();
export function switchAccount() {
  userId = userId === "fixture-a" ? "fixture-b" : "fixture-a";
  listeners.forEach((fn) => fn());
}
export function useSession() {
  const id = useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    () => userId,
  );
  return { user: { id } };
}
const params = new URLSearchParams(location.search);
let fail = params.has("fail");
export function toggleFailure() {
  fail = !fail;
}
const rows = new Map<string, NotificationPreferences>();
export function notificationPreferencesStore(id: string) {
  return {
    async read() {
      if (params.has("load-error")) throw new Error("fixture");
      return rows.get(id) ?? { ...defaultNotificationPreferences };
    },
    async save(patch: Partial<NotificationPreferences>) {
      if (fail) throw new Error("fixture");
      const saved = { ...(rows.get(id) ?? defaultNotificationPreferences), ...patch };
      rows.set(id, saved);
      return saved;
    },
  };
}
export const supabase = {
  auth: {
    async getSession() {
      return { data: { session: { user: { id: userId } } } };
    },
  },
};
const endpoints = new Set<string>();
export function pushStore(id: string) {
  return {
    async has() {
      return endpoints.has(id);
    },
    async save() {
      if (fail) throw new Error("fixture");
      endpoints.add(id);
    },
    async remove() {
      if (fail) throw new Error("fixture");
      endpoints.delete(id);
    },
  };
}
let subscription: object | null = null;
let prompts = 0;
let permission = params.get("permission") ?? "default";
if (!params.has("unsupported")) {
  Object.defineProperty(window, "PushManager", { configurable: true, value: class {} });
  Object.defineProperty(window, "Notification", {
    configurable: true,
    value: {
      get permission() {
        return permission;
      },
      async requestPermission() {
        prompts++;
        permission = "granted";
        return permission;
      },
    },
  });
} else Reflect.deleteProperty(window, "PushManager");
const registration = {
  pushManager: {
    async getSubscription() {
      return subscription;
    },
    async subscribe(options: object) {
      subscription = {
        options,
        endpoint: "https://fcm.googleapis.com/fcm/send/synthetic",
        expirationTime: null,
        toJSON: () => ({ keys: { p256dh: "B" + "A".repeat(86), auth: "A".repeat(22) } }),
        async unsubscribe() {
          subscription = null;
          return true;
        },
      };
      return subscription;
    },
  },
};
Object.defineProperty(navigator, "serviceWorker", {
  configurable: true,
  value: { ready: Promise.resolve(registration) },
});
export function fixtureStatus() {
  return `Permission prompts: ${prompts}. Device subscriptions: ${endpoints.size}.`;
}
