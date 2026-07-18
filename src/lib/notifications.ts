import { supabase } from "@/integrations/supabase/client";

export type NotificationType =
  | "business_approved"
  | "business_rejected"
  | "gathering_approved"
  | "gathering_rejected";

export type NotificationRow = {
  id: string;
  recipient_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  related_id: string | null;
  read: boolean;
  created_at: string;
};

export async function fetchMyNotifications(userId: string): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from("notifications" as any)
    .select("*")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as NotificationRow[];
}

export async function markAllRead(userId: string) {
  const { error } = await supabase
    .from("notifications" as any)
    .update({ read: true })
    .eq("recipient_id", userId)
    .eq("read", false);
  if (error) throw error;
}

export async function insertNotification(input: {
  recipient_id: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  related_id?: string | null;
}) {
  const { error } = await supabase.from("notifications" as any).insert({
    recipient_id: input.recipient_id,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    related_id: input.related_id ?? null,
  } as any);
  if (error) throw error;
}

export function relativeTime(iso: string, lang: "en" | "tr" | "fa" = "en"): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(-Math.round(diff), "second");
  if (abs < 3600) return rtf.format(-Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(-Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(-Math.round(diff / 86400), "day");
  return new Date(iso).toLocaleDateString(lang);
}
