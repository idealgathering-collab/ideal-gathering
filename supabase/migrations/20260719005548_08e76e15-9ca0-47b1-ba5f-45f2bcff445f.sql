
-- 1. Revoke EXECUTE on internal trigger-only SECURITY DEFINER functions
--    from public/anon/authenticated. These are invoked by triggers or as
--    part of auth setup, never called through the Data API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_gathering_status_change_non_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_table_double_booking() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_business_status_change_by_owner() FROM PUBLIC, anon, authenticated;

-- 2. The intentional public read RPCs (list_approved_businesses,
--    get_approved_business, get_public_profiles) exist specifically to
--    project only safe columns while bypassing base-table RLS. Restrict
--    them to authenticated callers so anon can't execute them.
REVOKE EXECUTE ON FUNCTION public.list_approved_businesses() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_approved_business(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_approved_businesses() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_approved_business(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) TO authenticated;

-- 3. Drop the public SELECT policy on the avatars bucket so avatars are
--    only reachable via signed URLs (generated server-side) or by the
--    owner. Add an owner-scoped SELECT policy so users can still read
--    their own avatar path directly.
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;

CREATE POLICY "Users can read own avatar"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );
