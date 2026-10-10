BEGIN;

ALTER TABLE public.gatherings ADD COLUMN visibility text NOT NULL DEFAULT 'public'
  CHECK (visibility IN ('public','private'));
ALTER TABLE public.gatherings ADD CONSTRAINT private_gathering_shape CHECK (
  visibility <> 'private' OR (origin = 'user_proposed' AND business_id IS NULL AND table_id IS NULL
    AND seats BETWEEN 2 AND 30 AND char_length(btrim(subject)) BETWEEN 3 AND 120
    AND char_length(btrim(venue_name)) BETWEEN 2 AND 160
    AND char_length(coalesce(description,'')) <= 800 AND char_length(coalesce(address,'')) <= 240));

CREATE TABLE public.gathering_invitations (
  gathering_id uuid NOT NULL REFERENCES public.gatherings(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  response text NOT NULL DEFAULT 'invited' CHECK (response IN ('invited','going','maybe','declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  PRIMARY KEY (gathering_id, recipient_id)
);
CREATE INDEX gathering_invitations_recipient ON public.gathering_invitations(recipient_id, created_at DESC);
ALTER TABLE public.gathering_invitations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.gathering_invitations FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.gathering_invitations TO authenticated;
GRANT ALL ON public.gathering_invitations TO service_role;

-- Non-exposed definers are necessary to avoid circular gathering/attendee RLS
-- and to resolve exact account email without exposing an account directory.
CREATE FUNCTION private.private_gathering_eligible(_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT _uid IS NOT NULL AND private.is_user(_uid)
    AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = _uid AND u.email_confirmed_at IS NOT NULL)
    AND private.has_beta_access(_uid) AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _uid
      AND p.date_of_birth <= (current_date - interval '18 years')::date
      AND p.date_of_birth >= (current_date - interval '120 years')::date)
$$;
REVOKE ALL ON FUNCTION private.private_gathering_eligible(uuid) FROM PUBLIC, anon, authenticated;

CREATE FUNCTION private.can_read_private_gathering(_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.gatherings g WHERE g.id = _id AND (
    g.host_id = auth.uid() OR private.has_role(auth.uid(),'admin'::public.app_role)
    OR (g.status = 'approved' AND private.private_gathering_eligible(auth.uid())
      AND NOT private.is_blocked_pair(auth.uid(),g.host_id)
      AND EXISTS (SELECT 1 FROM public.gathering_invitations i WHERE i.gathering_id = g.id
        AND i.recipient_id = auth.uid() AND i.revoked_at IS NULL))))
$$;
REVOKE ALL ON FUNCTION private.can_read_private_gathering(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.can_read_private_gathering(uuid) TO authenticated;

CREATE POLICY private_gathering_visibility ON public.gatherings AS RESTRICTIVE
  FOR SELECT TO authenticated USING (visibility = 'public' OR host_id = auth.uid() OR private.can_read_private_gathering(id));
CREATE POLICY private_gathering_anon ON public.gatherings AS RESTRICTIVE
  FOR SELECT TO anon USING (visibility = 'public');
CREATE POLICY private_invitee_read ON public.gatherings FOR SELECT TO authenticated
  USING (visibility = 'private' AND private.can_read_private_gathering(id));
CREATE POLICY invitation_read ON public.gathering_invitations FOR SELECT TO authenticated USING (
  (recipient_id = auth.uid() AND private.can_read_private_gathering(gathering_id))
  OR EXISTS (SELECT 1 FROM public.gatherings g WHERE g.id = gathering_id AND g.host_id = auth.uid()));

CREATE FUNCTION private.guard_private_gathering() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.visibility IS DISTINCT FROM OLD.visibility
    OR (OLD.visibility = 'private' AND NEW.host_id IS DISTINCT FROM OLD.host_id)) THEN
    RAISE EXCEPTION 'PRIVATE_VISIBILITY_IMMUTABLE';
  END IF;
  IF NEW.visibility = 'private' THEN
    IF TG_OP = 'INSERT' THEN
      IF auth.uid() IS NULL OR NEW.host_id <> auth.uid() OR NOT private.private_gathering_eligible(auth.uid()) THEN
        RAISE EXCEPTION 'PRIVATE_ADULT_REQUIRED';
      END IF;
      IF NEW.starts_at <= now() THEN RAISE EXCEPTION 'PRIVATE_CLOSED'; END IF;
    END IF;
    IF TG_OP = 'UPDATE' AND NEW.seats < (SELECT count(*) FROM public.gathering_attendees WHERE gathering_id = OLD.id) THEN
      RAISE EXCEPTION 'GATHERING_FULL';
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.guard_private_gathering() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER private_gathering_guard BEFORE INSERT OR UPDATE ON public.gatherings
  FOR EACH ROW EXECUTE FUNCTION private.guard_private_gathering();

CREATE FUNCTION private.can_join_private_gathering(_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.gatherings g WHERE g.id = _id
    AND (g.visibility = 'public' OR (g.status = 'approved' AND g.starts_at > now()
      AND private.private_gathering_eligible(auth.uid()) AND NOT private.is_blocked_pair(auth.uid(),g.host_id)
      AND (g.host_id = auth.uid() OR EXISTS (SELECT 1 FROM public.gathering_invitations i
        WHERE i.gathering_id = _id AND i.recipient_id = auth.uid() AND i.response = 'going' AND i.revoked_at IS NULL)))))
$$;
REVOKE ALL ON FUNCTION private.can_join_private_gathering(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.can_join_private_gathering(uuid) TO authenticated;
CREATE POLICY private_join_access ON public.gathering_attendees AS RESTRICTIVE
  FOR INSERT TO authenticated WITH CHECK (private.can_join_private_gathering(gathering_id));

-- Reserve the host's seat too. Proposed events still cannot be joined by guests.
CREATE FUNCTION private.reserve_private_host() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.visibility = 'private' THEN
    INSERT INTO public.gathering_attendees(gathering_id,user_id) VALUES (NEW.id,NEW.host_id);
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.reserve_private_host() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER reserve_private_host AFTER INSERT ON public.gatherings
  FOR EACH ROW EXECUTE FUNCTION private.reserve_private_host();

CREATE FUNCTION private.sync_private_leave() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE g public.gatherings;
BEGIN
  SELECT * INTO g FROM public.gatherings WHERE id = OLD.gathering_id FOR UPDATE;
  IF g.visibility = 'private' THEN
    IF g.host_id = OLD.user_id THEN RAISE EXCEPTION 'PRIVATE_HOST_SEAT_REQUIRED'; END IF;
    UPDATE public.gathering_invitations SET response = 'declined', updated_at = now()
      WHERE gathering_id = OLD.gathering_id AND recipient_id = OLD.user_id AND response = 'going';
  END IF;
  RETURN OLD;
END $$;
REVOKE ALL ON FUNCTION private.sync_private_leave() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER sync_private_leave BEFORE DELETE ON public.gathering_attendees
  FOR EACH ROW EXECUTE FUNCTION private.sync_private_leave();

CREATE FUNCTION private.invite_gathering_member(_id uuid, _email text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE g public.gatherings; recipient uuid;
BEGIN
  SELECT * INTO g FROM public.gatherings WHERE id = _id FOR UPDATE;
  IF auth.uid() IS NULL OR g.host_id IS DISTINCT FROM auth.uid() OR g.visibility <> 'private'
    OR NOT private.private_gathering_eligible(auth.uid()) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF g.status IN ('cancelled','rejected') OR g.starts_at <= now() THEN RAISE EXCEPTION 'PRIVATE_CLOSED'; END IF;
  IF char_length(_email) > 254 OR char_length(btrim(_email)) < 3 THEN RAISE EXCEPTION 'PRIVATE_INVITEE_UNAVAILABLE'; END IF;
  SELECT id INTO recipient FROM auth.users WHERE lower(email) = lower(btrim(_email)) LIMIT 1;
  IF recipient IS NULL OR recipient = g.host_id OR NOT private.private_gathering_eligible(recipient)
    OR private.is_blocked_pair(recipient,g.host_id) THEN RAISE EXCEPTION 'PRIVATE_INVITEE_UNAVAILABLE'; END IF;
  -- Active duplicate invites are idempotent; revocation requires explicit re-invite.
  INSERT INTO public.gathering_invitations(gathering_id,recipient_id) VALUES (_id,recipient)
    ON CONFLICT(gathering_id,recipient_id) DO UPDATE SET response = CASE
      WHEN gathering_invitations.revoked_at IS NOT NULL THEN 'invited' ELSE gathering_invitations.response END,
      revoked_at = NULL, updated_at = now();
END $$;

CREATE FUNCTION private.respond_gathering_invitation(_id uuid, _response text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE g public.gatherings;
BEGIN
  -- Same gathering lock as existing capacity/attribution guards serializes RSVP,
  -- revocation, and host edits. Any insertion failure rolls back response too.
  SELECT * INTO g FROM public.gatherings WHERE id = _id FOR UPDATE;
  IF auth.uid() IS NULL OR NOT private.private_gathering_eligible(auth.uid())
    OR NOT private.can_read_private_gathering(_id) OR NOT EXISTS (SELECT 1 FROM public.gathering_invitations
      WHERE gathering_id = _id AND recipient_id = auth.uid() AND revoked_at IS NULL) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF g.visibility <> 'private' OR g.status <> 'approved' OR g.starts_at <= now() THEN RAISE EXCEPTION 'PRIVATE_CLOSED'; END IF;
  IF _response IS NULL OR _response NOT IN ('going','maybe','declined') THEN RAISE EXCEPTION 'Invalid response'; END IF;
  IF _response = 'going' THEN
    UPDATE public.gathering_invitations SET response = _response, updated_at = now()
      WHERE gathering_id = _id AND recipient_id = auth.uid();
    INSERT INTO public.gathering_attendees(gathering_id,user_id) VALUES (_id,auth.uid()) ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.gathering_attendees WHERE gathering_id = _id AND user_id = auth.uid();
    UPDATE public.gathering_invitations SET response = _response, updated_at = now()
      WHERE gathering_id = _id AND recipient_id = auth.uid();
  END IF;
END $$;

CREATE FUNCTION private.revoke_gathering_invitation(_id uuid, _recipient uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE g public.gatherings;
BEGIN
  SELECT * INTO g FROM public.gatherings WHERE id = _id FOR UPDATE;
  IF auth.uid() IS NULL OR g.host_id IS DISTINCT FROM auth.uid() OR g.visibility <> 'private'
    OR NOT private.private_gathering_eligible(auth.uid()) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.gathering_invitations SET revoked_at = now(), updated_at = now()
    WHERE gathering_id = _id AND recipient_id = _recipient;
  DELETE FROM public.gathering_attendees WHERE gathering_id = _id AND user_id = _recipient AND user_id <> g.host_id;
END $$;

REVOKE ALL ON FUNCTION private.invite_gathering_member(uuid,text), private.respond_gathering_invitation(uuid,text),
  private.revoke_gathering_invitation(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.invite_gathering_member(uuid,text), private.respond_gathering_invitation(uuid,text),
  private.revoke_gathering_invitation(uuid,uuid) TO authenticated;
CREATE FUNCTION public.invite_gathering_member(_id uuid, _email text) RETURNS void
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$ SELECT private.invite_gathering_member(_id,_email) $$;
CREATE FUNCTION public.respond_gathering_invitation(_id uuid, _response text) RETURNS void
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$ SELECT private.respond_gathering_invitation(_id,_response) $$;
CREATE FUNCTION public.revoke_gathering_invitation(_id uuid, _recipient uuid) RETURNS void
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$ SELECT private.revoke_gathering_invitation(_id,_recipient) $$;
REVOKE ALL ON FUNCTION public.invite_gathering_member(uuid,text), public.respond_gathering_invitation(uuid,text),
  public.revoke_gathering_invitation(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.invite_gathering_member(uuid,text), public.respond_gathering_invitation(uuid,text),
  public.revoke_gathering_invitation(uuid,uuid) TO authenticated;

-- Room reads must also honor revocation/blocking even if a legacy membership
-- row remains. Public behavior stays intact. Policies are ANDed with existing RLS.
CREATE FUNCTION private.private_room_access(_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.gatherings g WHERE g.id = _id
    AND (g.visibility = 'public' OR (private.can_read_private_gathering(_id)
      AND (g.host_id = auth.uid() OR EXISTS (SELECT 1 FROM public.gathering_attendees a
        WHERE a.gathering_id = _id AND a.user_id = auth.uid())))))
$$;
REVOKE ALL ON FUNCTION private.private_room_access(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.private_room_access(uuid) TO authenticated;
CREATE POLICY private_attendee_access ON public.gathering_attendees AS RESTRICTIVE
  FOR SELECT TO authenticated USING (private.private_room_access(gathering_id));
CREATE POLICY private_member_roster ON public.gathering_attendees FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.gatherings g WHERE g.id = gathering_id AND g.visibility = 'private')
    AND private.private_room_access(gathering_id));
CREATE POLICY private_message_access ON public.gathering_messages AS RESTRICTIVE
  FOR ALL TO authenticated USING (private.private_room_access(gathering_id)) WITH CHECK (private.private_room_access(gathering_id));
CREATE POLICY private_checklist_access ON public.gathering_checklist_items AS RESTRICTIVE
  FOR ALL TO authenticated USING (private.private_room_access(gathering_id)) WITH CHECK (private.private_room_access(gathering_id));

-- Retain the link when a private source is deleted so its snapshot cannot later
-- be made public: a durable privacy marker is needed on the personal moment.
ALTER TABLE public.life_moments ADD COLUMN private_gathering boolean NOT NULL DEFAULT false;
CREATE FUNCTION private.mark_private_event_moment() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN NEW.private_gathering := OLD.private_gathering; END IF;
  IF EXISTS (SELECT 1 FROM public.gatherings g WHERE g.id = NEW.gathering_id AND g.visibility = 'private') THEN
    NEW.private_gathering := true;
  END IF;
  IF NEW.private_gathering AND NEW.visibility <> 'private' THEN RAISE EXCEPTION 'PRIVATE_MOMENT_REQUIRED'; END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.mark_private_event_moment() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER mark_private_event_moment BEFORE INSERT OR UPDATE ON public.life_moments
  FOR EACH ROW EXECUTE FUNCTION private.mark_private_event_moment();

NOTIFY pgrst, 'reload schema';
COMMIT;
