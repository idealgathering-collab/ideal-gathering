-- IG-007: exact totals within a fixed time window; no identities or analytics copy.
BEGIN;
CREATE FUNCTION public.get_my_life_summary()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  cutoff timestamptz := now() - interval '720 hours';
  result jsonb;
BEGIN
  IF NOT private.can_use_life_moments() THEN RAISE EXCEPTION 'Summary unavailable'; END IF;
  WITH eligible AS MATERIALIZED (
    SELECT g.starts_at,
      CASE WHEN g.gathering_type IN
        ('coffee','food','city','outdoors','games','creative','arts','learning','books','tech','spontaneous')
        THEN g.gathering_type ELSE 'other' END AS category
    FROM public.gatherings g
    WHERE g.starts_at >= cutoff AND g.starts_at <= now()
      AND g.status = 'approved'
      AND coalesce(g.ends_at, g.starts_at + interval '2 hours') <= now()
      AND NOT private.is_blocked_pair(auth.uid(), g.host_id)
      AND (g.host_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.gathering_attendees a
        WHERE a.gathering_id = g.id AND a.user_id = auth.uid() AND a.checked_in_at IS NOT NULL
      ))
  ), categories AS (
    SELECT category, count(*) AS total FROM eligible GROUP BY category
  ), periods AS (
    SELECT i, cutoff + i * interval '240 hours' AS start_at,
      cutoff + (i + 1) * interval '240 hours' AS end_at
    FROM generate_series(0, 2) i
  )
  SELECT jsonb_build_object(
    'period_start', cutoff, 'period_end', now(),
    'gatherings', (SELECT count(*) FROM eligible),
    'moments', (SELECT count(*) FROM public.life_moments m
      WHERE m.user_id = auth.uid() AND m.created_at >= cutoff AND m.created_at <= now()),
    'categories', coalesce((SELECT jsonb_agg(jsonb_build_object('category', category, 'count', total)
      ORDER BY total DESC, category COLLATE "C") FROM categories), '[]'::jsonb),
    'periods', (SELECT jsonb_agg(jsonb_build_object(
      'start', p.start_at, 'end', p.end_at,
      'gatherings', (SELECT count(*) FROM eligible e
        WHERE e.starts_at >= p.start_at AND (e.starts_at < p.end_at OR (p.i = 2 AND e.starts_at = p.end_at)))
    ) ORDER BY p.i) FROM periods p)
  ) INTO result;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.get_my_life_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_life_summary() TO authenticated;
-- Owner/date index makes the complete period count independent of timeline limits.
CREATE INDEX life_moments_owner_saved_at ON public.life_moments(user_id, created_at);
NOTIFY pgrst, 'reload schema';
COMMIT;
