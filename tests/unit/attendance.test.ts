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
