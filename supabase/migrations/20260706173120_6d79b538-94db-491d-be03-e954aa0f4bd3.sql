DROP POLICY IF EXISTS "Attendees public read" ON public.gathering_attendees;
REVOKE SELECT ON public.gathering_attendees FROM anon;
CREATE POLICY "Attendees authenticated read" ON public.gathering_attendees FOR SELECT TO authenticated USING (true);