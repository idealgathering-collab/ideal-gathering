-- IG-003: personal records, not a second profile or an automatic event feed.
CREATE TABLE public.life_moments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  gathering_id uuid REFERENCES public.gatherings(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 160),
  note text CHECK (char_length(note) <= 2000),
  photo_path text,
  happened_at timestamptz NOT NULL CHECK (isfinite(happened_at) AND happened_at <= now()),
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'profile')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT life_moment_photo_scope CHECK (photo_path IS NULL OR photo_path ~
    ('^' || user_id::text || '/' || id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'))
);
CREATE UNIQUE INDEX life_moments_user_gathering_unique
  ON public.life_moments(user_id, gathering_id) WHERE gathering_id IS NOT NULL;
CREATE INDEX life_moments_own_order ON public.life_moments(user_id, happened_at DESC, id DESC);
CREATE INDEX life_moments_profile_order ON public.life_moments(user_id, happened_at DESC, id DESC)
  WHERE visibility = 'profile';
CREATE INDEX life_moments_gathering_fk ON public.life_moments(gathering_id) WHERE gathering_id IS NOT NULL;

CREATE FUNCTION private.can_use_life_moments() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.uid() IS NOT NULL AND private.is_user(auth.uid())
    AND private.is_email_verified(auth.uid()) AND private.has_beta_access(auth.uid())
$$;
REVOKE ALL ON FUNCTION private.can_use_life_moments() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.can_use_life_moments() TO authenticated, service_role;

CREATE FUNCTION private.life_moment_profile_visible(_owner uuid, _visibility text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT _visibility = 'profile' AND private.can_use_life_moments()
    AND NOT private.is_blocked_pair(auth.uid(), _owner)
$$;
REVOKE ALL ON FUNCTION private.life_moment_profile_visible(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.life_moment_profile_visible(uuid, text) TO authenticated, service_role;

CREATE FUNCTION private.guard_life_moment() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE g public.gatherings;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Reject forged ownership before looking up any hidden gathering/attendance.
    IF auth.uid() IS NOT NULL AND (NEW.user_id <> auth.uid() OR NOT private.can_use_life_moments()) THEN
      RAISE EXCEPTION 'Forbidden';
    END IF;
    IF NEW.gathering_id IS NOT NULL THEN
      SELECT * INTO g FROM public.gatherings WHERE id = NEW.gathering_id FOR SHARE;
      IF NOT FOUND OR g.status <> 'approved'
        OR coalesce(g.ends_at, g.starts_at + interval '2 hours') > now()
        OR NOT (g.host_id = NEW.user_id OR EXISTS (
          SELECT 1 FROM public.gathering_attendees a WHERE a.gathering_id = g.id
            AND a.user_id = NEW.user_id AND a.checked_in_at IS NOT NULL
        )) THEN RAISE EXCEPTION 'Invalid gathering for moment'; END IF;
      -- The existing title and this date are the small historical record.
      -- Never rederive them (or copy location/participants) on subsequent reads.
      NEW.happened_at := g.starts_at;
    END IF;
    NEW.created_at := now();
  ELSE
    IF NEW.id IS DISTINCT FROM OLD.id OR NEW.user_id IS DISTINCT FROM OLD.user_id
      OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Immutable moment identity';
    END IF;
    IF NEW.gathering_id IS DISTINCT FROM OLD.gathering_id AND NOT (
      NEW.gathering_id IS NULL AND NOT EXISTS (SELECT 1 FROM public.gatherings WHERE id = OLD.gathering_id)
    ) THEN RAISE EXCEPTION 'Immutable gathering link'; END IF;
    IF OLD.gathering_id IS NOT NULL AND NEW.happened_at IS DISTINCT FROM OLD.happened_at THEN
      RAISE EXCEPTION 'Immutable gathering date';
    END IF;
  END IF;
  NEW.title := btrim(NEW.title);
  NEW.updated_at := now();
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.guard_life_moment() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER guard_life_moment BEFORE INSERT OR UPDATE ON public.life_moments
  FOR EACH ROW EXECUTE FUNCTION private.guard_life_moment();

ALTER TABLE public.life_moments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.life_moments FROM PUBLIC, anon, authenticated;
GRANT SELECT, DELETE ON public.life_moments TO authenticated;
GRANT INSERT (user_id, gathering_id, title, note, happened_at, visibility) ON public.life_moments TO authenticated;
GRANT UPDATE (title, note, photo_path, happened_at, visibility) ON public.life_moments TO authenticated;
GRANT ALL ON public.life_moments TO service_role;
-- Raw rows (including note) are always owner-only, even when shared.
CREATE POLICY "Life moments own read" ON public.life_moments FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Life moments own create" ON public.life_moments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND private.can_use_life_moments());
CREATE POLICY "Life moments own edit" ON public.life_moments FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND (visibility = 'private' OR private.can_use_life_moments()));
CREATE POLICY "Life moments own delete" ON public.life_moments FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Definer projection is necessary because granting shared row SELECT would leak notes.
CREATE FUNCTION public.list_visible_life_moments(_user_id uuid, _limit integer DEFAULT 50)
RETURNS TABLE (id uuid, user_id uuid, title text, photo_path text, happened_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT private.can_use_life_moments() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _limit IS NULL OR _limit < 1 OR _limit > 100 THEN RAISE EXCEPTION 'Invalid limit'; END IF;
  RETURN QUERY SELECT m.id, m.user_id, m.title, m.photo_path, m.happened_at
    FROM public.life_moments m WHERE m.user_id = _user_id
      AND private.life_moment_profile_visible(m.user_id, m.visibility)
    ORDER BY m.happened_at DESC, m.id DESC LIMIT _limit;
END $$;
REVOKE ALL ON FUNCTION public.list_visible_life_moments(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_visible_life_moments(uuid, integer) TO authenticated;

-- Private, bounded image storage. Object names are owner/moment/random-image.ext.
INSERT INTO storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
VALUES ('life-moment-media', 'life-moment-media', false, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp'];

CREATE FUNCTION private.owns_life_moment_photo(_name text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.life_moments m WHERE m.user_id = auth.uid()
    AND _name ~ ('^' || m.user_id::text || '/' || m.id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'))
$$;
CREATE FUNCTION private.can_read_life_moment_photo(_name text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  -- Other viewers receive only short-lived server-signed URLs after the safe
  -- projection authorizes them; they cannot mint arbitrary-lifetime URLs here.
  SELECT private.owns_life_moment_photo(_name)
$$;
REVOKE ALL ON FUNCTION private.owns_life_moment_photo(text), private.can_read_life_moment_photo(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.owns_life_moment_photo(text), private.can_read_life_moment_photo(text) TO authenticated, service_role;

CREATE POLICY "Moment media read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'life-moment-media' AND private.can_read_life_moment_photo(name));
CREATE POLICY "Moment media insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'life-moment-media' AND private.owns_life_moment_photo(name) AND private.can_use_life_moments());
CREATE POLICY "Moment media delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'life-moment-media' AND private.owns_life_moment_photo(name));
-- Keep all other buckets' policies unchanged; prevent broad legacy policies from
-- accidentally granting access to this bucket. No overwrite/rename of images.
CREATE POLICY "Moment media read boundary" ON storage.objects AS RESTRICTIVE FOR SELECT TO authenticated
  USING (bucket_id <> 'life-moment-media' OR private.can_read_life_moment_photo(name));
CREATE POLICY "Moment media insert boundary" ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (bucket_id <> 'life-moment-media' OR (private.owns_life_moment_photo(name) AND private.can_use_life_moments()));
CREATE POLICY "Moment media update boundary" ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (bucket_id <> 'life-moment-media') WITH CHECK (bucket_id <> 'life-moment-media');
CREATE POLICY "Moment media delete boundary" ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated
  USING (bucket_id <> 'life-moment-media' OR private.owns_life_moment_photo(name));
CREATE POLICY "Moment media anonymous boundary" ON storage.objects AS RESTRICTIVE FOR ALL TO anon
  USING (bucket_id <> 'life-moment-media') WITH CHECK (bucket_id <> 'life-moment-media');
NOTIFY pgrst, 'reload schema';
