-- Limit anon column access on public.businesses to safe columns only.
REVOKE SELECT ON public.businesses FROM anon;
GRANT SELECT (
  id, name, description, address, city, cover_url, created_at,
  status, lat, lng, menu_link, street_number, description_extra
) ON public.businesses TO anon;