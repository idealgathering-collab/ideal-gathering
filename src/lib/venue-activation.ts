export const VENUE_MIN_SEATS = 2;
export const VENUE_MAX_SEATS = 5;

/** Bound the venue activation payload even when native form validation is bypassed. */
export function clampVenueSeats(seats: number): number {
  if (!Number.isFinite(seats)) return 4;
  return Math.max(VENUE_MIN_SEATS, Math.min(VENUE_MAX_SEATS, Math.trunc(seats)));
}
