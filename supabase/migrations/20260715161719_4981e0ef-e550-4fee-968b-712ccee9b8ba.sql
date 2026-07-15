
-- 1. Free-text venue fields
ALTER TABLE public.gatherings
  ADD COLUMN IF NOT EXISTS venue_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS neighborhood TEXT NOT NULL DEFAULT '';

ALTER TABLE public.gatherings ALTER COLUMN venue_name DROP DEFAULT;
ALTER TABLE public.gatherings ALTER COLUMN neighborhood DROP DEFAULT;

-- 2. Allow gatherings without a linked business/table (no venue portal yet)
ALTER TABLE public.gatherings ALTER COLUMN business_id DROP NOT NULL;
ALTER TABLE public.gatherings ALTER COLUMN table_id DROP NOT NULL;

-- 3. Extend status enum
ALTER TYPE public.gathering_status ADD VALUE IF NOT EXISTS 'rejected';

-- 4. Admin policies (additive; existing host/owner policies untouched)
CREATE POLICY "Admins read all gatherings"
  ON public.gatherings FOR SELECT
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update any gathering"
  ON public.gatherings FOR UPDATE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));
