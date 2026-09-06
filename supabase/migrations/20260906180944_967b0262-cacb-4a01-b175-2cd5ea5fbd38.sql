-- 1. Beta launch config -------------------------------------------------
CREATE TABLE public.app_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  beta_launched boolean NOT NULL DEFAULT false,
  launched_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_config TO authenticated;
GRANT ALL ON public.app_config TO service_role;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed in read config" ON public.app_config
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins update config" ON public.app_config
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
INSERT INTO public.app_config (id, beta_launched) VALUES (true, false);

CREATE OR REPLACE FUNCTION public.is_beta_launched()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT beta_launched FROM public.app_config WHERE id), false)
$$;
REVOKE ALL ON FUNCTION public.is_beta_launched() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_beta_launched() TO anon, authenticated, service_role;

-- 2. Access statuses -----------------------------------------------------
CREATE TYPE public.user_access_status AS ENUM ('waitlisted','invited','registered','onboarded','active');
CREATE TYPE public.venue_access_status AS ENUM ('pending','approved','invited','registered','active');

ALTER TABLE public.profiles
  ADD COLUMN access_status public.user_access_status NOT NULL DEFAULT 'registered';
UPDATE public.profiles SET access_status = 'active' WHERE onboarded_at IS NOT NULL;

ALTER TABLE public.businesses
  ADD COLUMN access_status public.venue_access_status NOT NULL DEFAULT 'pending';
UPDATE public.businesses
  SET access_status = CASE WHEN status = 'approved' THEN 'active'::public.venue_access_status
                           ELSE 'pending'::public.venue_access_status END;

-- Only admins may move a person's access status by hand; finishing
-- onboarding advances it automatically.
CREATE OR REPLACE FUNCTION public.guard_profile_access_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private AS $$
BEGIN
  IF NEW.onboarded_at IS NOT NULL AND OLD.onboarded_at IS NULL
     AND OLD.access_status IN ('waitlisted','invited','registered') THEN
    NEW.access_status := 'onboarded';
    RETURN NEW;
  END IF;
  IF NEW.access_status IS DISTINCT FROM OLD.access_status
     AND NOT private.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.access_status := OLD.access_status;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER profiles_access_status_guard
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_access_status();

-- Venue owners cannot self-promote their venue access status.
CREATE OR REPLACE FUNCTION public.guard_business_access_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private AS $$
BEGIN
  IF NEW.access_status IS DISTINCT FROM OLD.access_status
     AND NOT private.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.access_status := OLD.access_status;
  END IF;
  IF private.has_role(auth.uid(), 'admin'::app_role)
     AND NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.access_status := CASE
      WHEN NEW.status = 'approved' AND public.is_beta_launched() THEN 'active'::public.venue_access_status
      WHEN NEW.status = 'approved' THEN 'approved'::public.venue_access_status
      ELSE 'pending'::public.venue_access_status END;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER businesses_access_status_guard
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.guard_business_access_status();

-- 3. Invitations ---------------------------------------------------------
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  email text,
  note text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','redeemed','revoked')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.invitations TO authenticated;
GRANT ALL ON public.invitations TO service_role;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read invitations" ON public.invitations
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins create invitations" ON public.invitations
  FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update invitations" ON public.invitations
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER invitations_updated_at
  BEFORE UPDATE ON public.invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.check_invitation(_code text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.invitations i
    WHERE i.code = upper(btrim(_code))
      AND i.status = 'active'
      AND (i.expires_at IS NULL OR i.expires_at > now())
  )
$$;
REVOKE ALL ON FUNCTION public.check_invitation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_invitation(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.redeem_invitation(_code text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _id uuid;
BEGIN
  IF _uid IS NULL THEN RETURN false; END IF;

  SELECT i.id INTO _id FROM public.invitations i
  WHERE i.code = upper(btrim(_code))
    AND i.status = 'active'
    AND (i.expires_at IS NULL OR i.expires_at > now())
  FOR UPDATE;

  IF _id IS NULL THEN RETURN false; END IF;

  UPDATE public.invitations
     SET status = 'redeemed', redeemed_by = _uid, redeemed_at = now()
   WHERE id = _id;

  UPDATE public.profiles
     SET access_status = CASE WHEN onboarded_at IS NOT NULL THEN 'onboarded'::public.user_access_status
                              ELSE 'registered'::public.user_access_status END
   WHERE id = _uid AND access_status IN ('waitlisted','invited');

  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.redeem_invitation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_invitation(text) TO authenticated, service_role;

-- 4. Access helpers ------------------------------------------------------
CREATE OR REPLACE FUNCTION private.has_beta_access(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, private AS $$
  SELECT private.has_role(_uid, 'admin'::app_role)
      OR (public.is_beta_launched() AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = _uid AND p.access_status IN ('onboarded','active')))
$$;
REVOKE ALL ON FUNCTION private.has_beta_access(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_beta_access(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.venue_has_beta_access(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, private AS $$
  SELECT private.has_role(_uid, 'admin'::app_role)
      OR (public.is_beta_launched() AND EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.owner_id = _uid AND b.status = 'approved'))
$$;
REVOKE ALL ON FUNCTION private.venue_has_beta_access(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.venue_has_beta_access(uuid) TO authenticated, service_role;

-- 5. Enforce access on product writes ------------------------------------
DROP POLICY "Users propose gatherings" ON public.gatherings;
CREATE POLICY "Users propose gatherings" ON public.gatherings
  FOR INSERT TO authenticated
  WITH CHECK (
    host_id = auth.uid()
    AND private.is_email_verified(auth.uid())
    AND private.is_user(auth.uid())
    AND private.has_beta_access(auth.uid())
    AND origin = 'user_proposed'
    AND status = 'proposed'
  );

DROP POLICY "Venues activate own tables" ON public.gatherings;
CREATE POLICY "Venues activate own tables" ON public.gatherings
  FOR INSERT TO authenticated
  WITH CHECK (
    host_id = auth.uid()
    AND private.is_venue(auth.uid())
    AND private.venue_has_beta_access(auth.uid())
    AND origin = 'venue_activated'
    AND status = 'approved'
    AND EXISTS (SELECT 1 FROM public.businesses b
                WHERE b.id = business_id AND b.owner_id = auth.uid() AND b.status = 'approved')
    AND EXISTS (SELECT 1 FROM public.venue_tables t
                WHERE t.id = table_id AND t.business_id = gatherings.business_id)
  );

DROP POLICY "Users join approved gatherings" ON public.gathering_attendees;
CREATE POLICY "Users join approved gatherings" ON public.gathering_attendees
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND private.is_email_verified(auth.uid())
    AND private.is_user(auth.uid())
    AND private.has_beta_access(auth.uid())
    AND EXISTS (SELECT 1 FROM public.gatherings g
                WHERE g.id = gathering_id AND g.status = 'approved')
  );

DROP POLICY "Room members send messages" ON public.gathering_messages;
CREATE POLICY "Room members send messages" ON public.gathering_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (private.has_beta_access(auth.uid()) OR private.venue_has_beta_access(auth.uid()))
    AND (
      EXISTS (SELECT 1 FROM public.gatherings g
              WHERE g.id = gathering_id AND g.host_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.gathering_attendees a
                 WHERE a.gathering_id = gathering_messages.gathering_id AND a.user_id = auth.uid())
    )
  );