import { describe, expect, it } from "vitest";
import { canUsePrivateGatherings, privateGatheringSchema, privateGatheringError, rsvpResponse } from "@/lib/private-gatherings";

describe("private gathering validation", () => {
  const valid = { subject: " Birthday ", description: "Tea", venue_name: " Home ", address: "", starts_at: "2099-01-01T12:00:00Z", seats: 4 };
  it("trims user text and permits an optional address", () => {
    expect(privateGatheringSchema.parse(valid)).toMatchObject({ subject: "Birthday", venue_name: "Home", address: "" });
  });
  it.each([1, 31, 3.5, NaN])("rejects invalid capacity %s", seats => {
    expect(privateGatheringSchema.safeParse({ ...valid, seats }).success).toBe(false);
  });
  it.each(["", "invalid", "2000-01-01T12:00:00Z"]) ("rejects invalid or past dates %s", starts_at => {
    expect(privateGatheringSchema.safeParse({ ...valid, starts_at }).success).toBe(false);
  });
  it("rejects an empty title/place and excessive address", () => {
    for (const patch of [{ subject: "  " }, { venue_name: " " }, { address: "x".repeat(241) }]) expect(privateGatheringSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
  it("requires a valid adult birthday, including the birthday boundary", () => {
    const now = new Date("2026-10-10T12:00:00Z");
    expect(canUsePrivateGatherings("2008-10-10", now)).toBe(true);
    expect(canUsePrivateGatherings("2008-10-11", now)).toBe(false);
    for (const dob of [null, undefined, "bad", "2099-01-01"]) expect(canUsePrivateGatherings(dob, now)).toBe(false);
  });
  it("accepts only supported RSVP states", () => {
    expect(rsvpResponse.safeParse("invited").success).toBe(false);
    expect(rsvpResponse.options).toEqual(["going", "maybe", "declined"]);
  });
  it("does not surface raw database errors", () => {
    expect(privateGatheringError({ message: "GATHERING_FULL: 2 of 2" })).toBe("private.full");
    expect(privateGatheringError({ message: "private email details" })).toBe("private.failed");
  });
});
