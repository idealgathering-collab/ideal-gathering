
-- Remove broad public policy on businesses (exposed owner_id/phone/mobile to anyone)
DROP POLICY IF EXISTS "Approved businesses public read" ON public.businesses;

-- Public-safe view: excludes owner_id, phone, mobile. Runs as view owner so it can
-- read approved rows without a base-table public policy.
CREATE OR REPLACE VIEW public.businesses_public
WITH (security_invoker = false, security_barrier = true) AS
SELECT id, name, description, city, address, cover_url, menu_link, lat, lng, status, created_at
FROM public.businesses
WHERE status = 'approved';

GRANT SELECT ON public.businesses_public TO anon, authenticated;

-- Remove blanket profile read; expose only safe fields via a view
DROP POLICY IF EXISTS "Profiles readable by authenticated users" ON public.profiles;

CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = false, security_barrier = true) AS
SELECT id, display_name, avatar_url
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated;
