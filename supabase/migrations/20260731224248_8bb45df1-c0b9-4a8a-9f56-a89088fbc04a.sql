REVOKE SELECT ON public.businesses FROM anon, authenticated;
GRANT SELECT (id, name, description, description_extra, address, street_number, city, cover_url, menu_link, lat, lng, status, created_at) ON public.businesses TO anon, authenticated;
GRANT ALL ON public.businesses TO service_role;