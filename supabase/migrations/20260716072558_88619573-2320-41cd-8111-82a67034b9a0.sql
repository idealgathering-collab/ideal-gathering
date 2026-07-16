
-- 1) Replace broken WITH CHECK on businesses owner update with a trigger that
--    blocks non-admins from changing the status column.
DROP POLICY IF EXISTS "Owners update own business" ON public.businesses;
CREATE POLICY "Owners update own business"
ON public.businesses
FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE OR REPLACE FUNCTION public.prevent_business_status_change_by_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NOT private.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can change business status';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS businesses_prevent_status_change ON public.businesses;
CREATE TRIGGER businesses_prevent_status_change
BEFORE UPDATE ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.prevent_business_status_change_by_owner();

-- 2) Add admin update/delete policies on gathering_attendees for moderation.
CREATE POLICY "Admins update gathering attendees"
ON public.gathering_attendees
FOR UPDATE
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete gathering attendees"
ON public.gathering_attendees
FOR DELETE
USING (private.has_role(auth.uid(), 'admin'::app_role));
