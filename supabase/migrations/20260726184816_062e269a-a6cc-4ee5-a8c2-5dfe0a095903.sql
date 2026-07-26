-- Remove redundant owner-scoped avatar SELECT policy (broader authenticated read exists)
DROP POLICY IF EXISTS "Users can read own avatar" ON storage.objects;

-- Add admin-only UPDATE and DELETE policies for waitlist
CREATE POLICY "Admins can update waitlist"
  ON public.waitlist
  FOR UPDATE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete waitlist"
  ON public.waitlist
  FOR DELETE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));