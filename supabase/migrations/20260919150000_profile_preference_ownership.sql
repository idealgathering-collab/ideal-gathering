-- IG-002: reconcile the previously unversioned preference table with its existing
-- generated contract. Existing rows and legacy profile columns are preserved.
CREATE TABLE IF NOT EXISTS public.user_gathering_preferences (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  intentions jsonb NOT NULL DEFAULT '[]'::jsonb,
  gathering_types jsonb NOT NULL DEFAULT '[]'::jsonb,
  preferred_group_size integer,
  social_energy text,
  conversation_style text,
  spontaneity text,
  stranger_comfort text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_gathering_preferences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_gathering_preferences FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_gathering_preferences TO authenticated;
GRANT ALL ON public.user_gathering_preferences TO service_role;
DROP POLICY IF EXISTS "IG002 own preferences" ON public.user_gathering_preferences;
CREATE POLICY "IG002 own preferences" ON public.user_gathering_preferences
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- An existing permissive policy must not accidentally expose another user's row.
DROP POLICY IF EXISTS "IG002 preference privacy boundary" ON public.user_gathering_preferences;
CREATE POLICY "IG002 preference privacy boundary" ON public.user_gathering_preferences
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- A present canonical row wins as a whole, even when values are null/empty.
-- Null means no preference, so never coalesce individual fields with stale copies.
-- Preserve textual legacy answers verbatim: listener/talker and conversation
-- depth are not interchangeable concepts. No guessed semantic conversion.
INSERT INTO public.user_gathering_preferences
  (user_id, intentions, social_energy, conversation_style, stranger_comfort, preferred_group_size)
SELECT id, to_jsonb(intentions), energy_level, talk_style, new_people_pref,
  CASE group_size WHEN 'intimate' THEN 3 WHEN 'small' THEN 4 WHEN 'large' THEN 5
    WHEN '3' THEN 3 WHEN '4' THEN 4 WHEN '5' THEN 5 ELSE NULL END
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- One transaction for the two editors. Invoker rights retain existing profile
-- RLS/triggers; identity is always auth.uid(), never a caller-supplied target.
CREATE OR REPLACE FUNCTION public.save_my_profile_data(
  _profile jsonb DEFAULT '{}'::jsonb,
  _preferences jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  uid uuid := auth.uid();
  p public.profiles;
  q public.user_gathering_preferences;
  k text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF jsonb_typeof(_profile) IS DISTINCT FROM 'object'
     OR jsonb_typeof(_preferences) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Expected object patches';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_object_keys(_profile) AS key WHERE NOT key = ANY(ARRAY[
    'display_name','bio','date_of_birth','nationality','gender','city','country','neighborhood',
    'interests','social_links','trait_spark','trait_curiosity','trait_warmth','trait_depth',
    'traits_updated_at','onboarded_at'])) THEN
    RAISE EXCEPTION 'Invalid profile field';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_object_keys(_preferences) AS key WHERE NOT key = ANY(ARRAY[
    'intentions','gathering_types','preferred_group_size','social_energy',
    'conversation_style','spontaneity','stranger_comfort'])) THEN
    RAISE EXCEPTION 'Invalid preference field';
  END IF;
  FOREACH k IN ARRAY ARRAY['intentions','gathering_types'] LOOP
    IF _preferences ? k THEN
      IF jsonb_typeof(_preferences->k) IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'Expected preference array';
      END IF;
      IF EXISTS (SELECT 1 FROM jsonb_array_elements(_preferences->k) AS value
                 WHERE jsonb_typeof(value) <> 'string') THEN
        RAISE EXCEPTION 'Expected string preferences';
      END IF;
    END IF;
  END LOOP;
  p := jsonb_populate_record(NULL::public.profiles, _profile);
  q := jsonb_populate_record(NULL::public.user_gathering_preferences, _preferences);
  PERFORM 1 FROM public.profiles WHERE id = uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;

  IF _profile <> '{}'::jsonb THEN
    UPDATE public.profiles SET
      display_name = CASE WHEN _profile ? 'display_name' THEN p.display_name ELSE display_name END,
      bio = CASE WHEN _profile ? 'bio' THEN p.bio ELSE bio END,
      date_of_birth = CASE WHEN _profile ? 'date_of_birth' THEN p.date_of_birth ELSE date_of_birth END,
      nationality = CASE WHEN _profile ? 'nationality' THEN p.nationality ELSE nationality END,
      gender = CASE WHEN _profile ? 'gender' THEN p.gender ELSE gender END,
      city = CASE WHEN _profile ? 'city' THEN p.city ELSE city END,
      country = CASE WHEN _profile ? 'country' THEN p.country ELSE country END,
      neighborhood = CASE WHEN _profile ? 'neighborhood' THEN p.neighborhood ELSE neighborhood END,
      interests = CASE WHEN _profile ? 'interests' THEN p.interests ELSE interests END,
      social_links = CASE WHEN _profile ? 'social_links' THEN p.social_links ELSE social_links END,
      trait_spark = CASE WHEN _profile ? 'trait_spark' THEN p.trait_spark ELSE trait_spark END,
      trait_curiosity = CASE WHEN _profile ? 'trait_curiosity' THEN p.trait_curiosity ELSE trait_curiosity END,
      trait_warmth = CASE WHEN _profile ? 'trait_warmth' THEN p.trait_warmth ELSE trait_warmth END,
      trait_depth = CASE WHEN _profile ? 'trait_depth' THEN p.trait_depth ELSE trait_depth END,
      traits_updated_at = CASE WHEN _profile ? 'traits_updated_at' THEN p.traits_updated_at ELSE traits_updated_at END,
      onboarded_at = CASE WHEN _profile ? 'onboarded_at' THEN p.onboarded_at ELSE onboarded_at END,
      updated_at = now()
    WHERE id = uid;
    IF NOT FOUND THEN RAISE EXCEPTION 'Profile not writable'; END IF;
  END IF;
  IF _preferences <> '{}'::jsonb THEN
    INSERT INTO public.user_gathering_preferences AS existing
      (user_id, intentions, gathering_types, preferred_group_size, social_energy,
       conversation_style, spontaneity, stranger_comfort, updated_at)
    VALUES (uid, coalesce(q.intentions, '[]'::jsonb), coalesce(q.gathering_types, '[]'::jsonb),
      q.preferred_group_size, q.social_energy, q.conversation_style, q.spontaneity, q.stranger_comfort, now())
    ON CONFLICT (user_id) DO UPDATE SET
      intentions = CASE WHEN _preferences ? 'intentions' THEN excluded.intentions ELSE existing.intentions END,
      gathering_types = CASE WHEN _preferences ? 'gathering_types' THEN excluded.gathering_types ELSE existing.gathering_types END,
      preferred_group_size = CASE WHEN _preferences ? 'preferred_group_size' THEN excluded.preferred_group_size ELSE existing.preferred_group_size END,
      social_energy = CASE WHEN _preferences ? 'social_energy' THEN excluded.social_energy ELSE existing.social_energy END,
      conversation_style = CASE WHEN _preferences ? 'conversation_style' THEN excluded.conversation_style ELSE existing.conversation_style END,
      spontaneity = CASE WHEN _preferences ? 'spontaneity' THEN excluded.spontaneity ELSE existing.spontaneity END,
      stranger_comfort = CASE WHEN _preferences ? 'stranger_comfort' THEN excluded.stranger_comfort ELSE existing.stranger_comfort END,
      updated_at = now();
  END IF;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.save_my_profile_data(jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_my_profile_data(jsonb, jsonb) TO authenticated;
