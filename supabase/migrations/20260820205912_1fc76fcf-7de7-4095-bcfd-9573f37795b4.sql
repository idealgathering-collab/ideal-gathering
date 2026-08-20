REVOKE ALL ON FUNCTION public.clamp_new_report() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_report_status_change_non_admin() FROM PUBLIC, anon, authenticated;