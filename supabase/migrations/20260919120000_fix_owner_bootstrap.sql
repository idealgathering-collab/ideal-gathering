-- Correct the helper reference without changing the established bootstrap rule:
-- the first existing admin may claim, and keeps admin for existing RLS policies.
CREATE OR REPLACE FUNCTION public.claim_initial_owner()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Serialize the check/insert, including concurrent role writes. This lock is
  -- held until transaction end; a waiting claim sees the committed first owner.
  LOCK TABLE public.user_roles IN SHARE ROW EXCLUSIVE MODE;

  IF NOT private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'owner'::public.app_role) THEN
    RETURN public.is_owner(auth.uid());
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'owner'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN true;
END;
$$;

-- Functions otherwise inherit EXECUTE for PUBLIC, including anonymous callers.
REVOKE ALL ON FUNCTION public.claim_initial_owner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_initial_owner() TO authenticated;
