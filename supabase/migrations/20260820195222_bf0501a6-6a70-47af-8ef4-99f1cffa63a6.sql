ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trait_spark smallint,
  ADD COLUMN IF NOT EXISTS trait_curiosity smallint,
  ADD COLUMN IF NOT EXISTS trait_warmth smallint,
  ADD COLUMN IF NOT EXISTS trait_depth smallint,
  ADD COLUMN IF NOT EXISTS traits_updated_at timestamptz;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_trait_spark_range CHECK (trait_spark IS NULL OR (trait_spark BETWEEN 0 AND 100)),
  ADD CONSTRAINT profiles_trait_curiosity_range CHECK (trait_curiosity IS NULL OR (trait_curiosity BETWEEN 0 AND 100)),
  ADD CONSTRAINT profiles_trait_warmth_range CHECK (trait_warmth IS NULL OR (trait_warmth BETWEEN 0 AND 100)),
  ADD CONSTRAINT profiles_trait_depth_range CHECK (trait_depth IS NULL OR (trait_depth BETWEEN 0 AND 100));