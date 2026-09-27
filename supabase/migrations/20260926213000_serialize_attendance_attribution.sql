BEGIN;
-- Serialize attendance writes with gathering edits so validation observes the
-- committed venue/time. The existing attendance guard still validates the action.
CREATE FUNCTION public.lock_attendance_gathering()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM 1 FROM public.gatherings WHERE id = NEW.gathering_id FOR UPDATE;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.lock_attendance_gathering() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER a_attendance_gathering_lock BEFORE INSERT OR UPDATE ON public.gathering_attendees
  FOR EACH ROW EXECUTE FUNCTION public.lock_attendance_gathering();
COMMIT;
