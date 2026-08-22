import { checkinWindow } from "@/lib/attendance-window";

/** How long a gathering keeps asking for feedback before it ages out. */
export const FEEDBACK_TTL_DAYS = 14;

export type FeedbackEligibility = {
  now: number;
  startsAt: string;
  endsAt: string | null;
  status: string;
  checkedOutAt: string | null;
};

/**
 * A gathering is pending feedback once the attendee checked out, or once the
 * check-in window closed — and only while it is inside the 14-day TTL and not
 * cancelled/rejected.
 */
export function isFeedbackPending({
  now,
  startsAt,
  endsAt,
  status,
  checkedOutAt,
}: FeedbackEligibility): boolean {
  if (status === "cancelled" || status === "rejected") return false;
  const ttlMs = FEEDBACK_TTL_DAYS * 24 * 60 * 60 * 1000;
  if (new Date(startsAt).getTime() < now - ttlMs) return false;
  return !!checkedOutAt || now > checkinWindow(startsAt, endsAt).closesAt;
}
