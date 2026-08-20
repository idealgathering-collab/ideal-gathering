CREATE OR REPLACE FUNCTION public.enforce_gathering_capacity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

  SELECT count(*) INTO _taken
  FROM public.gathering_attendees WHERE gathering_id = NEW.gathering_id;

  IF _taken >= _seats THEN
    RAISE EXCEPTION 'GATHERING_FULL: % of % seats taken', _taken, _seats;
  END IF;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS gathering_attendees_capacity_guard ON public.gathering_attendees;
CREATE TRIGGER gathering_attendees_capacity_guard
BEFORE INSERT ON public.gathering_attendees
FOR EACH ROW EXECUTE FUNCTION public.enforce_gathering_capacity();