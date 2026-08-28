-- 1) Realtime for notifications: the bell subscribes to changes but the table was
--    never added to the realtime publication, so events never arrived.
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 2) Capacity trigger reported GATHERING_FULL for an already-joined attendee,
--    because it fired BEFORE INSERT (ahead of the unique constraint) and counted
--    rows without excluding the inserting user.
CREATE OR REPLACE FUNCTION public.enforce_gathering_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _seats int; _status gathering_status; _taken int;
BEGIN
  SELECT seats, status INTO _seats, _status
  FROM public.gatherings WHERE id = NEW.gathering_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'GATHERING_MISSING';
  END IF;

  IF _status IN ('cancelled','rejected') THEN
    RAISE EXCEPTION 'GATHERING_CLOSED';
  END IF;

  -- Already joined: let the unique constraint raise 23505 so the app can show
  -- "you already joined" rather than a misleading "full" message.
  IF EXISTS (
    SELECT 1 FROM public.gathering_attendees
    WHERE gathering_id = NEW.gathering_id AND user_id = NEW.user_id
  ) THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO _taken
  FROM public.gathering_attendees
  WHERE gathering_id = NEW.gathering_id
    AND user_id <> NEW.user_id;

  IF _taken >= _seats THEN
    RAISE EXCEPTION 'GATHERING_FULL: % of % seats taken', _taken, _seats;
  END IF;

  RETURN NEW;
END; $function$;