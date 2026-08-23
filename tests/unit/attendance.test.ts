import { describe, expect, it } from "vitest";
import { checkinWindow, classifyAttendanceError } from "@/lib/attendance-window";

const START = "2026-08-22T18:00:00.000Z";
const MIN = 60 * 1000;
const HOUR = 60 * MIN;

describe("checkinWindow", () => {
  it("opens 30 minutes before the start", () => {
    const { opensAt } = checkinWindow(START, null);
    expect(opensAt).toBe(new Date(START).getTime() - 30 * MIN);
  });

  it("closes 24 hours after the explicit end", () => {
    const end = "2026-08-22T21:00:00.000Z";
    expect(checkinWindow(START, end).closesAt).toBe(new Date(end).getTime() + 24 * HOUR);
  });

  it("falls back to start + 2h when ends_at is missing", () => {
    expect(checkinWindow(START, null).closesAt).toBe(new Date(START).getTime() + 2 * HOUR + 24 * HOUR);
    expect(checkinWindow(START).closesAt).toBe(checkinWindow(START, null).closesAt);
  });
});

describe("classifyAttendanceError", () => {
  it.each([
    ["CHECKIN_TOO_EARLY", "too_early"],
    ["CHECKIN_WINDOW_CLOSED", "window_closed"],
    ["GATHERING_CLOSED", "closed"],
    ["CHECKIN_TOO_FAR: 1420 m", "too_far"],
    ["NOT_CHECKED_IN", "not_checked_in"],
    ["ATTENDANCE_ALREADY_SET", "already"],
    ["LOCATION_REQUIRED", "location_required"],
    ["new row violates row-level security policy", "forbidden"],
    ["permission denied for table", "forbidden"],
  ] as const)("maps %s", (message, expected) => {
    expect(classifyAttendanceError(message)).toBe(expected);
  });

  it("falls back to unknown", () => {
    expect(classifyAttendanceError("connection reset")).toBe("unknown");
  });

  it("prefers window_closed over the generic closed match", () => {
    expect(classifyAttendanceError("CHECKIN_WINDOW_CLOSED")).toBe("window_closed");
  });
});

describe("checkinWindow boundaries", () => {
  const end = "2026-08-22T21:00:00.000Z";
  const { opensAt, closesAt } = checkinWindow(START, end);

  it("is closed one millisecond before it opens", () => {
    expect(opensAt - 1 < opensAt).toBe(true);
    expect(new Date(START).getTime() - 30 * MIN - 1).toBeLessThan(opensAt);
  });

  it("is open at exactly minus 30 minutes and at the start", () => {
    expect(opensAt).toBeLessThanOrEqual(new Date(START).getTime() - 30 * MIN);
    expect(new Date(START).getTime()).toBeGreaterThan(opensAt);
    expect(new Date(START).getTime()).toBeLessThan(closesAt);
  });

  it("is open at exactly end + 24h and closed after it", () => {
    expect(closesAt).toBe(new Date(end).getTime() + 24 * HOUR);
    expect(closesAt + 1).toBeGreaterThan(closesAt);
  });

  it("keeps opensAt before closesAt for a zero-length gathering", () => {
    const w = checkinWindow(START, START);
    expect(w.opensAt).toBeLessThan(w.closesAt);
  });
});
