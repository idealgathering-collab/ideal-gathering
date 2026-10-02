export type PushCapability = "supported" | "unsupported" | "insecure" | "ios-install";

export function pushCapability(target?: Window, nav?: Navigator): PushCapability {
  if (!target || !nav) return "unsupported";
  if (!target.isSecureContext) return "insecure";
  const ios =
    /iPad|iPhone|iPod/.test(nav.userAgent) ||
    (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);
  if (
    ios &&
    !target.matchMedia("(display-mode: standalone)").matches &&
    !(nav as Navigator & { standalone?: boolean }).standalone
  )
    return "ios-install";
  return "serviceWorker" in nav && "PushManager" in target && "Notification" in target
    ? "supported"
    : "unsupported";
}

export function publicPushKey(value: string | undefined): Uint8Array<ArrayBuffer> | null {
  if (!value || !/^[A-Za-z0-9_-]{87}$/.test(value)) return null;
  const bytes = Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/") + "="), (c) =>
    c.charCodeAt(0),
  );
  return bytes.length === 65 && bytes[0] === 4 ? bytes : null;
}

export type PushRecord = {
  endpoint: string;
  p256dh: string;
  auth: string;
  application_server_key: string;
  expiration_time: string | null;
};

export interface PushStore {
  save(record: PushRecord): Promise<void>;
  remove(endpoint: string): Promise<void>;
  has(endpoint: string): Promise<boolean>;
}

export function subscriptionRecord(subscription: PushSubscription, key: string): PushRecord {
  const json = subscription.toJSON();
  const endpoint = new URL(subscription.endpoint);
  if (
    endpoint.protocol !== "https:" ||
    endpoint.username ||
    endpoint.password ||
    subscription.endpoint.length > 2048 ||
    !json.keys?.p256dh ||
    !json.keys.auth
  ) {
    throw new Error("Invalid push subscription");
  }
  return {
    endpoint: subscription.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
    application_server_key: key,
    expiration_time:
      subscription.expirationTime === null
        ? null
        : new Date(subscription.expirationTime).toISOString(),
  };
}

// No permission, creation or database write happens during status inspection.
export async function inspectPush(registration: ServiceWorkerRegistration, store: PushStore) {
  const subscription = await registration.pushManager.getSubscription();
  return { subscription, saved: !!subscription && (await store.has(subscription.endpoint)) };
}

export async function enablePush(options: {
  registration: ServiceWorkerRegistration;
  store: PushStore;
  publicKey: string;
  notification: Pick<typeof Notification, "permission" | "requestPermission">;
  stillAuthenticated: () => Promise<boolean>;
}) {
  const { registration, store, publicKey, notification, stillAuthenticated } = options;
  const key = publicPushKey(publicKey);
  if (!key) throw new Error("Push is not configured");
  // This is the first async operation: preserve direct user activation on iOS.
  const permission =
    notification.permission === "default"
      ? await notification.requestPermission()
      : notification.permission;
  if (permission !== "granted") return null;
  if (!(await stillAuthenticated())) throw new Error("Session changed");
  let subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    const existingKey = subscription.options.applicationServerKey;
    if (
      !existingKey ||
      !key.every((byte, i) => new Uint8Array(existingKey)[i] === byte) ||
      new Uint8Array(existingKey).length !== key.length
    ) {
      await disablePush(registration, store);
      subscription = null;
    }
  }
  const created = !subscription;
  subscription ??= await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: key,
  });
  try {
    if (!(await stillAuthenticated())) throw new Error("Session changed");
    await store.save(subscriptionRecord(subscription, publicKey));
    if (!(await stillAuthenticated())) {
      await subscription.unsubscribe();
      throw new Error("Session changed");
    }
    return subscription;
  } catch (error) {
    // Do not leave an unpersisted newly-created browser subscription active.
    if (created) await subscription.unsubscribe().catch(() => false);
    throw error;
  }
}

export async function disablePush(registration: ServiceWorkerRegistration, store: PushStore) {
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  // Delete first: if persistence fails the browser endpoint remains available for retry.
  await store.remove(subscription.endpoint);
  const removed = await subscription.unsubscribe();
  if (!removed && (await registration.pushManager.getSubscription()))
    throw new Error("Unsubscribe failed");
}

export async function revokeBrowserPush() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager?.getSubscription();
  await subscription?.unsubscribe();
}
