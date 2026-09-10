CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'owner'::public.app_role
  );
$$;

-- One-time bootstrap. An existing admin may claim ownership only when the
-- installation has no owner yet. The admin role is retained for compatibility
-- with existing moderation and RLS policies.
CREATE OR REPLACE FUNCTION public.claim_initial_owner()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
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

GRANT EXECUTE ON FUNCTION public.is_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_initial_owner() TO authenticated;
