ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS nationality text;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_dob_sane
  CHECK (date_of_birth IS NULL OR date_of_birth >= DATE '1900-01-01');

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_nationality_len
  CHECK (nationality IS NULL OR char_length(nationality) = 2);

CREATE OR REPLACE FUNCTION public.enforce_profile_min_age()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.date_of_birth IS NOT NULL
     AND NEW.date_of_birth > (CURRENT_DATE - INTERVAL '18 years')::date THEN
    RAISE EXCEPTION 'MIN_AGE_18';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_min_age ON public.profiles;
CREATE TRIGGER profiles_min_age
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_min_age();