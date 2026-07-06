
CREATE OR REPLACE FUNCTION public.is_email_verified(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE id = _user_id AND email_confirmed_at IS NOT NULL
  )
$$;

DROP POLICY IF EXISTS "Users propose gatherings" ON public.gatherings;
CREATE POLICY "Users propose gatherings"
ON public.gatherings
FOR INSERT
TO authenticated
WITH CHECK (
  host_id = auth.uid()
  AND status = 'proposed'::gathering_status
  AND public.is_email_verified(auth.uid())
);

DROP POLICY IF EXISTS "Users join" ON public.gathering_attendees;
CREATE POLICY "Users join"
ON public.gathering_attendees
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.is_email_verified(auth.uid())
);
