-- IG-006: member profiles require a real, authorized gathering connection.
BEGIN;
CREATE OR REPLACE FUNCTION private.can_view_member_profile(_target uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT private.can_use_life_moments()
    AND private.is_user(_target)
    AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = _target AND u.email_confirmed_at IS NOT NULL)
    AND private.has_beta_access(_target)
    AND NOT private.is_blocked_pair(auth.uid(), _target)
    AND (auth.uid() = _target OR EXISTS (
      SELECT 1 FROM public.gatherings g
      WHERE g.status = 'approved'
        AND NOT private.is_blocked_pair(auth.uid(), g.host_id)
        AND NOT private.is_blocked_pair(_target, g.host_id)
        AND (g.host_id = auth.uid() OR EXISTS (
          SELECT 1 FROM public.gathering_attendees a
          WHERE a.gathering_id = g.id AND a.user_id = auth.uid()
            AND (coalesce(g.ends_at, g.starts_at + interval '2 hours') > now()
                 OR a.checked_in_at IS NOT NULL)
        ))
        AND (g.host_id = _target OR EXISTS (
          SELECT 1 FROM public.gathering_attendees a
          WHERE a.gathering_id = g.id AND a.user_id = _target
            AND (coalesce(g.ends_at, g.starts_at + interval '2 hours') > now()
                 OR a.checked_in_at IS NOT NULL)
        ))
    ))
$$;
REVOKE ALL ON FUNCTION private.can_view_member_profile(uuid) FROM PUBLIC, anon, authenticated;

-- Tighten the existing shared-read policy; do not create another moments path.
CREATE OR REPLACE FUNCTION private.life_moment_profile_visible(_owner uuid, _visibility text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT _visibility = 'profile' AND private.can_view_member_profile(_owner)
$$;

CREATE OR REPLACE FUNCTION public.get_member_profile(_user_id uuid)
RETURNS TABLE (
  display_name text, avatar_url text, city text, bio text, interests jsonb,
  intentions jsonb, energy_level text, group_size text, talk_style text, new_people_pref text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT p.display_name, p.avatar_url, p.city, p.bio, p.interests,
    coalesce(prefs.intentions, '[]'::jsonb), prefs.social_energy,
    CASE WHEN prefs.preferred_group_size IS NULL THEN NULL
      WHEN prefs.preferred_group_size <= 3 THEN 'intimate'
      WHEN prefs.preferred_group_size = 4 THEN 'small' ELSE 'large' END,
    prefs.conversation_style, prefs.stranger_comfort
  FROM public.profiles p
  LEFT JOIN public.user_gathering_preferences prefs ON prefs.user_id = p.id
  WHERE p.id = _user_id AND private.can_view_member_profile(p.id)
$$;
REVOKE ALL ON FUNCTION public.get_member_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_member_profile(uuid) TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
