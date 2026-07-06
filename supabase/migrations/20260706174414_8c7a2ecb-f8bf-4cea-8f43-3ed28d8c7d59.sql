
CREATE OR REPLACE FUNCTION public.is_email_verified(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM auth.users
    WHERE id = _user_id
      AND id = auth.uid()
      AND email_confirmed_at IS NOT NULL
  )
$$;

REVOKE ALL ON FUNCTION public.is_email_verified(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_email_verified(uuid) TO authenticated;
