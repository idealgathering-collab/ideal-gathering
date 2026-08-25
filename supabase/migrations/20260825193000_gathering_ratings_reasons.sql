-- Structured "what didn't work" tags so matching can learn from feedback
-- without reading free-text comments.
ALTER TABLE public.gathering_ratings
  ADD COLUMN IF NOT EXISTS reasons text[] NOT NULL DEFAULT '{}';
