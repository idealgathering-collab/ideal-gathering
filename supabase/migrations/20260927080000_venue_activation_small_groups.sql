-- Enforce the venue activation MVP bound for direct API writes as well as the UI.
-- NOT VALID preserves historical rows without silently changing existing bookings.
-- New inserts and updates are checked immediately. Audit historical exceptions
-- before validating this constraint during a separately authorized rollout.
ALTER TABLE public.gatherings
  ADD CONSTRAINT gatherings_venue_activation_seats_check
  CHECK (origin <> 'venue_activated' OR seats BETWEEN 2 AND 5) NOT VALID;
