CREATE UNIQUE INDEX venue_tables_business_label_ci_uidx
  ON public.venue_tables (business_id, lower(label));

CREATE OR REPLACE FUNCTION public.prevent_locked_table_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _table_id uuid := COALESCE(OLD.id, NEW.id);
  _blockers text;
  _min_seats int;
BEGIN
  SELECT string_agg(g.subject || ' (' || to_char(g.starts_at, 'YYYY-MM-DD HH24:MI') || ' UTC)', ', '),
         max(g.seats)
    INTO _blockers, _min_seats
  FROM public.gatherings g
  WHERE g.table_id = _table_id
    AND g.status <> 'cancelled'
    AND g.status <> 'rejected'
    AND COALESCE(g.ends_at, g.starts_at + interval '2 hours') > now();

  IF _blockers IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'TABLE_LOCKED: %', _blockers;
  END IF;

  IF NEW.capacity < _min_seats THEN
    RAISE EXCEPTION 'TABLE_CAPACITY_LOCKED: % | %', _min_seats, _blockers;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS venue_tables_locked_guard ON public.venue_tables;
CREATE TRIGGER venue_tables_locked_guard
  BEFORE UPDATE OR DELETE ON public.venue_tables
  FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_table_change();