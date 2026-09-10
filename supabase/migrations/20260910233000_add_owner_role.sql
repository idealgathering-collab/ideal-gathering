-- Highest-trust application role for the platform owner.
-- Keep this migration separate because PostgreSQL enum additions must commit
-- before the new value is referenced by functions in a following migration.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'owner';
