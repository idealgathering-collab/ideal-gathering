
DROP VIEW IF EXISTS public.businesses_public;
DROP VIEW IF EXISTS public.profiles_public;

CREATE OR REPLACE FUNCTION public.list_approved_businesses()
RETURNS TABLE (
  id uuid, name text, description text, city text, address text,
  cover_url text, menu_link text, lat numeric, lng numeric, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, name, description, city, address, cover_url, menu_link, lat, lng, created_at
  FROM public.businesses
  WHERE status = 'approved'
  ORDER BY name
$$;

CREATE OR REPLACE FUNCTION public.get_approved_business(_id uuid)
RETURNS TABLE (
  id uuid, name text, description text, city text, address text,
  cover_url text, menu_link text, lat numeric, lng numeric, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, name, description, city, address, cover_url, menu_link, lat, lng, created_at
  FROM public.businesses
  WHERE status = 'approved' AND id = _id
$$;

REVOKE ALL ON FUNCTION public.list_approved_businesses() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_approved_business(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_approved_businesses() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_approved_business(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_profiles(_ids uuid[])
RETURNS TABLE (id uuid, display_name text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, display_name, avatar_url
  FROM public.profiles
  WHERE id = ANY(_ids)
$$;

REVOKE ALL ON FUNCTION public.get_public_profiles(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) TO authenticated;
