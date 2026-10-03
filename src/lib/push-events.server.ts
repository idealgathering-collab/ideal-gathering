import { createHash } from "node:crypto";
import {
  deliverUserPush,
  pushDependencies,
  validatePushPayload,
  validateVapidConfig,
  type PushPayload,
} from "./push-delivery.server";

export const eventKinds = [
  "gathering_joined",
  "gathering_updated",
  "gathering_cancelled",
  "gathering_reminder",
  "account_ready",
  "venue_approved",
  "venue_rejected",
  "chat_message",
] as const;
export type PushEventKind = (typeof eventKinds)[number];
export type PushEvent = {
  id: string;
  kind: PushEventKind;
  recipient_id: string;
  resource_id: string;
};

const copy: Record<PushEventKind, { en: string; fa: string }> = {
  gathering_joined: {
    en: "You have joined a gathering. Open Havato for details.",
    fa: "به دورهمی پیوستید. برای جزئیات هواتو را باز کنید.",
  },
  gathering_updated: {
    en: "A gathering has been updated. Open Havato for details.",
    fa: "اطلاعات دورهمی تغییر کرده است. برای جزئیات هواتو را باز کنید.",
  },
  gathering_cancelled: {
    en: "A gathering has been cancelled. Open Havato for details.",
    fa: "دورهمی لغو شده است. برای جزئیات هواتو را باز کنید.",
  },
  gathering_reminder: {
    en: "Your gathering starts soon. Open Havato for details.",
    fa: "دورهمی شما به‌زودی شروع می‌شود. برای جزئیات هواتو را باز کنید.",
  },
  account_ready: {
    en: "Your Havato access is ready. Open the app to continue.",
    fa: "دسترسی شما به هواتو آماده است. برای ادامه برنامه را باز کنید.",
  },
  venue_approved: {
    en: "Your venue has been approved. Open Havato for details.",
    fa: "محل شما تأیید شده است. برای جزئیات هواتو را باز کنید.",
  },
  venue_rejected: {
    en: "Your venue review is complete. Open Havato for details.",
    fa: "بررسی محل شما انجام شده است. برای جزئیات هواتو را باز کنید.",
  },
  chat_message: {
    en: "You have a new gathering message. Open Havato to read it.",
    fa: "پیام جدیدی در دورهمی دارید. برای خواندن آن هواتو را باز کنید.",
  },
};

// Existing language is browser-local, unavailable to trusted server dispatch.
// Persian is Havato's existing default; English is ready without adding preferences.
export function buildEventPayload(event: PushEvent, language: unknown = "fa"): PushPayload {
  if (!eventKinds.includes(event.kind)) throw new Error("Unknown push event");
  const lang = language === "en" ? "en" : "fa";
  return validatePushPayload({
    version: 1,
    title: "Havato / هواتو",
    body: copy[event.kind][lang],
    lang,
    // Reuse already validated destinations and their existing auth/access gates.
    url: event.kind === "account_ready" || event.kind.startsWith("venue_") ? "/pending" : "/",
    tag: `havato-${createHash("sha256").update(event.id).digest("hex").slice(0, 32)}`,
  });
}

export function reminderLeadMinutes(value: string | undefined): number {
  if (value === undefined) return 60;
  if (!/^\d+$/.test(value)) throw new Error("Invalid reminder lead");
  const number = Number(value);
  if (number < 1 || number > 1440) throw new Error("Invalid reminder lead");
  return number;
}

export function createEventRunner(dependencies: {
  claim: (lead: number) => Promise<PushEvent[]>;
  send: (event: PushEvent, payload: PushPayload) => Promise<unknown>;
  log: (code: string) => void;
}) {
  let running = false;
  return async (lead: number) => {
    if (running) return;
    running = true;
    try {
      const events = await dependencies.claim(lead);
      for (const event of events) {
        try {
          await dependencies.send(event, buildEventPayload(event));
        } catch {
          dependencies.log("event_delivery_failed");
        }
      }
    } catch {
      dependencies.log("event_claim_failed");
    } finally {
      running = false;
    }
  };
}

const runEvents = createEventRunner({
  async claim(lead) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("havato_claim_push_events", {
      _lead_minutes: lead,
    });
    if (error) throw new Error("Event claim unavailable");
    return (data ?? []) as PushEvent[];
  },
  async send(event, payload) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("havato_push_event_eligible", {
      _id: event.id,
    });
    if (error) throw new Error("Event authorization unavailable");
    if (data !== true) return;
    return deliverUserPush(
      pushDependencies,
      event.recipient_id,
      payload,
      validateVapidConfig(process.env),
    );
  },
  log: (code) => console.warn("[Havato push]", code),
});

let timer: ReturnType<typeof setInterval> | undefined;
export function startPushEventTimer() {
  if (timer || process.env.SUPABASE_URL !== "https://ntmnpmdjfrbporcvafei.supabase.co") return;
  try {
    validateVapidConfig(process.env); // Do not consume events if sender configuration is invalid.
    const lead = reminderLeadMinutes(process.env.WEB_PUSH_REMINDER_LEAD_MINUTES);
    timer = setInterval(() => {
      void runEvents(lead);
    }, 60_000);
    timer.unref();
    void runEvents(lead);
  } catch {
    console.warn("[Havato push]", "event_configuration_unavailable");
  }
}
