import { describe, expect, it } from "vitest";
import { ageFromDob, ageGapFactor, maxAgeGap, tableAgeSpan } from "@/lib/age";

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

  it("crushes anything over 10 years, even with identical interests", () => {
    expect(ageGapFactor(11, 100)).toBe(0.06);
    expect(ageGapFactor(20, 100)).toBe(0.06);
  });

  it("lets shared interests keep a 10-year gap almost whole", () => {
    expect(ageGapFactor(10, 80)).toBe(0.95);
    expect(ageGapFactor(10, null)).toBe(0.72);
  });
});

describe("tableAgeSpan", () => {
  it("uses oldest minus youngest at the table", () => {
    expect(tableAgeSpan([22, 40, 21])).toBe(19);
  });

  it("returns null when fewer than two ages are known", () => {
    expect(tableAgeSpan([22, null])).toBeNull();
    expect(tableAgeSpan([])).toBeNull();
  });
});

describe("maxAgeGap", () => {
  it("uses the largest gap at the table, including the viewer", () => {
    expect(maxAgeGap(20, [22, 40, 21])).toBe(20);
  });

  it("returns null when the viewer or everyone else is unknown", () => {
    expect(maxAgeGap(null, [22])).toBeNull();
    expect(maxAgeGap(20, [null, undefined])).toBeNull();
  });
});
