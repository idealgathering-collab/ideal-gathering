CREATE OR REPLACE FUNCTION public.set_gathering_city()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.business_id IS NOT NULL THEN
    SELECT b.city INTO NEW.city FROM public.businesses b WHERE b.id = NEW.business_id;
  END IF;
  IF NEW.city IS NOT NULL AND btrim(NEW.city) = '' THEN
    NEW.city := NULL;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_gathering_city() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS gatherings_set_city ON public.gatherings;
CREATE TRIGGER gatherings_set_city
BEFORE INSERT OR UPDATE ON public.gatherings
FOR EACH ROW EXECUTE FUNCTION public.set_gathering_city();

UPDATE public.gatherings g
SET city = b.city
FROM public.businesses b
WHERE g.business_id = b.id AND g.city IS DISTINCT FROM b.city;

CREATE INDEX IF NOT EXISTS gatherings_city_starts_at_approved_idx
ON public.gatherings (city, starts_at)
WHERE status = 'approved';