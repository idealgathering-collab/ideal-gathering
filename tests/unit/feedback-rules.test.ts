import { describe, expect, it } from "vitest";
import { FEEDBACK_TTL_DAYS, isFeedbackPending } from "@/lib/feedback-rules";

const START = "2026-08-20T18:00:00.000Z";
const END = "2026-08-20T21:00:00.000Z";
const startMs = new Date(START).getTime();
const endMs = new Date(END).getTime();
const HOUR = 60 * 60 * 1000;

const base = {
  startsAt: START,
  endsAt: END,
  status: "approved",
  checkedOutAt: null as string | null,
};

describe("isFeedbackPending", () => {
  it("is pending as soon as the attendee checks out", () => {
    expect(
      isFeedbackPending({ ...base, now: endMs - HOUR, checkedOutAt: "2026-08-20T20:00:00.000Z" }),
    ).toBe(true);
  });

  it("is not pending while the check-in window is still open and no checkout happened", () => {
    expect(isFeedbackPending({ ...base, now: endMs + HOUR })).toBe(false);
  });

  it("becomes pending once the window closes", () => {
    expect(isFeedbackPending({ ...base, now: endMs + 25 * HOUR })).toBe(true);
  });

  it("is never pending for cancelled or rejected gatherings", () => {
    expect(isFeedbackPending({ ...base, now: endMs + 25 * HOUR, status: "cancelled" })).toBe(false);
    expect(isFeedbackPending({ ...base, now: endMs + 25 * HOUR, status: "rejected" })).toBe(false);
  });

  it("ages out after the TTL", () => {
    const now = startMs + (FEEDBACK_TTL_DAYS + 1) * 24 * HOUR;
    expect(isFeedbackPending({ ...base, now, checkedOutAt: END })).toBe(false);
  });

  it("still counts a gathering just inside the TTL", () => {
    const now = startMs + (FEEDBACK_TTL_DAYS - 1) * 24 * HOUR;
    expect(isFeedbackPending({ ...base, now, checkedOutAt: END })).toBe(true);
  });

  it("uses the start + 2h fallback when ends_at is null", () => {
    expect(isFeedbackPending({ ...base, endsAt: null, now: startMs + 25 * HOUR })).toBe(false);
    expect(isFeedbackPending({ ...base, endsAt: null, now: startMs + 27 * HOUR })).toBe(true);
  });
});
