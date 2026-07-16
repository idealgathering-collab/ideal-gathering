
-- 1. Business status enum & column
DO $$ BEGIN
  CREATE TYPE public.business_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS status public.business_status NOT NULL DEFAULT 'pending';

-- Backfill existing rows to approved (don't hide live venues)
UPDATE public.businesses SET status = 'approved' WHERE status = 'pending';

-- 2. Profile extended fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS interests jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS cover_url text;

-- 3. Businesses RLS: replace public-read-all with approved-only + owner + admin
DROP POLICY IF EXISTS "Businesses public read" ON public.businesses;
DROP POLICY IF EXISTS "Owners manage business" ON public.businesses;
DROP POLICY IF EXISTS "Approved businesses public read" ON public.businesses;
DROP POLICY IF EXISTS "Owner reads own business" ON public.businesses;
DROP POLICY IF EXISTS "Admins read all businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admins update any business" ON public.businesses;
DROP POLICY IF EXISTS "Owners insert business" ON public.businesses;
DROP POLICY IF EXISTS "Owners update own business" ON public.businesses;
DROP POLICY IF EXISTS "Owners delete own business" ON public.businesses;

CREATE POLICY "Approved businesses public read" ON public.businesses
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Owner reads own business" ON public.businesses
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY "Admins read all businesses" ON public.businesses
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(),'admin'));

CREATE POLICY "Owners insert business" ON public.businesses
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id AND status = 'pending');

CREATE POLICY "Owners update own business" ON public.businesses
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id AND status = (SELECT status FROM public.businesses b WHERE b.id = businesses.id));

CREATE POLICY "Owners delete own business" ON public.businesses
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY "Admins update any business" ON public.businesses
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(),'admin'))
  WITH CHECK (private.has_role(auth.uid(),'admin'));

-- 4. Profiles admin bypass
DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;
CREATE POLICY "Admins read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(),'admin'));

-- 5. Gathering attendees admin bypass
DROP POLICY IF EXISTS "Admins read all attendees" ON public.gathering_attendees;
CREATE POLICY "Admins read all attendees" ON public.gathering_attendees
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(),'admin'));

-- 6. Waitlist already has admin-read policy — no change

-- 7. Grant admin role to idealgathering@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
WHERE u.email = 'idealgathering@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
