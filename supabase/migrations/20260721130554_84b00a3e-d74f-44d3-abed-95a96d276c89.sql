
DROP FUNCTION IF EXISTS public.get_approved_business(uuid);
DROP FUNCTION IF EXISTS public.list_approved_businesses();
DROP FUNCTION IF EXISTS public.get_public_profiles(uuid[]);

CREATE VIEW public.approved_businesses
WITH (security_invoker = false, security_barrier = true) AS
SELECT id, name, description, city, address, cover_url, menu_link, lat, lng, created_at
FROM public.businesses
WHERE status = 'approved';

CREATE VIEW public.public_profiles
WITH (security_invoker = false, security_barrier = true) AS
SELECT id, display_name, avatar_url
FROM public.profiles;

REVOKE ALL ON public.approved_businesses FROM PUBLIC, anon;
REVOKE ALL ON public.public_profiles FROM PUBLIC, anon;
GRANT SELECT ON public.approved_businesses TO authenticated;
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT ALL ON public.approved_businesses TO service_role;
GRANT ALL ON public.public_profiles TO service_role;
