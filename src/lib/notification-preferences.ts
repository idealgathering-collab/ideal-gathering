export const defaultNotificationPreferences = {
  enabled: true,
  gathering_reminders: true,
  gathering_updates: true,
  chat_messages: true,
  account_venue_status: true,
  language: "fa" as "fa" | "en",
};
export type NotificationPreferences = typeof defaultNotificationPreferences;
export type NotificationToggle = Exclude<keyof NotificationPreferences, "language">;

export const notificationCategories = {
  gathering_joined: "gathering_updates",
  gathering_updated: "gathering_updates",
  gathering_cancelled: "gathering_updates",
  gathering_reminder: "gathering_reminders",
  account_ready: "account_venue_status",
  venue_approved: "account_venue_status",
  venue_rejected: "account_venue_status",
  chat_message: "chat_messages",
} as const;

// Only a genuinely absent row gets defaults. Read errors must fail closed.
export function notificationAllowed(
  preferences: NotificationPreferences | null,
  kind: keyof typeof notificationCategories,
) {
  const p = preferences ?? defaultNotificationPreferences;
  return p.enabled === true && p[notificationCategories[kind]] === true;
}
