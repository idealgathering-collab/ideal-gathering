import { describe, expect, it } from "vitest";
import {
  createGatheringSchema,
  isFutureStart,
  parseLocationKey,
} from "@/lib/create-gathering-rules";

const base = {
  location: "saved:abc",
  subject: "Coffee and books",
  description: "",
  starts_at: "2026-09-01T18:00",
  seats: 4,
};

describe("createGatheringSchema", () => {
  it("accepts a valid form", () => {
    const parsed = createGatheringSchema.safeParse(base);
    expect(parsed.success).toBe(true);
  });

  it("requires a location", () => {
    expect(createGatheringSchema.safeParse({ ...base, location: "" }).success).toBe(false);
  });

  it("requires a start time", () => {
    expect(createGatheringSchema.safeParse({ ...base, starts_at: "" }).success).toBe(false);
  });

  it("enforces subject length bounds", () => {
    expect(createGatheringSchema.safeParse({ ...base, subject: "ab" }).success).toBe(false);
    expect(createGatheringSchema.safeParse({ ...base, subject: "abc" }).success).toBe(true);
    expect(createGatheringSchema.safeParse({ ...base, subject: "x".repeat(121) }).success).toBe(false);
  });

  it("trims the subject before measuring it", () => {
    const parsed = createGatheringSchema.safeParse({ ...base, subject: "  Chess night  " });
    expect(parsed.success && parsed.data.subject).toBe("Chess night");
  });

  it("caps the description at 800 characters", () => {
    expect(createGatheringSchema.safeParse({ ...base, description: "y".repeat(800) }).success).toBe(true);
    expect(createGatheringSchema.safeParse({ ...base, description: "y".repeat(801) }).success).toBe(false);
  });

  it("enforces seats between 2 and 30 and rejects fractions", () => {
    expect(createGatheringSchema.safeParse({ ...base, seats: 1 }).success).toBe(false);
    expect(createGatheringSchema.safeParse({ ...base, seats: 2 }).success).toBe(true);
    expect(createGatheringSchema.safeParse({ ...base, seats: 30 }).success).toBe(true);
    expect(createGatheringSchema.safeParse({ ...base, seats: 31 }).success).toBe(false);
    expect(createGatheringSchema.safeParse({ ...base, seats: 4.5 }).success).toBe(false);
  });

  it("coerces a numeric string for seats", () => {
    const parsed = createGatheringSchema.safeParse({ ...base, seats: "6" });
    expect(parsed.success && parsed.data.seats).toBe(6);
  });
});

describe("parseLocationKey", () => {
  it("parses a venue table key", () => {
    expect(parseLocationKey("venue:biz-1:table-9")).toEqual({
      kind: "venue",
      businessId: "biz-1",
      tableId: "table-9",
    });
  });

  it("parses a saved location key", () => {
    expect(parseLocationKey("saved:loc-1")).toEqual({ kind: "saved", savedLocationId: "loc-1" });
  });

  it("rejects incomplete or unknown keys", () => {
    expect(parseLocationKey("venue:biz-only")).toBeNull();
    expect(parseLocationKey("saved:")).toBeNull();
    expect(parseLocationKey("__add")).toBeNull();
    expect(parseLocationKey("")).toBeNull();
  });
});

describe("isFutureStart", () => {
  const now = new Date("2026-09-01T12:00:00.000Z");

  it("accepts a future time", () => {
    expect(isFutureStart("2026-09-01T13:00:00.000Z", now)).toBe(true);
  });

  it("rejects a past time", () => {
    expect(isFutureStart("2026-09-01T11:59:00.000Z", now)).toBe(false);
  });

  it("rejects an unparseable time", () => {
    expect(isFutureStart("not-a-date", now)).toBe(false);
  });
});
