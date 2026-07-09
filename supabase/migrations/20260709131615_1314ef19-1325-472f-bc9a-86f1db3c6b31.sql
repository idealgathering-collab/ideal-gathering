
-- 1) Move SECURITY DEFINER helpers into a private schema
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION private.is_email_verified(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM auth.users
    WHERE id = _user_id
      AND id = auth.uid()
      AND email_confirmed_at IS NOT NULL
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_email_verified(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_email_verified(uuid) TO authenticated, service_role;

-- 2) Recreate policies that referenced public.* helpers to use private.*
DROP POLICY IF EXISTS "Users propose gatherings" ON public.gatherings;
CREATE POLICY "Users propose gatherings" ON public.gatherings
  FOR INSERT TO authenticated
  WITH CHECK (
    host_id = auth.uid()
    AND status = 'proposed'::public.gathering_status
    AND private.is_email_verified(auth.uid())
  );

DROP POLICY IF EXISTS "Users join" ON public.gathering_attendees;
CREATE POLICY "Users join" ON public.gathering_attendees
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND private.is_email_verified(auth.uid())
  );

DROP POLICY IF EXISTS "Admins can view waitlist" ON public.waitlist;
CREATE POLICY "Admins can view waitlist" ON public.waitlist
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Drop the now-unused public helpers (they were exposed via PostgREST)
DROP FUNCTION IF EXISTS public.is_email_verified(uuid);
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- 3) businesses: hide owner_id from anonymous visitors via column-level grants
REVOKE SELECT ON public.businesses FROM anon;
GRANT SELECT (id, name, city, address, description, cover_url, created_at)
  ON public.businesses TO anon;

-- 4) gathering_attendees: restrict SELECT to attendee, host, or business owner
DROP POLICY IF EXISTS "Attendees authenticated read" ON public.gathering_attendees;
CREATE POLICY "Attendees limited read" ON public.gathering_attendees
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.gatherings g
      WHERE g.id = gathering_attendees.gathering_id
        AND (
          g.host_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = g.business_id AND b.owner_id = auth.uid()
          )
        )
    )
  );

-- 5) waitlist INSERT: replace WITH CHECK (true) with basic validation
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
CREATE POLICY "Anyone can join waitlist" ON public.waitlist
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND length(btrim(email)) BETWEEN 5 AND 320
    AND position('@' in email) > 1
    AND name IS NOT NULL
    AND length(btrim(name)) BETWEEN 1 AND 120
  );
