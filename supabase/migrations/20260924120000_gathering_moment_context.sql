-- IG-004: a minimal, caller-scoped prefill. Existing INSERT guards remain final authority.
CREATE FUNCTION public.get_gathering_moment_context(_gathering_id uuid)
RETURNS TABLE (id uuid, title text, happened_at timestamptz, place text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT g.id, left(btrim(g.subject), 160), g.starts_at,
    concat_ws(' · ', nullif(coalesce(b.name, g.venue_name), ''), nullif(coalesce(b.city, g.city, g.neighborhood), ''))
  FROM public.gatherings g
  LEFT JOIN public.businesses b ON b.id = g.business_id
  WHERE g.id = _gathering_id AND private.can_use_life_moments()
    AND NOT private.is_blocked_pair(auth.uid(), g.host_id)
    AND g.status = 'approved'
    AND coalesce(g.ends_at, g.starts_at + interval '2 hours') <= now()
    AND (g.host_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.gathering_attendees a
      WHERE a.gathering_id = g.id AND a.user_id = auth.uid() AND a.checked_in_at IS NOT NULL
    ))
$$;
REVOKE ALL ON FUNCTION public.get_gathering_moment_context(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_gathering_moment_context(uuid) TO authenticated;
NOTIFY pgrst, 'reload schema';
