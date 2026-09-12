-- Additive Owner boundary. Existing Admins retain operations; new grants are explicit.
CREATE TABLE public.admin_permissions (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission text NOT NULL CHECK (permission IN ('platform_operations')),
  PRIMARY KEY (user_id, permission)
);
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_permissions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.admin_permissions TO authenticated;
GRANT ALL ON public.admin_permissions TO service_role;

INSERT INTO public.admin_permissions (user_id, permission)
SELECT user_id, 'platform_operations' FROM public.user_roles WHERE role = 'admin';

CREATE TABLE public.admin_access_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid NOT NULL,
  target_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('grant', 'restrict', 'restore', 'remove')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_access_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_access_audit FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.admin_access_audit TO authenticated;
GRANT ALL ON public.admin_access_audit TO service_role;

CREATE OR REPLACE FUNCTION private.has_platform_permission(_user_id uuid, _permission text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT _permission = 'platform_operations' AND (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'owner')
    OR (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
      AND EXISTS (SELECT 1 FROM public.admin_permissions WHERE user_id = _user_id AND permission = _permission))
  );
$$;
REVOKE ALL ON FUNCTION private.has_platform_permission(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_platform_permission(uuid, text) TO authenticated, service_role;

-- Compatibility boundary for every existing Admin RLS policy and trigger.
-- Other role tests retain their original identity semantics.
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT CASE WHEN _role = 'admin' THEN private.has_platform_permission(_user_id, 'platform_operations')
    ELSE EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) END;
$$;

CREATE OR REPLACE FUNCTION public.has_platform_permission(_permission text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT COALESCE(private.has_platform_permission(auth.uid(), _permission), false);
$$;
REVOKE ALL ON FUNCTION public.has_platform_permission(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_platform_permission(text) TO authenticated;

REVOKE ALL ON FUNCTION public.is_owner(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_owner(uuid) TO authenticated;
CREATE POLICY "Own grants or Owner" ON public.admin_permissions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_owner(auth.uid()));
CREATE POLICY "Owner reads access audit" ON public.admin_access_audit FOR SELECT TO authenticated
  USING (public.is_owner(auth.uid()));

-- No Admin, including the first Admin, may promote itself to Owner.
-- Initial provisioning is an explicit trusted database-operator operation.
CREATE OR REPLACE FUNCTION public.claim_initial_owner()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  RAISE EXCEPTION 'Owner provisioning requires a trusted database operator' USING ERRCODE = '42501';
END;
$$;
REVOKE ALL ON FUNCTION public.claim_initial_owner() FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.user_roles FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.manage_admin_access(_user_id uuid, _action text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  -- Serialize changes, then authorize again under the lock.
  LOCK TABLE public.user_roles IN SHARE ROW EXCLUSIVE MODE;
  IF auth.uid() IS NULL OR NOT public.is_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;
  IF _user_id IS NULL OR _action IS NULL OR _action NOT IN ('grant', 'restrict', 'restore', 'remove') THEN
    RAISE EXCEPTION 'Invalid access change' USING ERRCODE = '22023';
  END IF;
  IF public.is_owner(_user_id) THEN
    RAISE EXCEPTION 'Owner access cannot be changed here' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id) THEN
    RAISE EXCEPTION 'Account not found' USING ERRCODE = '22023';
  END IF;
  IF _action <> 'grant' AND NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Account is not an Admin' USING ERRCODE = '22023';
  END IF;
  IF _action = 'grant' THEN
    -- Grant must not silently restore an existing restricted Admin.
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin') THEN
      RAISE EXCEPTION 'Already an Admin; use restore to enable operations' USING ERRCODE = '22023';
    END IF;
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'admin');
  END IF;
  IF _action IN ('grant', 'restore') THEN
    INSERT INTO public.admin_permissions (user_id, permission) VALUES (_user_id, 'platform_operations')
      ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.admin_permissions WHERE user_id = _user_id;
  END IF;
  IF _action = 'remove' THEN
    DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'admin';
  END IF;
  INSERT INTO public.admin_access_audit(actor_id, target_id, action) VALUES (auth.uid(), _user_id, _action);
END;
$$;
REVOKE ALL ON FUNCTION public.manage_admin_access(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.manage_admin_access(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_admin_access()
RETURNS TABLE (user_id uuid, permissions text[], is_owner boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY SELECT r.user_id,
    ARRAY(SELECT p.permission FROM public.admin_permissions p WHERE p.user_id = r.user_id ORDER BY p.permission),
    public.is_owner(r.user_id)
    FROM public.user_roles r WHERE r.role = 'admin' ORDER BY r.user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.list_admin_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_admin_access() TO authenticated;
