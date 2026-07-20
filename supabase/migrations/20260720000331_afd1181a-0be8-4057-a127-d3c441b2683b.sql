CREATE TABLE public.saved_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  address text NOT NULL,
  city text,
  neighborhood text,
  lat numeric,
  lng numeric,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reject_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_locations TO authenticated;
GRANT ALL ON public.saved_locations TO service_role;

ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_locations_own_select" ON public.saved_locations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "saved_locations_own_insert" ON public.saved_locations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "saved_locations_own_update" ON public.saved_locations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_locations_own_delete" ON public.saved_locations FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "saved_locations_admin_select" ON public.saved_locations FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "saved_locations_admin_update" ON public.saved_locations FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.prevent_saved_location_status_change_by_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, private AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NOT private.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can change saved location status';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_saved_locations_status_guard
  BEFORE UPDATE ON public.saved_locations
  FOR EACH ROW EXECUTE FUNCTION public.prevent_saved_location_status_change_by_owner();

CREATE TRIGGER trg_saved_locations_updated
  BEFORE UPDATE ON public.saved_locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();