BEGIN;

-- Temporary guests are capabilities, never auth users or room members.
CREATE TABLE private.gathering_guest_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gathering_id uuid NOT NULL REFERENCES public.gatherings(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  label text NOT NULL CHECK (char_length(btrim(label)) BETWEEN 1 AND 80),
  guest_name text CHECK (char_length(btrim(guest_name)) BETWEEN 1 AND 80),
  response text NOT NULL DEFAULT 'invited' CHECK (response IN ('invited','going','maybe','declined')),
  adult_attested_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  CHECK (expires_at > created_at),
  CHECK (response = 'invited' OR (guest_name IS NOT NULL AND adult_attested_at IS NOT NULL))
);
CREATE INDEX guest_invitation_gathering ON private.gathering_guest_invitations(gathering_id);
ALTER TABLE private.gathering_guest_invitations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.gathering_guest_invitations FROM PUBLIC, anon, authenticated, service_role;

CREATE TABLE private.guest_request_limits (
  bucket text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  hits integer NOT NULL
);
ALTER TABLE private.guest_request_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.guest_request_limits FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION private.active_guest_seats(_id uuid) RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT count(*)::integer FROM private.gathering_guest_invitations
  WHERE gathering_id = _id AND response = 'going' AND revoked_at IS NULL AND expires_at > now()
$$;
REVOKE ALL ON FUNCTION private.active_guest_seats(uuid) FROM PUBLIC, anon, authenticated, service_role;

-- Aggregate capacity only; never expose guest names/links to invited members.
CREATE FUNCTION private.private_gathering_seat_counts(_ids uuid[]) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE result jsonb;
BEGIN
  IF auth.uid() IS NULL OR _ids IS NULL OR coalesce(array_length(_ids,1),0)>100 THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT coalesce(jsonb_object_agg(g.id::text,
    (SELECT count(*) FROM public.gathering_attendees WHERE gathering_id=g.id)+private.active_guest_seats(g.id)),'{}'::jsonb)
    INTO result FROM public.gatherings g WHERE g.id=ANY(_ids) AND g.visibility='private' AND private.can_read_private_gathering(g.id);
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION private.private_gathering_seat_counts(uuid[]) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION private.private_gathering_seat_counts(uuid[]) TO authenticated;
CREATE FUNCTION public.private_gathering_seat_counts(_ids uuid[]) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$ SELECT private.private_gathering_seat_counts(_ids) $$;
REVOKE ALL ON FUNCTION public.private_gathering_seat_counts(uuid[]) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.private_gathering_seat_counts(uuid[]) TO authenticated;

-- Preserve the existing member-capacity behavior and gathering row lock.
CREATE OR REPLACE FUNCTION public.enforce_gathering_capacity() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE g public.gatherings; taken integer;
BEGIN
  SELECT * INTO g FROM public.gatherings WHERE id = NEW.gathering_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'GATHERING_MISSING'; END IF;
  IF g.status IN ('cancelled','rejected') THEN RAISE EXCEPTION 'GATHERING_CLOSED'; END IF;
  IF EXISTS (SELECT 1 FROM public.gathering_attendees WHERE gathering_id = NEW.gathering_id AND user_id = NEW.user_id) THEN RETURN NEW; END IF;
  SELECT count(*) INTO taken FROM public.gathering_attendees WHERE gathering_id = NEW.gathering_id;
  IF g.visibility = 'private' THEN taken := taken + private.active_guest_seats(g.id); END IF;
  IF taken >= g.seats THEN RAISE EXCEPTION 'GATHERING_FULL'; END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.enforce_gathering_capacity() FROM PUBLIC, anon, authenticated;

CREATE FUNCTION private.guard_guest_capacity_edit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.visibility = 'private' AND NEW.seats <
    (SELECT count(*) FROM public.gathering_attendees WHERE gathering_id = OLD.id) + private.active_guest_seats(OLD.id)
  THEN RAISE EXCEPTION 'GATHERING_FULL'; END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.guard_guest_capacity_edit() FROM PUBLIC, anon, authenticated, service_role;
CREATE TRIGGER guest_capacity_edit BEFORE UPDATE OF seats ON public.gatherings
  FOR EACH ROW EXECUTE FUNCTION private.guard_guest_capacity_edit();

CREATE FUNCTION private.manage_guest_invitation(_id uuid, _action text, _hash text DEFAULT NULL,
  _label text DEFAULT NULL, _days integer DEFAULT NULL, _invite uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE g public.gatherings; result jsonb; expiry timestamptz;
BEGIN
  SELECT * INTO g FROM public.gatherings WHERE id = _id FOR UPDATE;
  IF auth.uid() IS NULL OR g.host_id IS DISTINCT FROM auth.uid() OR g.visibility <> 'private'
    OR NOT private.private_gathering_eligible(auth.uid()) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _action = 'create' THEN
    IF g.status IN ('cancelled','rejected') OR g.starts_at <= now() THEN RAISE EXCEPTION 'PRIVATE_CLOSED'; END IF;
    IF _hash IS NULL OR _hash !~ '^[0-9a-f]{64}$' OR _label IS NULL
      OR char_length(btrim(_label)) NOT BETWEEN 1 AND 80 OR _days IS NULL OR _days NOT IN (1,3,7)
    THEN RAISE EXCEPTION 'Invalid invitation'; END IF;
    -- Durable quotas; revocation does not reset creation allowance.
    IF (SELECT count(*) FROM private.gathering_guest_invitations i JOIN public.gatherings e ON e.id=i.gathering_id
      WHERE e.host_id=auth.uid() AND i.created_at > now()-interval '1 hour') >= 30
      OR (SELECT count(*) FROM private.gathering_guest_invitations WHERE gathering_id=_id) >= 100
    THEN RAISE EXCEPTION 'GUEST_RATE_LIMIT'; END IF;
    -- Serialize the cross-gathering host quota as well.
    PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 62));
    IF (SELECT count(*) FROM private.gathering_guest_invitations i JOIN public.gatherings e ON e.id=i.gathering_id
      WHERE e.host_id=auth.uid() AND i.created_at > now()-interval '1 hour') >= 30
    THEN RAISE EXCEPTION 'GUEST_RATE_LIMIT'; END IF;
    expiry := least(now()+make_interval(days=>_days),g.starts_at);
    INSERT INTO private.gathering_guest_invitations(gathering_id,token_hash,label,expires_at)
      VALUES (_id,_hash,btrim(_label),expiry) RETURNING jsonb_build_object('id',id,'expires_at',expires_at) INTO result;
    RETURN result;
  ELSIF _action = 'revoke' THEN
    UPDATE private.gathering_guest_invitations SET revoked_at=coalesce(revoked_at,now()),updated_at=now()
      WHERE id=_invite AND gathering_id=_id;
    RETURN '{}'::jsonb;
  ELSIF _action <> 'list' OR _action IS NULL THEN RAISE EXCEPTION 'Invalid action'; END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',i.id,'label',i.label,'guest_name',i.guest_name,
    'response',i.response,'expires_at',i.expires_at,'revoked_at',i.revoked_at,'created_at',i.created_at)
    ORDER BY i.created_at DESC),'[]'::jsonb) INTO result
    FROM private.gathering_guest_invitations i WHERE i.gathering_id=_id;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION private.manage_guest_invitation(uuid,text,text,text,integer,uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION private.manage_guest_invitation(uuid,text,text,text,integer,uuid) TO authenticated;
CREATE FUNCTION public.manage_guest_invitation(_id uuid, _action text, _hash text DEFAULT NULL,
  _label text DEFAULT NULL, _days integer DEFAULT NULL, _invite uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$ SELECT private.manage_guest_invitation(_id,_action,_hash,_label,_days,_invite) $$;
REVOKE ALL ON FUNCTION public.manage_guest_invitation(uuid,text,text,text,integer,uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.manage_guest_invitation(uuid,text,text,text,integer,uuid) TO authenticated;

-- Persistent fixed windows. Return false rather than throw, so rejected attempts
-- remain counted. Only the trusted server may choose keys and invoke these RPCs.
CREATE FUNCTION private.consume_guest_limit(_key text, _maximum integer, _seconds integer) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE hits integer;
BEGIN
  INSERT INTO private.guest_request_limits AS l(bucket,window_start,hits) VALUES(_key,now(),1)
    ON CONFLICT(bucket) DO UPDATE SET
      hits=CASE WHEN l.window_start <= now()-make_interval(secs=>_seconds) THEN 1 ELSE l.hits+1 END,
      window_start=CASE WHEN l.window_start <= now()-make_interval(secs=>_seconds) THEN now() ELSE l.window_start END
    RETURNING l.hits INTO hits;
  RETURN hits <= _maximum;
END $$;
REVOKE ALL ON FUNCTION private.consume_guest_limit(text,integer,integer) FROM PUBLIC, anon, authenticated, service_role;
CREATE FUNCTION private.guest_invitation_limit(_hash text, _ip_hash text DEFAULT NULL) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  -- Global first: bound storage/work even when attackers rotate random tokens.
  IF NOT private.consume_guest_limit('global',300,60) THEN RETURN false; END IF;
  IF _hash IS NULL OR _hash !~ '^[0-9a-f]{64}$' THEN RETURN false; END IF;
  DELETE FROM private.guest_request_limits WHERE window_start < now()-interval '1 day' AND bucket <> 'global';
  IF _ip_hash IS NOT NULL THEN
    IF _ip_hash !~ '^[0-9a-f]{64}$' THEN RETURN false; END IF;
    IF NOT private.consume_guest_limit('ip:'||_ip_hash,60,600) THEN RETURN false; END IF;
  END IF;
  RETURN private.consume_guest_limit('token:'||_hash,30,600);
END $$;
REVOKE ALL ON FUNCTION private.guest_invitation_limit(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.guest_invitation_limit(text,text) TO service_role;
GRANT USAGE ON SCHEMA private TO service_role;
CREATE FUNCTION public.guest_invitation_limit(_hash text, _ip_hash text DEFAULT NULL) RETURNS boolean
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$ SELECT private.guest_invitation_limit(_hash,_ip_hash) $$;
REVOKE ALL ON FUNCTION public.guest_invitation_limit(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guest_invitation_limit(text,text) TO service_role;

CREATE FUNCTION private.use_guest_invitation(_hash text, _adult boolean, _response text DEFAULT NULL,
  _name text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE i private.gathering_guest_invitations; g public.gatherings; event_id uuid; taken integer;
BEGIN
  IF _adult IS DISTINCT FROM true OR _hash IS NULL OR _hash !~ '^[0-9a-f]{64}$' THEN RETURN NULL; END IF;
  SELECT gathering_id INTO event_id FROM private.gathering_guest_invitations WHERE token_hash=_hash;
  -- Same lock/order as members, host revocation and edits; re-read token after locking.
  SELECT * INTO g FROM public.gatherings WHERE id=event_id FOR UPDATE;
  SELECT * INTO i FROM private.gathering_guest_invitations WHERE token_hash=_hash;
  IF i.id IS NULL OR i.revoked_at IS NOT NULL OR i.expires_at <= now() OR g.starts_at <= now()
    OR g.visibility <> 'private' OR g.status <> 'approved' OR NOT private.private_gathering_eligible(g.host_id)
  THEN RETURN NULL; END IF;
  IF _response IS NOT NULL THEN
    IF _response NOT IN ('going','maybe','declined') OR _name IS NULL OR char_length(btrim(_name)) NOT BETWEEN 1 AND 80
    THEN RAISE EXCEPTION 'Invalid response'; END IF;
    IF _response='going' AND i.response<>'going' THEN
      SELECT count(*) INTO taken FROM public.gathering_attendees WHERE gathering_id=g.id;
      IF taken+private.active_guest_seats(g.id) >= g.seats THEN RAISE EXCEPTION 'GATHERING_FULL'; END IF;
    END IF;
    UPDATE private.gathering_guest_invitations SET response=_response,guest_name=btrim(_name),
      adult_attested_at=coalesce(adult_attested_at,now()),updated_at=now() WHERE id=i.id
      RETURNING * INTO i;
  END IF;
  RETURN jsonb_build_object('subject',g.subject,'starts_at',g.starts_at,'venue_name',g.venue_name,
    'address',g.address,'description',g.description,'response',i.response,'guest_name',i.guest_name,'expires_at',i.expires_at);
END $$;
REVOKE ALL ON FUNCTION private.use_guest_invitation(text,boolean,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.use_guest_invitation(text,boolean,text,text) TO service_role;
CREATE FUNCTION public.use_guest_invitation(_hash text, _adult boolean, _response text DEFAULT NULL,
  _name text DEFAULT NULL) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT private.use_guest_invitation(_hash,_adult,_response,_name)
$$;
REVOKE ALL ON FUNCTION public.use_guest_invitation(text,boolean,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.use_guest_invitation(text,boolean,text,text) TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;
