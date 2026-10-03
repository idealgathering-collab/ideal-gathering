-- Additive Havato-only Phase 4. No backfill; absent rows preserve delivery.
CREATE TABLE public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  gathering_reminders boolean NOT NULL DEFAULT true,
  gathering_updates boolean NOT NULL DEFAULT true,
  chat_messages boolean NOT NULL DEFAULT true,
  account_venue_status boolean NOT NULL DEFAULT true,
  language text NOT NULL DEFAULT 'fa' CHECK (language IN ('fa', 'en'))
);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notification_preferences FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;
GRANT SELECT ON public.notification_preferences TO service_role;
CREATE POLICY notification_preferences_read_own ON public.notification_preferences
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY notification_preferences_insert_own ON public.notification_preferences
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY notification_preferences_update_own ON public.notification_preferences
  FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
NOTIFY pgrst, 'reload schema';
