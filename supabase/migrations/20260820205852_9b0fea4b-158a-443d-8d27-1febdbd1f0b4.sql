-- Blocks
CREATE TABLE public.user_blocks (
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT no_self_block CHECK (blocker_id <> blocked_id)
);
GRANT SELECT, INSERT, DELETE ON public.user_blocks TO authenticated;
GRANT ALL ON public.user_blocks TO service_role;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own blocks select" ON public.user_blocks FOR SELECT TO authenticated USING (blocker_id = auth.uid());
CREATE POLICY "own blocks insert" ON public.user_blocks FOR INSERT TO authenticated WITH CHECK (blocker_id = auth.uid());
CREATE POLICY "own blocks delete" ON public.user_blocks FOR DELETE TO authenticated USING (blocker_id = auth.uid());

CREATE OR REPLACE FUNCTION private.is_blocked_pair(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = _a AND blocked_id = _b) OR (blocker_id = _b AND blocked_id = _a)
  )
$$;
REVOKE ALL ON FUNCTION private.is_blocked_pair(uuid, uuid) FROM PUBLIC, anon, authenticated;

-- Reports
CREATE TYPE public.report_target AS ENUM ('user','gathering');
CREATE TYPE public.report_status AS ENUM ('open','resolved','dismissed');

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type public.report_target NOT NULL,
  target_id uuid NOT NULL,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  gathering_id uuid REFERENCES public.gatherings(id) ON DELETE SET NULL,
  reason text NOT NULL,
  details text,
  status public.report_status NOT NULL DEFAULT 'open',
  admin_note text,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT no_self_report CHECK (target_user_id IS NULL OR reporter_id <> target_user_id)
);
GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports select own or admin" ON public.reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "reports insert own" ON public.reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "reports update admin" ON public.reports FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.clamp_new_report()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private AS $$
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.status := 'open';
    NEW.admin_note := NULL;
    NEW.resolved_at := NULL;
    NEW.resolved_by := NULL;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER reports_clamp_insert BEFORE INSERT ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.clamp_new_report();

CREATE OR REPLACE FUNCTION public.prevent_report_status_change_non_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private AS $$
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can update reports';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER reports_status_admin_only BEFORE UPDATE ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.prevent_report_status_change_non_admin();

CREATE INDEX reports_status_created_idx ON public.reports (status, created_at DESC);
CREATE UNIQUE INDEX reports_open_unique_idx ON public.reports (reporter_id, target_type, target_id) WHERE status = 'open';