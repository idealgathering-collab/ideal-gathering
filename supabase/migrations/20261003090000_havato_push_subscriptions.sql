-- Havato notifications Phase 1. Apply only to the isolated Havato project.
CREATE TABLE public.push_subscriptions (
  endpoint text PRIMARY KEY CHECK (length(endpoint) BETWEEN 12 AND 2048 AND endpoint ~ '^https://[^/@[:space:]]+/' ),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  p256dh text NOT NULL CHECK (p256dh ~ '^[A-Za-z0-9_-]{87}$'),
  auth text NOT NULL CHECK (auth ~ '^[A-Za-z0-9_-]{22}$'),
  application_server_key text NOT NULL CHECK (application_server_key ~ '^[A-Za-z0-9_-]{87}$'),
  expiration_time timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX push_subscriptions_user_id_idx ON public.push_subscriptions(user_id);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.push_subscriptions FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
CREATE POLICY push_read_own ON public.push_subscriptions FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY push_insert_own ON public.push_subscriptions FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY push_update_own ON public.push_subscriptions FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY push_delete_own ON public.push_subscriptions FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE FUNCTION public.stamp_push_subscription() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.created_at := OLD.created_at;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.stamp_push_subscription() FROM PUBLIC;
CREATE TRIGGER stamp_push_subscription BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.stamp_push_subscription();
