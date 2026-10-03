import { createECDH, timingSafeEqual } from "node:crypto";
import webpush from "web-push";

const APP_ORIGIN = "https://havato-test.darkube.ir";
const BACKEND_ORIGIN = "https://ntmnpmdjfrbporcvafei.supabase.co";
const MAX_SUBSCRIPTIONS = 20;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PushPayload = {
  version: 1;
  title: string;
  body: string;
  url: string;
  tag: string;
  lang: "en" | "fa";
};
export type StoredSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
  application_server_key: string;
  updated_at: string;
};
export type VapidConfig = { subject: string; publicKey: string; privateKey: string };
type Environment = Record<string, string | undefined>;

export function validateVapidConfig(env: Environment): VapidConfig {
  const publicKey = env.WEB_PUSH_VAPID_PUBLIC_KEY ?? "";
  const privateKey = env.WEB_PUSH_VAPID_PRIVATE_KEY ?? "";
  const subject = env.WEB_PUSH_VAPID_SUBJECT ?? "";
  try {
    if (!/^[A-Za-z0-9_-]{87}$/.test(publicKey) || !/^[A-Za-z0-9_-]{43}$/.test(privateKey))
      throw new Error();
    const publicBytes = Buffer.from(publicKey, "base64url");
    const privateBytes = Buffer.from(privateKey, "base64url");
    if (
      publicBytes.toString("base64url") !== publicKey ||
      privateBytes.toString("base64url") !== privateKey
    )
      throw new Error();
    const curve = createECDH("prime256v1");
    curve.setPrivateKey(privateBytes);
    if (!timingSafeEqual(curve.getPublicKey(), publicBytes)) throw new Error();
    const contact = new URL(subject);
    if (contact.protocol === "mailto:") {
      if (!/^[^\s?@]+@[^\s?@]+\.[^\s?@]+$/.test(contact.pathname) || contact.search || contact.hash)
        throw new Error();
    } else if (
      contact.protocol !== "https:" ||
      contact.username ||
      contact.password ||
      contact.hostname === "localhost"
    )
      throw new Error();
  } catch {
    throw new Error("Invalid Web Push VAPID configuration");
  }
  return { subject, publicKey, privateKey };
}

export function validatePushPayload(value: unknown): PushPayload {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid push payload");
  const payload = value as Record<string, unknown>;
  if (
    Object.keys(payload).some(
      (key) => !["version", "title", "body", "url", "tag", "lang"].includes(key),
    ) ||
    payload.version !== 1 ||
    !["en", "fa"].includes(String(payload.lang))
  )
    throw new Error("Invalid push payload");
  for (const [key, maximum] of [
    ["title", 100],
    ["body", 500],
    ["url", 512],
    ["tag", 64],
  ] as const) {
    if (
      typeof payload[key] !== "string" ||
      !payload[key].trim() ||
      payload[key].length > maximum ||
      /[\p{Cc}\\]/u.test(payload[key])
    )
      throw new Error("Invalid push payload");
  }
  const url = new URL(payload.url as string, APP_ORIGIN);
  if (
    url.origin !== APP_ORIGIN ||
    url.username ||
    url.password ||
    !/^\/(?:pending|settings)?$/.test(url.pathname) ||
    url.search ||
    url.hash
  )
    throw new Error("Invalid push URL");
  const result = { ...payload, url: url.pathname } as PushPayload;
  if (Buffer.byteLength(JSON.stringify(result), "utf8") > 3000)
    throw new Error("Push payload too large");
  return result;
}

export function safePushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    if (
      endpoint.length > 2048 ||
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      url.hash ||
      /[\s\\]/.test(endpoint)
    )
      return false;
    if (url.hostname === "fcm.googleapis.com") return /^\/fcm\/send\/[^/]+$/.test(url.pathname);
    if (url.hostname === "updates.push.services.mozilla.com")
      return /^\/wpush\/v2\/[^/]+$/.test(url.pathname);
    if (url.hostname === "web.push.apple.com") return /^\/[A-Za-z0-9/_-]+$/.test(url.pathname);
    if (/^[a-z0-9-]+\.notify\.windows\.com$/.test(url.hostname))
      return url.pathname === "/w/" && !!url.search;
    return false;
  } catch {
    return false;
  }
}

export type PushDependencies = {
  authenticate: (token: string) => Promise<string | null>;
  subscriptions: (userId: string) => Promise<StoredSubscription[]>;
  remove: (userId: string, subscription: StoredSubscription) => Promise<boolean>;
  send: (
    subscription: StoredSubscription,
    payload: PushPayload,
    config: VapidConfig,
  ) => Promise<void>;
  log: (code: string, status?: number) => void;
  now?: () => number;
};

async function readTestInput(request: Request): Promise<"en" | "fa"> {
  if (
    !/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "") ||
    !request.body
  )
    throw new Error();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.length;
      if (length > 512) {
        await reader.cancel();
        throw new Error();
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }
  const input: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error();
  const data = input as Record<string, unknown>;
  if (
    Object.keys(data).some((key) => key !== "lang") ||
    (data.lang !== undefined && data.lang !== "en" && data.lang !== "fa")
  )
    throw new Error();
  return data.lang === "fa" ? "fa" : "en";
}

export function createTestPushHandler(
  dependencies: PushDependencies,
  environment: () => Environment,
) {
  const lastAttempt = new Map<string, number>();
  const respond = (status: number, body: unknown) =>
    Response.json(body, {
      status,
      headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
    });
  return async (request: Request): Promise<Response> => {
    const env = environment();
    const allowed = (env.WEB_PUSH_TEST_USER_IDS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (!allowed.length) return respond(404, { error: "Not found" });
    if (
      env.SUPABASE_URL !== BACKEND_ORIGIN ||
      allowed.length > 16 ||
      allowed.some((id) => !UUID.test(id))
    )
      return respond(503, { error: "Push unavailable" });
    if (request.method !== "POST") return respond(405, { error: "Method not allowed" });
    if (request.headers.get("origin") !== APP_ORIGIN) return respond(403, { error: "Forbidden" });
    const authorization = request.headers.get("authorization") ?? "";
    if (!/^Bearer [^\s]+$/.test(authorization) || authorization.length > 8192)
      return respond(401, { error: "Unauthorized" });
    let userId: string | null;
    try {
      userId = await dependencies.authenticate(authorization.slice(7));
    } catch {
      return respond(503, { error: "Authentication unavailable" });
    }
    if (!userId) return respond(401, { error: "Unauthorized" });
    if (!allowed.includes(userId)) return respond(403, { error: "Forbidden" });
    let lang: "en" | "fa";
    try {
      lang = await readTestInput(request);
    } catch {
      return respond(400, { error: "Expected only optional lang: en or fa" });
    }
    let config: VapidConfig;
    try {
      config = validateVapidConfig(env);
    } catch {
      return respond(503, { error: "Push configuration unavailable" });
    }
    const now = dependencies.now?.() ?? Date.now();
    if (lastAttempt.has(userId) && now - lastAttempt.get(userId)! < 60_000)
      return respond(429, { error: "Wait one minute before retrying" });
    for (const [id, timestamp] of lastAttempt)
      if (now - timestamp >= 60_000) lastAttempt.delete(id);
    lastAttempt.set(userId, now);
    const payload = validatePushPayload({
      version: 1,
      title: "Havato / هواتو",
      lang,
      url: "/pending",
      tag: "havato-push-test",
      body:
        lang === "fa"
          ? "اعلان آزمایشی هواتو. برای باز کردن برنامه ضربه بزنید."
          : "Havato test notification. Tap to open the app.",
    });
    try {
      return respond(200, await deliverUserPush(dependencies, userId, payload, config));
    } catch (error) {
      if (error instanceof PushFanoutError)
        return respond(409, { error: "Too many subscriptions for test delivery" });
      return respond(503, { error: "Push delivery unavailable" });
    }
  };
}

export const pushDependencies: PushDependencies = {
  async authenticate(token) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    return error ? null : (data.user?.id ?? null);
  },
  async subscriptions(userId) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("endpoint,p256dh,auth,application_server_key,updated_at")
      .eq("user_id", userId)
      .limit(MAX_SUBSCRIPTIONS + 1);
    if (error) throw new Error("Subscription read failed");
    return data ?? [];
  },
  async remove(userId, subscription) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId)
      .eq("endpoint", subscription.endpoint)
      .eq("updated_at", subscription.updated_at)
      .eq("p256dh", subscription.p256dh)
      .eq("auth", subscription.auth)
      .eq("application_server_key", subscription.application_server_key)
      .select("endpoint");
    if (error) throw new Error("Subscription cleanup failed");
    return !!data?.length;
  },
  async send(subscription, payload, config) {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
      {
        vapidDetails: config,
        TTL: 300,
        timeout: 10_000,
        contentEncoding: "aes128gcm",
        urgency: "normal",
      },
    );
  },
  log: (code, status) => console.warn("[Havato push]", code, status ?? "network_or_validation"),
};

export const handleTestPush = createTestPushHandler(pushDependencies, () => process.env);

class PushFanoutError extends Error {}

export async function deliverUserPush(
  dependencies: PushDependencies,
  userId: string,
  input: PushPayload,
  config: VapidConfig,
) {
  if (!UUID.test(userId)) throw new Error("Invalid recipient");
  const payload = validatePushPayload(input);
  const summary = { accepted: 0, removed: 0, failed: 0, skipped: 0 };
  try {
    const subscriptions = await dependencies.subscriptions(userId);
    if (subscriptions.length > MAX_SUBSCRIPTIONS)
      throw new PushFanoutError("Too many subscriptions for delivery");
    for (const subscription of subscriptions) {
      if (
        subscription.application_server_key !== config.publicKey ||
        !safePushEndpoint(subscription.endpoint) ||
        !/^[A-Za-z0-9_-]{87}$/.test(subscription.p256dh) ||
        !/^[A-Za-z0-9_-]{22}$/.test(subscription.auth)
      ) {
        summary.skipped++;
        dependencies.log("subscription_skipped");
        continue;
      }
      try {
        await dependencies.send(subscription, payload, config);
        summary.accepted++;
      } catch (error) {
        const candidate =
          error && typeof error === "object"
            ? (error as { statusCode?: unknown }).statusCode
            : undefined;
        const status =
          typeof candidate === "number" && Number.isInteger(candidate) ? candidate : undefined;
        if (status === 404 || status === 410) {
          try {
            if (await dependencies.remove(userId, subscription)) summary.removed++;
            else summary.skipped++;
          } catch {
            summary.failed++;
            dependencies.log("stale_cleanup_failed", status);
          }
        } else {
          summary.failed++;
          dependencies.log("provider_delivery_failed", status);
        }
      }
    }
    return summary;
  } catch (error) {
    if (error instanceof PushFanoutError) throw error;
    dependencies.log("subscription_read_failed");
    throw new Error("Push delivery unavailable");
  }
}
