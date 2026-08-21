GRANT EXECUTE ON FUNCTION private.is_venue(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_blocked_pair(uuid, uuid) TO authenticated;
GRANT SELECT (owner_id) ON public.businesses TO authenticated;