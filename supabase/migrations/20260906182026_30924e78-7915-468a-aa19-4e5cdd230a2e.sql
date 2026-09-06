REVOKE EXECUTE ON FUNCTION public.guard_profile_access_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_business_access_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.redeem_invitation(text) FROM anon;