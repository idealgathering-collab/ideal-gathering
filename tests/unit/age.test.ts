import { describe, expect, it } from "vitest";
import { ageFromDob, ageGapFactor, maxAgeGap } from "@/lib/age";

describe("ageFromDob", () => {
  const now = new Date("2026-08-25T12:00:00Z");

  it("returns full years", () => {
    expect(ageFromDob("2006-08-25", now)).toBe(20);
    expect(ageFromDob("1986-08-25", now)).toBe(40);
  });

  it("has not had the birthday yet this year", () => {
    expect(ageFromDob("2006-08-26", now)).toBe(19);
  });

  it("returns null for missing or garbage input", () => {
    expect(ageFromDob(null, now)).toBeNull();
    expect(ageFromDob("", now)).toBeNull();
    expect(ageFromDob("not-a-date", now)).toBeNull();
  });
});

describe("ageGapFactor", () => {
  it("is 1 inside a six-year band", () => {
    expect(ageGapFactor(0)).toBe(1);
    expect(ageGapFactor(6)).toBe(1);
  });

  it("crushes an 18+ year gap so a 20-year-old is not ranked with a 40-year-old", () => {
    expect(ageGapFactor(20)).toBe(0.06);
    expect(ageGapFactor(18)).toBe(0.06);
  });

  it("steps down between those extremes", () => {
    expect(ageGapFactor(10)).toBe(0.7);
    expect(ageGapFactor(15)).toBe(0.28);
  });
});

describe("maxAgeGap", () => {
  it("uses the largest gap at the table", () => {
    expect(maxAgeGap(20, [22, 40, 21])).toBe(20);
  });

  it("returns null when the viewer or everyone else is unknown", () => {
    expect(maxAgeGap(null, [22, 40])).toBeNull();
    expect(maxAgeGap(20, [null, undefined])).toBeNull();
  });
});
