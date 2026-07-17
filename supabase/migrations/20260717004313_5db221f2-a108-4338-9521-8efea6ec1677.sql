
-- 1) Fix tautology in venue activation policy
DROP POLICY IF EXISTS "Venues activate own tables" ON public.gatherings;
CREATE POLICY "Venues activate own tables" ON public.gatherings
  FOR INSERT TO authenticated
  WITH CHECK (
    host_id = auth.uid()
    AND private.is_venue(auth.uid())
    AND origin = 'venue_activated'
    AND status = 'approved'
    AND EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = gatherings.business_id
        AND b.owner_id = auth.uid()
        AND b.status = 'approved'
    )
    AND EXISTS (
      SELECT 1 FROM public.venue_tables t
      WHERE t.id = gatherings.table_id
        AND t.business_id = gatherings.business_id
    )
  );

-- 2) Restrict profile reads to authenticated users
DROP POLICY IF EXISTS "Profiles are public readable" ON public.profiles;
CREATE POLICY "Profiles readable by authenticated users" ON public.profiles
  FOR SELECT TO authenticated USING (true);

REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT ON public.profiles TO authenticated;
