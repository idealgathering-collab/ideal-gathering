
-- 1) WIPE BETA DATA
TRUNCATE TABLE public.gathering_attendees CASCADE;
TRUNCATE TABLE public.gatherings CASCADE;
TRUNCATE TABLE public.menu_items CASCADE;
TRUNCATE TABLE public.venue_tables CASCADE;
TRUNCATE TABLE public.businesses CASCADE;

-- 2) ROLE HELPERS + PRIMARY-ROLE CONSTRAINT
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_one_primary_idx
  ON public.user_roles (user_id)
  WHERE role IN ('user','venue');

CREATE OR REPLACE FUNCTION private.is_venue(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role = 'venue')
$$;
REVOKE ALL ON FUNCTION private.is_venue(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.is_user(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role = 'user')
$$;
REVOKE ALL ON FUNCTION private.is_user(uuid) FROM PUBLIC, anon, authenticated;

-- 3) SIGNUP HANDLER honors account_type
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _account_type text := COALESCE(NEW.raw_user_meta_data->>'account_type', 'user');
BEGIN
  IF _account_type NOT IN ('user','venue') THEN
    _account_type := 'user';
  END IF;

  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _account_type::app_role);

  RETURN NEW;
END;
$$;

-- 4) PROFILES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text;

-- 5) BUSINESSES
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS mobile text,
  ADD COLUMN IF NOT EXISTS menu_link text;

ALTER TABLE public.businesses
  ALTER COLUMN description SET NOT NULL,
  ALTER COLUMN address SET NOT NULL,
  ALTER COLUMN city SET NOT NULL,
  ALTER COLUMN lat SET NOT NULL,
  ALTER COLUMN lng SET NOT NULL,
  ALTER COLUMN cover_url SET NOT NULL,
  ALTER COLUMN phone SET NOT NULL,
  ALTER COLUMN mobile SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS businesses_one_per_owner_idx ON public.businesses (owner_id);

DROP POLICY IF EXISTS "Owners insert business" ON public.businesses;
CREATE POLICY "Venues insert own business" ON public.businesses
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = owner_id
    AND status = 'pending'
    AND private.is_venue(auth.uid())
  );

-- 6) GATHERINGS
ALTER TABLE public.gatherings
  ADD COLUMN IF NOT EXISTS origin text NOT NULL DEFAULT 'user_proposed',
  ADD COLUMN IF NOT EXISTS ends_at timestamptz;

ALTER TABLE public.gatherings DROP CONSTRAINT IF EXISTS gatherings_origin_check;
ALTER TABLE public.gatherings ADD CONSTRAINT gatherings_origin_check
  CHECK (origin IN ('user_proposed','venue_activated'));

ALTER TABLE public.gatherings DROP CONSTRAINT IF EXISTS gatherings_origin_shape_check;
ALTER TABLE public.gatherings ADD CONSTRAINT gatherings_origin_shape_check CHECK (
  (origin = 'venue_activated' AND business_id IS NOT NULL AND table_id IS NOT NULL)
  OR (origin = 'user_proposed')
);

-- Overlap guard for venue-activated gatherings
CREATE OR REPLACE FUNCTION public.prevent_table_double_booking()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_start timestamptz := NEW.starts_at;
  new_end   timestamptz := COALESCE(NEW.ends_at, NEW.starts_at + interval '2 hours');
BEGIN
  IF NEW.origin <> 'venue_activated' OR NEW.status = 'rejected' THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.gatherings g
    WHERE g.table_id = NEW.table_id
      AND g.id <> NEW.id
      AND g.origin = 'venue_activated'
      AND g.status <> 'rejected'
      AND tstzrange(g.starts_at, COALESCE(g.ends_at, g.starts_at + interval '2 hours'), '[)')
       && tstzrange(new_start, new_end, '[)')
  ) THEN
    RAISE EXCEPTION 'This table already has an active gathering that overlaps this time window';
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.prevent_table_double_booking() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS gatherings_no_double_booking ON public.gatherings;
CREATE TRIGGER gatherings_no_double_booking
  BEFORE INSERT OR UPDATE ON public.gatherings
  FOR EACH ROW EXECUTE FUNCTION public.prevent_table_double_booking();

-- Rebuild gathering RLS
DROP POLICY IF EXISTS "Users propose gatherings" ON public.gatherings;
DROP POLICY IF EXISTS "Host or owner update" ON public.gatherings;
DROP POLICY IF EXISTS "Host or owner delete" ON public.gatherings;

CREATE POLICY "Users propose gatherings" ON public.gatherings
  FOR INSERT TO authenticated
  WITH CHECK (
    host_id = auth.uid()
    AND private.is_email_verified(auth.uid())
    AND private.is_user(auth.uid())
    AND origin = 'user_proposed'
    AND status = 'proposed'
  );

CREATE POLICY "Venues activate own tables" ON public.gatherings
  FOR INSERT TO authenticated
  WITH CHECK (
    host_id = auth.uid()
    AND private.is_venue(auth.uid())
    AND origin = 'venue_activated'
    AND status = 'approved'
    AND EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id
        AND b.owner_id = auth.uid()
        AND b.status = 'approved'
    )
    AND EXISTS (
      SELECT 1 FROM public.venue_tables t
      WHERE t.id = table_id AND t.business_id = business_id
    )
  );

CREATE POLICY "Host updates own gathering" ON public.gatherings
  FOR UPDATE TO authenticated
  USING (host_id = auth.uid())
  WITH CHECK (host_id = auth.uid());

CREATE POLICY "Host deletes own gathering" ON public.gatherings
  FOR DELETE TO authenticated
  USING (host_id = auth.uid());

CREATE OR REPLACE FUNCTION public.prevent_gathering_status_change_non_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NOT private.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can change gathering status';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.prevent_gathering_status_change_non_admin() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS gatherings_status_admin_only ON public.gatherings;
CREATE TRIGGER gatherings_status_admin_only
  BEFORE UPDATE ON public.gatherings
  FOR EACH ROW EXECUTE FUNCTION public.prevent_gathering_status_change_non_admin();

-- 7) GATHERING ATTENDEES
DROP POLICY IF EXISTS "Users join" ON public.gathering_attendees;
CREATE POLICY "Users join approved gatherings" ON public.gathering_attendees
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND private.is_email_verified(auth.uid())
    AND private.is_user(auth.uid())
    AND EXISTS (SELECT 1 FROM public.gatherings g WHERE g.id = gathering_id AND g.status = 'approved')
  );

-- 8) VENUE TABLES
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='venue_tables' LOOP
    EXECUTE format('DROP POLICY %I ON public.venue_tables', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "Venue tables public read for approved businesses" ON public.venue_tables
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.status = 'approved'));

CREATE POLICY "Owner reads own tables" ON public.venue_tables
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));

CREATE POLICY "Admins read all tables" ON public.venue_tables
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owner manages own tables" ON public.venue_tables
  FOR ALL TO authenticated
  USING (
    private.is_venue(auth.uid())
    AND EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  )
  WITH CHECK (
    private.is_venue(auth.uid())
    AND EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  );

-- 9) GATHERING MESSAGES (chat)
CREATE TABLE IF NOT EXISTS public.gathering_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gathering_id uuid NOT NULL REFERENCES public.gatherings(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gathering_messages_gathering_idx
  ON public.gathering_messages (gathering_id, created_at);

GRANT SELECT, INSERT, DELETE ON public.gathering_messages TO authenticated;
GRANT ALL ON public.gathering_messages TO service_role;
ALTER TABLE public.gathering_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room members read messages" ON public.gathering_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.gatherings g WHERE g.id = gathering_id AND g.host_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.gathering_attendees a WHERE a.gathering_id = gathering_messages.gathering_id AND a.user_id = auth.uid())
  );

CREATE POLICY "Room members send messages" ON public.gathering_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      EXISTS (SELECT 1 FROM public.gatherings g WHERE g.id = gathering_id AND g.host_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.gathering_attendees a WHERE a.gathering_id = gathering_messages.gathering_id AND a.user_id = auth.uid())
    )
  );

CREATE POLICY "Sender or admin deletes message" ON public.gathering_messages
  FOR DELETE TO authenticated
  USING (sender_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.gathering_messages;

-- 10) CHECKLIST + per-user checks
CREATE TABLE IF NOT EXISTS public.gathering_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gathering_id uuid NOT NULL REFERENCES public.gatherings(id) ON DELETE CASCADE,
  label text NOT NULL CHECK (char_length(label) BETWEEN 1 AND 240),
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gathering_checklist_items_gathering_idx
  ON public.gathering_checklist_items (gathering_id, sort_order);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gathering_checklist_items TO authenticated;
GRANT ALL ON public.gathering_checklist_items TO service_role;
ALTER TABLE public.gathering_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room members read checklist" ON public.gathering_checklist_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.gatherings g WHERE g.id = gathering_id AND g.host_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.gathering_attendees a WHERE a.gathering_id = gathering_checklist_items.gathering_id AND a.user_id = auth.uid())
  );

CREATE POLICY "Host manages checklist" ON public.gathering_checklist_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.gatherings g WHERE g.id = gathering_id AND g.host_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.gatherings g WHERE g.id = gathering_id AND g.host_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.gathering_checklist_checks (
  item_id uuid NOT NULL REFERENCES public.gathering_checklist_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (item_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.gathering_checklist_checks TO authenticated;
GRANT ALL ON public.gathering_checklist_checks TO service_role;
ALTER TABLE public.gathering_checklist_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own checks" ON public.gathering_checklist_checks
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.gathering_checklist_items i
      JOIN public.gatherings g ON g.id = i.gathering_id
      WHERE i.id = item_id
        AND (g.host_id = auth.uid()
             OR EXISTS (SELECT 1 FROM public.gathering_attendees a WHERE a.gathering_id = g.id AND a.user_id = auth.uid()))
    )
  );
