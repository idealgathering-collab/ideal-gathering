BEGIN;

-- Extend the existing checklist; personal ticks keep their original meaning.
CREATE TABLE private.gathering_responsibilities (
  item_id uuid PRIMARY KEY REFERENCES public.gathering_checklist_items(id) ON DELETE CASCADE,
  assignee text,
  done boolean NOT NULL DEFAULT false,
  guest_visible boolean NOT NULL DEFAULT false,
  CHECK (assignee IS NOT NULL OR NOT done)
);
CREATE TABLE private.gathering_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gathering_id uuid NOT NULL REFERENCES public.gatherings(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 2000),
  guest_visible boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX gathering_notes_event ON private.gathering_notes(gathering_id,created_at);
CREATE TABLE private.gathering_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gathering_id uuid NOT NULL REFERENCES public.gatherings(id) ON DELETE CASCADE,
  label text NOT NULL CHECK (char_length(btrim(label)) BETWEEN 1 AND 140),
  amount bigint NOT NULL CHECK (amount BETWEEN 1 AND 100000000000),
  currency text NOT NULL CHECK (currency IN ('IRR','IRT','USD','EUR')),
  payer text NOT NULL,
  shares jsonb NOT NULL CHECK (jsonb_typeof(shares) = 'array'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX gathering_expenses_event ON private.gathering_expenses(gathering_id,created_at);
ALTER TABLE private.gathering_responsibilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.gathering_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.gathering_expenses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.gathering_responsibilities, private.gathering_notes, private.gathering_expenses
  FROM PUBLIC, anon, authenticated, service_role;

-- Internal roster: no email/DOB; temporary guests never become members.
CREATE FUNCTION private.coordination_participants(_id uuid)
RETURNS TABLE(key text, label text, guest boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT 'member:'||a.user_id, coalesce(nullif(p.display_name,''),'Participant'),false
  FROM public.gathering_attendees a JOIN public.profiles p ON p.id=a.user_id
  JOIN public.gatherings g ON g.id=a.gathering_id
  WHERE a.gathering_id=_id AND private.private_gathering_eligible(a.user_id)
    AND NOT private.is_blocked_pair(a.user_id,g.host_id)
    AND (a.user_id=g.host_id OR EXISTS (SELECT 1 FROM public.gathering_invitations i
      WHERE i.gathering_id=_id AND i.recipient_id=a.user_id AND i.response='going' AND i.revoked_at IS NULL))
  UNION ALL
  SELECT 'guest:'||i.id,coalesce(i.guest_name,i.label),true FROM private.gathering_guest_invitations i
  WHERE i.gathering_id=_id AND i.response='going' AND i.adult_attested_at IS NOT NULL
    AND i.revoked_at IS NULL AND i.expires_at > clock_timestamp()
$$;
REVOKE ALL ON FUNCTION private.coordination_participants(uuid) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION private.coordination_label(_id uuid,_key text,_host boolean) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT CASE WHEN _key LIKE 'guest:%' AND NOT _host THEN 'Guest'
    WHEN _key LIKE 'member:%' AND NOT _host AND private.is_blocked_pair(auth.uid(),substring(_key from 8)::uuid) THEN 'Participant'
    ELSE coalesce((SELECT label FROM private.coordination_participants(_id) WHERE key=_key),'Participant') END
$$;
REVOKE ALL ON FUNCTION private.coordination_label(uuid,text,boolean) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION private.gathering_coordination(_id uuid,_action text DEFAULT 'list',_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE g public.gatherings; is_host boolean; actor text; item uuid; target text; task_record private.gathering_responsibilities;
  note private.gathering_notes; amount_value bigint; currency_value text; payer_value text; keys text[]; n integer; splits jsonb; result jsonb;
BEGIN
  -- Same event lock/order as RSVP/revocation/capacity; authorize again after waiting.
  SELECT * INTO g FROM public.gatherings WHERE id=_id FOR UPDATE;
  is_host := g.host_id=auth.uid(); actor := 'member:'||auth.uid();
  IF auth.uid() IS NULL OR g.id IS NULL OR g.visibility<>'private' OR g.status<>'approved'
    OR NOT private.private_gathering_eligible(g.host_id) OR NOT private.private_gathering_eligible(auth.uid())
    OR NOT EXISTS (SELECT 1 FROM private.coordination_participants(_id) p WHERE p.key=actor)
  THEN RAISE EXCEPTION 'COORDINATION_UNAVAILABLE'; END IF;
  IF _action IS NULL OR _data IS NULL OR jsonb_typeof(_data)<>'object' OR pg_column_size(_data)>16384 THEN RAISE EXCEPTION 'Invalid coordination'; END IF;
  IF _action='task' THEN
    item := (_data->>'item')::uuid;
    IF NOT EXISTS (SELECT 1 FROM public.gathering_checklist_items WHERE id=item AND gathering_id=_id)
      THEN RAISE EXCEPTION 'COORDINATION_UNAVAILABLE'; END IF;
    INSERT INTO private.gathering_responsibilities(item_id) VALUES(item) ON CONFLICT DO NOTHING;
    SELECT * INTO task_record FROM private.gathering_responsibilities WHERE item_id=item;
    IF _data->>'operation'='assign' AND is_host THEN
      target := nullif(_data->>'assignee','');
      IF target IS NOT NULL AND NOT EXISTS (SELECT 1 FROM private.coordination_participants(_id) WHERE key=target)
        THEN RAISE EXCEPTION 'Invalid participant'; END IF;
      UPDATE private.gathering_responsibilities SET assignee=target,done=false WHERE item_id=item;
    ELSIF _data->>'operation'='volunteer' THEN
      IF task_record.assignee IS NOT NULL AND task_record.assignee<>actor AND EXISTS (SELECT 1 FROM private.coordination_participants(_id) WHERE key=task_record.assignee)
        THEN RAISE EXCEPTION 'TASK_TAKEN'; END IF;
      UPDATE private.gathering_responsibilities SET assignee=actor,done=false WHERE item_id=item;
    ELSIF _data->>'operation'='release' AND (is_host OR task_record.assignee=actor) THEN
      UPDATE private.gathering_responsibilities SET assignee=NULL,done=false WHERE item_id=item;
    ELSIF _data->>'operation'='done' AND (is_host OR task_record.assignee=actor) AND task_record.assignee IS NOT NULL
      AND EXISTS (SELECT 1 FROM private.coordination_participants(_id) WHERE key=task_record.assignee)
      AND jsonb_typeof(_data->'done')='boolean' THEN
      UPDATE private.gathering_responsibilities SET done=(_data->>'done')::boolean WHERE item_id=item;
    ELSIF _data->>'operation'='share' AND is_host AND jsonb_typeof(_data->'guest_visible')='boolean' THEN
      UPDATE private.gathering_responsibilities SET guest_visible=(_data->>'guest_visible')::boolean WHERE item_id=item;
    ELSE RAISE EXCEPTION 'COORDINATION_UNAVAILABLE'; END IF;
  ELSIF _action='save_note' THEN
    IF char_length(btrim(coalesce(_data->>'body',''))) NOT BETWEEN 1 AND 2000 THEN RAISE EXCEPTION 'Invalid note'; END IF;
    IF nullif(_data->>'id','') IS NULL THEN
      IF (SELECT count(*) FROM private.gathering_notes WHERE gathering_id=_id)>=100 THEN RAISE EXCEPTION 'COORDINATION_LIMIT'; END IF;
      INSERT INTO private.gathering_notes(gathering_id,author_id,body,guest_visible)
        VALUES(_id,auth.uid(),btrim(_data->>'body'),is_host AND coalesce((_data->>'guest_visible')::boolean,false));
    ELSE
      SELECT * INTO note FROM private.gathering_notes WHERE id=(_data->>'id')::uuid AND gathering_id=_id;
      IF note.id IS NULL OR NOT (is_host OR note.author_id=auth.uid()) THEN RAISE EXCEPTION 'COORDINATION_UNAVAILABLE'; END IF;
      IF note.version IS DISTINCT FROM (_data->>'version')::integer THEN RAISE EXCEPTION 'COORDINATION_CONFLICT'; END IF;
      UPDATE private.gathering_notes SET body=btrim(_data->>'body'),version=version+1,
        guest_visible=CASE WHEN is_host THEN coalesce((_data->>'guest_visible')::boolean,false) ELSE guest_visible END WHERE id=note.id;
    END IF;
  ELSIF _action='delete_note' THEN
    SELECT * INTO note FROM private.gathering_notes WHERE id=(_data->>'id')::uuid AND gathering_id=_id;
    IF note.id IS NULL OR NOT (is_host OR note.author_id=auth.uid()) THEN RAISE EXCEPTION 'COORDINATION_UNAVAILABLE'; END IF;
    IF note.version IS DISTINCT FROM (_data->>'version')::integer THEN RAISE EXCEPTION 'COORDINATION_CONFLICT'; END IF;
    DELETE FROM private.gathering_notes WHERE id=note.id;
  ELSIF _action='expense' AND is_host THEN
    amount_value:=(_data->>'amount')::bigint; currency_value:=_data->>'currency'; payer_value:=_data->>'payer';
    IF char_length(btrim(coalesce(_data->>'label',''))) NOT BETWEEN 1 AND 140 OR amount_value IS NULL
      OR amount_value NOT BETWEEN 1 AND 100000000000 OR currency_value IS NULL OR currency_value NOT IN ('IRR','IRT','USD','EUR')
      OR jsonb_typeof(_data->'participants') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid expense'; END IF;
    SELECT array_agg(value ORDER BY value) INTO keys FROM jsonb_array_elements_text(_data->'participants');
    n:=coalesce(array_length(keys,1),0);
    IF n NOT BETWEEN 1 AND 30 OR n<>(SELECT count(DISTINCT k) FROM unnest(keys) k)
      OR payer_value IS NULL OR NOT EXISTS (SELECT 1 FROM private.coordination_participants(_id) WHERE key=payer_value)
      OR EXISTS (SELECT 1 FROM unnest(keys) k WHERE NOT EXISTS (SELECT 1 FROM private.coordination_participants(_id) WHERE key=k))
      THEN RAISE EXCEPTION 'Invalid participant'; END IF;
    IF EXISTS (SELECT 1 FROM private.gathering_expenses WHERE gathering_id=_id AND currency<>currency_value) THEN RAISE EXCEPTION 'CURRENCY_MISMATCH'; END IF;
    IF (SELECT count(*) FROM private.gathering_expenses WHERE gathering_id=_id)>=100 THEN RAISE EXCEPTION 'COORDINATION_LIMIT'; END IF;
    SELECT jsonb_agg(jsonb_build_object('key',k,'amount',amount_value/n+CASE WHEN ord<=amount_value%n THEN 1 ELSE 0 END) ORDER BY ord)
      INTO splits FROM unnest(keys) WITH ORDINALITY AS x(k,ord);
    INSERT INTO private.gathering_expenses(gathering_id,label,amount,currency,payer,shares)
      VALUES(_id,btrim(_data->>'label'),amount_value,currency_value,payer_value,splits);
  ELSIF _action='delete_expense' AND is_host THEN
    DELETE FROM private.gathering_expenses WHERE id=(_data->>'id')::uuid AND gathering_id=_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'COORDINATION_UNAVAILABLE'; END IF;
  ELSIF _action<>'list' THEN RAISE EXCEPTION 'COORDINATION_UNAVAILABLE'; END IF;
  SELECT jsonb_build_object('actor',actor,'is_host',is_host,
    'participants',coalesce((SELECT jsonb_agg(jsonb_build_object('key',key,'label',private.coordination_label(_id,key,is_host),'guest',guest) ORDER BY key) FROM private.coordination_participants(_id)),'[]'),
    'items',coalesce((SELECT jsonb_agg(jsonb_build_object('id',i.id,'label',i.label,'assignee',r.assignee,
      'assignee_label',CASE WHEN r.assignee IS NOT NULL THEN private.coordination_label(_id,r.assignee,is_host) END,
      'active',EXISTS(SELECT 1 FROM private.coordination_participants(_id) WHERE key=r.assignee),
      'done',coalesce(r.done,false),'guest_visible',coalesce(r.guest_visible,false)) ORDER BY i.sort_order,i.created_at)
      FROM public.gathering_checklist_items i LEFT JOIN private.gathering_responsibilities r ON r.item_id=i.id WHERE i.gathering_id=_id),'[]'),
    'notes',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'body',body,'version',version,'can_edit',is_host OR author_id=auth.uid(),'guest_visible',guest_visible) ORDER BY created_at,id) FROM private.gathering_notes WHERE gathering_id=_id),'[]'),
    'expenses',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'label',label,'amount',amount,'currency',currency,'payer',payer,
      'payer_label',private.coordination_label(_id,payer,is_host),'shares',(SELECT jsonb_agg(s||jsonb_build_object('label',private.coordination_label(_id,s->>'key',is_host))) FROM jsonb_array_elements(shares) s)) ORDER BY created_at,id) FROM private.gathering_expenses WHERE gathering_id=_id),'[]')) INTO result;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION private.gathering_coordination(uuid,text,jsonb) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION private.gathering_coordination(uuid,text,jsonb) TO authenticated;
CREATE FUNCTION public.gathering_coordination(_id uuid,_action text DEFAULT 'list',_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$ SELECT private.gathering_coordination(_id,_action,_data) $$;
REVOKE ALL ON FUNCTION public.gathering_coordination(uuid,text,jsonb) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.gathering_coordination(uuid,text,jsonb) TO authenticated;

-- Guest capability projection: no participant keys, assignee identity or expenses.
CREATE FUNCTION private.guest_coordination(_hash text,_adult boolean,_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE i private.gathering_guest_invitations; g public.gatherings; event_id uuid; item uuid; actor text; task_record private.gathering_responsibilities;
BEGIN
  IF _adult IS DISTINCT FROM true OR _hash IS NULL OR _hash !~ '^[0-9a-f]{64}$' THEN RETURN NULL; END IF;
  SELECT gathering_id INTO event_id FROM private.gathering_guest_invitations WHERE token_hash=_hash;
  SELECT * INTO g FROM public.gatherings WHERE id=event_id FOR UPDATE;
  SELECT * INTO i FROM private.gathering_guest_invitations WHERE token_hash=_hash;
  IF i.id IS NULL OR i.response<>'going' OR i.adult_attested_at IS NULL OR i.revoked_at IS NOT NULL
    OR i.expires_at<=clock_timestamp() OR g.starts_at<=clock_timestamp() OR g.visibility<>'private'
    OR g.status<>'approved' OR NOT private.private_gathering_eligible(g.host_id) THEN RETURN NULL; END IF;
  actor:='guest:'||i.id;
  IF _data IS NULL OR jsonb_typeof(_data)<>'object' OR pg_column_size(_data)>2048 THEN RAISE EXCEPTION 'Invalid coordination'; END IF;
  IF _data->>'operation' IS NOT NULL THEN
    item:=(_data->>'item')::uuid;
    SELECT r0.* INTO task_record FROM private.gathering_responsibilities r0 JOIN public.gathering_checklist_items c ON c.id=r0.item_id
      WHERE r0.item_id=item AND c.gathering_id=g.id AND r0.guest_visible;
    IF task_record.item_id IS NULL THEN RAISE EXCEPTION 'COORDINATION_UNAVAILABLE'; END IF;
    IF _data->>'operation'='volunteer' THEN
      IF task_record.assignee IS NOT NULL AND task_record.assignee<>actor AND EXISTS (SELECT 1 FROM private.coordination_participants(g.id) WHERE key=task_record.assignee) THEN RAISE EXCEPTION 'TASK_TAKEN'; END IF;
      UPDATE private.gathering_responsibilities SET assignee=actor,done=false WHERE item_id=item;
    ELSIF _data->>'operation'='release' AND task_record.assignee=actor THEN
      UPDATE private.gathering_responsibilities SET assignee=NULL,done=false WHERE item_id=item;
    ELSIF _data->>'operation'='done' AND task_record.assignee=actor AND jsonb_typeof(_data->'done')='boolean' THEN
      UPDATE private.gathering_responsibilities SET done=(_data->>'done')::boolean WHERE item_id=item;
    ELSE RAISE EXCEPTION 'COORDINATION_UNAVAILABLE'; END IF;
  END IF;
  RETURN jsonb_build_object('items',coalesce((SELECT jsonb_agg(jsonb_build_object('id',c.id,'label',c.label,'mine',r.assignee=actor,
    'available',r.assignee IS NULL OR NOT EXISTS (SELECT 1 FROM private.coordination_participants(g.id) WHERE key=r.assignee),'done',r.done) ORDER BY c.sort_order,c.created_at)
    FROM private.gathering_responsibilities r JOIN public.gathering_checklist_items c ON c.id=r.item_id WHERE c.gathering_id=g.id AND r.guest_visible),'[]'),
    'notes',coalesce((SELECT jsonb_agg(jsonb_build_object('body',body) ORDER BY created_at,id) FROM private.gathering_notes WHERE gathering_id=g.id AND guest_visible),'[]'));
END $$;
REVOKE ALL ON FUNCTION private.guest_coordination(text,boolean,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION private.guest_coordination(text,boolean,jsonb) TO service_role;
CREATE FUNCTION public.guest_coordination(_hash text,_adult boolean,_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$ SELECT private.guest_coordination(_hash,_adult,_data) $$;
REVOKE ALL ON FUNCTION public.guest_coordination(text,boolean,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.guest_coordination(text,boolean,jsonb) TO service_role;

NOTIFY pgrst,'reload schema';
COMMIT;
