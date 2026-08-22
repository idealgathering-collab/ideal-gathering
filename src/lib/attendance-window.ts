/** Minutes before starts_at when marking becomes possible (mirrors the DB trigger). */
export const CHECKIN_OPENS_MINUTES_BEFORE = 30;
/** Hours after the gathering ends when marking closes (mirrors the DB trigger). */
export const CHECKIN_CLOSES_HOURS_AFTER = 24;

export function checkinWindow(startsAt: string, endsAt?: string | null) {
  const start = new Date(startsAt).getTime();
  const end = endsAt ? new Date(endsAt).getTime() : start + 2 * 60 * 60 * 1000;
  return {
    opensAt: start - CHECKIN_OPENS_MINUTES_BEFORE * 60 * 1000,
    closesAt: end + CHECKIN_CLOSES_HOURS_AFTER * 60 * 60 * 1000,
  };
}

export type AttendanceErrorReason =
  | "too_early"
  | "window_closed"
  | "closed"
  | "too_far"
  | "not_checked_in"
  | "already"
  | "location_required"
  | "forbidden"
  | "unknown";

/** Maps a Postgres error message from the attendance guard trigger to a stable reason code. */
export function classifyAttendanceError(message: string): AttendanceErrorReason {
  if (message.includes("CHECKIN_TOO_EARLY")) return "too_early";
  if (message.includes("CHECKIN_WINDOW_CLOSED")) return "window_closed";
  if (message.includes("GATHERING_CLOSED")) return "closed";
  if (message.includes("CHECKIN_TOO_FAR")) return "too_far";
  if (message.includes("NOT_CHECKED_IN")) return "not_checked_in";
  if (message.includes("ATTENDANCE_ALREADY_SET")) return "already";
  if (message.includes("LOCATION_REQUIRED")) return "location_required";
  if (/forbidden|permission|row-level/i.test(message)) return "forbidden";
  return "unknown";
}
