ALTER TABLE public.saved_locations
  ADD COLUMN IF NOT EXISTS street_number text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS street_number text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_extra text NOT NULL DEFAULT '';