-- Public read of approved businesses (mirrors venue_tables public policy)
CREATE POLICY "Public reads approved businesses"
ON public.businesses
FOR SELECT
TO anon, authenticated
USING (status = 'approved');

GRANT SELECT ON public.businesses TO anon;

-- Restrict owner update policy to authenticated role
DROP POLICY "Owners update own business" ON public.businesses;
CREATE POLICY "Owners update own business"
ON public.businesses
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);