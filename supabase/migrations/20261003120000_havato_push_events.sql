-- Havato only (ntmnpmdjfrbporcvafei). Additive; never apply to Ideal Gathering.
BEGIN;
CREATE TABLE public.havato_push_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('gathering_joined','gathering_updated','gathering_cancelled','gathering_reminder','account_ready','venue_approved','venue_rejected','chat_message')),
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL,
  actor_id uuid,
  snapshot text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '1 day',
  claimed_at timestamptz,
  UNIQUE(event_key, recipient_id)
);
ALTER TABLE public.havato_push_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.havato_push_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.havato_push_events TO service_role;
CREATE INDEX havato_push_pending ON public.havato_push_events(created_at) WHERE claimed_at IS NULL;

CREATE FUNCTION private.havato_push_enqueue(_key text, _kind text, _recipient uuid, _resource uuid, _actor uuid DEFAULT NULL, _snapshot text DEFAULT NULL)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  INSERT INTO public.havato_push_events(event_key,kind,recipient_id,resource_id,actor_id,snapshot)
  VALUES (_key,_kind,_recipient,_resource,_actor,_snapshot) ON CONFLICT DO NOTHING;
$$;
REVOKE ALL ON FUNCTION private.havato_push_enqueue(text,text,uuid,uuid,uuid,text) FROM PUBLIC, anon, authenticated;

-- Uses the existing access predicates, plus email verification. No profile text.
CREATE FUNCTION private.havato_push_member(_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT private.is_email_verified(_user) AND
    (private.has_beta_access(_user) OR private.venue_has_beta_access(_user));
$$;
REVOKE ALL ON FUNCTION private.havato_push_member(uuid) FROM PUBLIC, anon, authenticated;

CREATE FUNCTION private.havato_capture_push_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE g public.gatherings; r uuid; k text; revision text := gen_random_uuid()::text;
BEGIN
  IF TG_TABLE_NAME = 'gathering_attendees' THEN
    SELECT * INTO g FROM public.gatherings WHERE id = NEW.gathering_id;
    IF g.status = 'approved' THEN
      PERFORM private.havato_push_enqueue('join:'||revision,'gathering_joined',NEW.user_id,g.id,NEW.user_id);
    END IF;
  ELSIF TG_TABLE_NAME = 'gathering_messages' THEN
    SELECT * INTO g FROM public.gatherings WHERE id = NEW.gathering_id;
    IF g.status = 'approved' THEN
      FOR r IN SELECT g.host_id UNION SELECT user_id FROM public.gathering_attendees WHERE gathering_id = g.id LOOP
        IF r <> NEW.sender_id AND NOT private.is_blocked_pair(r,NEW.sender_id) THEN
          PERFORM private.havato_push_enqueue('message:'||NEW.id,'chat_message',r,g.id,NEW.sender_id,NEW.id::text);
        END IF;
      END LOOP;
    END IF;
  ELSIF TG_TABLE_NAME = 'gatherings' THEN
    IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM NEW.status THEN
      k := 'gathering_cancelled';
    ELSIF NEW.status = 'approved' AND
      (OLD.status IS DISTINCT FROM NEW.status OR
       ROW(OLD.starts_at,OLD.ends_at,OLD.subject,OLD.description,OLD.venue_name,OLD.neighborhood,OLD.business_id,OLD.table_id)
       IS DISTINCT FROM ROW(NEW.starts_at,NEW.ends_at,NEW.subject,NEW.description,NEW.venue_name,NEW.neighborhood,NEW.business_id,NEW.table_id)) THEN
      k := 'gathering_updated';
    END IF;
    IF k IS NOT NULL THEN
      FOR r IN SELECT NEW.host_id UNION SELECT user_id FROM public.gathering_attendees WHERE gathering_id = NEW.id LOOP
        PERFORM private.havato_push_enqueue('gathering:'||revision,k,r,NEW.id,NULL,NEW.status::text);
      END LOOP;
    END IF;
  ELSIF TG_TABLE_NAME = 'businesses' THEN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('approved','rejected') THEN
      PERFORM private.havato_push_enqueue('venue:'||revision,'venue_'||NEW.status,NEW.owner_id,NEW.id,NULL,NEW.status::text);
    END IF;
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    IF OLD.access_status IS DISTINCT FROM NEW.access_status AND NEW.access_status IN ('onboarded','active') AND public.is_beta_launched() THEN
      PERFORM private.havato_push_enqueue('account:'||revision,'account_ready',NEW.id,NEW.id);
    END IF;
  ELSIF TG_TABLE_NAME = 'app_config' THEN
    IF NEW.beta_launched AND NOT OLD.beta_launched THEN
      FOR r IN SELECT id FROM public.profiles WHERE access_status IN ('onboarded','active')
        UNION SELECT owner_id FROM public.businesses WHERE status = 'approved' LOOP
        PERFORM private.havato_push_enqueue('launch:'||revision,'account_ready',r,r);
      END LOOP;
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.havato_capture_push_event() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER havato_push_join AFTER INSERT ON public.gathering_attendees FOR EACH ROW EXECUTE FUNCTION private.havato_capture_push_event();
CREATE TRIGGER havato_push_chat AFTER INSERT ON public.gathering_messages FOR EACH ROW EXECUTE FUNCTION private.havato_capture_push_event();
CREATE TRIGGER havato_push_gathering AFTER UPDATE ON public.gatherings FOR EACH ROW EXECUTE FUNCTION private.havato_capture_push_event();
CREATE TRIGGER havato_push_venue AFTER UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION private.havato_capture_push_event();
CREATE TRIGGER havato_push_profile AFTER UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION private.havato_capture_push_event();
CREATE TRIGGER havato_push_launch AFTER UPDATE ON public.app_config FOR EACH ROW EXECUTE FUNCTION private.havato_capture_push_event();

-- Re-check current membership, access, blocking, state and message existence at dispatch.
CREATE FUNCTION private.havato_push_eligible(e public.havato_push_events)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE g public.gatherings;
BEGIN
  IF NOT private.is_email_verified(e.recipient_id) THEN RETURN false; END IF;
  IF e.kind IN ('venue_approved','venue_rejected') THEN
    RETURN EXISTS(SELECT 1 FROM public.businesses b WHERE b.id=e.resource_id AND b.owner_id=e.recipient_id AND b.status::text=e.snapshot);
  END IF;
  IF NOT private.havato_push_member(e.recipient_id) THEN RETURN false; END IF;
  IF e.kind = 'account_ready' THEN RETURN e.resource_id=e.recipient_id; END IF;
  SELECT * INTO g FROM public.gatherings WHERE id=e.resource_id;
  IF NOT FOUND OR private.is_blocked_pair(e.recipient_id,g.host_id) THEN RETURN false; END IF;
  IF e.kind = 'gathering_cancelled' THEN
    IF g.status <> 'cancelled' THEN RETURN false; END IF;
  ELSIF g.status <> 'approved' THEN RETURN false;
  END IF;
  IF e.recipient_id <> g.host_id AND NOT EXISTS(SELECT 1 FROM public.gathering_attendees a WHERE a.gathering_id=g.id AND a.user_id=e.recipient_id) THEN RETURN false; END IF;
  IF e.kind = 'gathering_reminder' THEN
    RETURN g.starts_at > now() AND g.starts_at::text=e.snapshot;
  END IF;
  IF e.kind = 'chat_message' THEN
    RETURN e.actor_id <> e.recipient_id AND NOT private.is_blocked_pair(e.recipient_id,e.actor_id)
      AND EXISTS(SELECT 1 FROM public.gathering_messages m WHERE m.id::text=e.snapshot AND m.gathering_id=g.id AND m.sender_id=e.actor_id)
      AND e.created_at > now()-interval '5 minutes';
  END IF;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION private.havato_push_eligible(public.havato_push_events) FROM PUBLIC, anon, authenticated;

-- One server timer calls this service-only RPC. SKIP LOCKED supports multiple replicas.
-- Claim BEFORE egress: at most one attempt, including crashes/ambiguous provider timeouts.
CREATE FUNCTION public.havato_claim_push_events(_lead_minutes integer DEFAULT 60)
RETURNS SETOF public.havato_push_events LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF _lead_minutes < 1 OR _lead_minutes > 1440 OR _lead_minutes IS NULL THEN RAISE EXCEPTION 'Invalid reminder lead'; END IF;
  DELETE FROM public.havato_push_events WHERE created_at < now()-interval '7 days';
  INSERT INTO public.havato_push_events(event_key,kind,recipient_id,resource_id,snapshot,expires_at)
    SELECT 'reminder:'||g.id||':'||extract(epoch FROM g.starts_at),'gathering_reminder',r.user_id,g.id,g.starts_at::text,g.starts_at
    FROM public.gatherings g CROSS JOIN LATERAL (
      SELECT g.host_id AS user_id UNION SELECT a.user_id FROM public.gathering_attendees a WHERE a.gathering_id=g.id
    ) r WHERE g.status='approved' AND g.starts_at > now() AND g.starts_at <= now()+make_interval(mins=>_lead_minutes)
    ON CONFLICT DO NOTHING;
  RETURN QUERY WITH candidates AS (
    SELECT id FROM public.havato_push_events WHERE claimed_at IS NULL
    ORDER BY created_at LIMIT 10 FOR UPDATE SKIP LOCKED
  ), claimed AS (
    UPDATE public.havato_push_events e SET claimed_at=now() FROM candidates c WHERE e.id=c.id RETURNING e.*
  ) SELECT c.* FROM claimed c WHERE c.expires_at > now() AND private.havato_push_eligible(c);
END $$;
REVOKE ALL ON FUNCTION public.havato_claim_push_events(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.havato_claim_push_events(integer) TO service_role;
-- Revalidate immediately before egress, since a bounded batch may take time.
CREATE FUNCTION public.havato_push_event_eligible(_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT coalesce((SELECT e.claimed_at IS NOT NULL AND e.expires_at > now()
    AND private.havato_push_eligible(e) FROM public.havato_push_events e WHERE e.id=_id),false);
$$;
REVOKE ALL ON FUNCTION public.havato_push_event_eligible(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.havato_push_event_eligible(uuid) TO service_role;
COMMIT;
