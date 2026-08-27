ALTER TABLE public.gatherings ADD COLUMN IF NOT EXISTS gathering_type text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS persona_color text,
  ADD COLUMN IF NOT EXISTS energy_level text,
  ADD COLUMN IF NOT EXISTS group_size text,
  ADD COLUMN IF NOT EXISTS talk_style text,
  ADD COLUMN IF NOT EXISTS new_people_pref text,
  ADD COLUMN IF NOT EXISTS intentions text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();