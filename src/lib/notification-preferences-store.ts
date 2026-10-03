import { supabase } from "@/integrations/supabase/client";
import {
  defaultNotificationPreferences,
  type NotificationPreferences,
} from "./notification-preferences";

export function notificationPreferencesStore(userId: string) {
  return {
    async read(): Promise<NotificationPreferences> {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select(
          "enabled,gathering_reminders,gathering_updates,chat_messages,account_venue_status,language",
        )
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw new Error("Could not load notification preferences");
      return data
        ? { ...data, language: data.language === "en" ? "en" : "fa" }
        : { ...defaultNotificationPreferences };
    },
    async save(patch: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
      // Partial upserts preserve unrelated choices made from another device.
      const { data, error } = await supabase
        .from("notification_preferences")
        .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" })
        .select(
          "enabled,gathering_reminders,gathering_updates,chat_messages,account_venue_status,language",
        )
        .single();
      if (error) throw new Error("Could not save notification preferences");
      return { ...data, language: data.language === "en" ? "en" : "fa" };
    },
  };
}
