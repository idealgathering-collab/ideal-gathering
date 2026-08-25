import { describe, expect, it } from "vitest";
import { EMPTY_PREFERENCES, type GatheringPreferences } from "@/lib/gathering-preferences";
import {
  composeRank,
  inferGatheringTypes,
  interestOverlap,
  preferenceScore,
  textHas,
} from "@/lib/recommend";

const prefs = (partial: Partial<GatheringPreferences>): GatheringPreferences => ({
  ...EMPTY_PREFERENCES,
  ...partial,
});

describe("textHas", () => {
  it("matches whole latin words only", () => {
    expect(textHas("startup night", "start")).toBe(false);
    expect(textHas("startup night", "startup")).toBe(true);
  });

  it("matches turkish and farsi substrings", () => {
    expect(textHas("Kahve ve sohbet", "kahve")).toBe(true);
    expect(textHas("گفتگو با قهوه", "قهوه")).toBe(true);
  });
});

describe("inferGatheringTypes", () => {
  it("tags a book club as books", () => {
    expect(inferGatheringTypes({ subject: "Books that changed my mind", description: null })).toContain(
      "books",
    );
  });

  it("tags a turkish coffee table", () => {
    expect(inferGatheringTypes({ subject: "Kahve ve sohbet", description: "" })).toContain("coffee");
  });

  it("returns empty when nothing matches", () => {
    expect(inferGatheringTypes({ subject: "xyzzy", description: null })).toEqual([]);
  });
});

describe("interestOverlap", () => {
  it("counts known aliases against the subject", () => {
    expect(interestOverlap(["philosophy", "coffee"], "Philosophy over espresso")).toBe(2);
  });

  it("ignores unrelated tags", () => {
    expect(interestOverlap(["climbing"], "Board game night")).toBe(0);
  });
});

describe("preferenceScore", () => {
  const now = new Date("2026-08-25T12:00:00Z");

  it("returns no signal when the viewer has no taste data", () => {
    expect(
      preferenceScore({ subject: "Coffee chat", seats: 4, starts_at: "2026-08-26T18:00:00Z" }, null, [], now),
    ).toMatchObject({ score: null, hasSignal: false });
  });

  it("scores a type + size match higher than a mismatch", () => {
    const taste = prefs({ gathering_types: ["coffee"], preferred_group_size: 4 });
    const hit = preferenceScore(
      { subject: "Morning coffee & slow talk", seats: 4, starts_at: "2026-08-30T09:00:00Z" },
      taste,
      [],
      now,
    );
    const miss = preferenceScore(
      { subject: "Sunrise hike up the ridge", seats: 12, starts_at: "2026-08-30T06:00:00Z" },
      taste,
      [],
      now,
    );
    expect(hit.hasSignal).toBe(true);
    expect(hit.score ?? 0).toBeGreaterThan(miss.score ?? 0);
    expect(hit.matchedTypes).toContain("coffee");
  });

  it("boosts gatherings that hit profile interests", () => {
    const withInterest = preferenceScore(
      { subject: "Philosophy & flat whites", seats: 4 },
      null,
      ["philosophy"],
      now,
    );
    const without = preferenceScore({ subject: "Philosophy & flat whites", seats: 4 }, null, ["climbing"], now);
    expect(withInterest.interestHits).toBe(1);
    expect(withInterest.score ?? 0).toBeGreaterThan(without.score ?? 0);
  });
});

describe("composeRank", () => {
  it("returns null when both signals are missing", () => {
    expect(composeRank(null, null)).toBeNull();
  });

  it("passes through a single signal", () => {
    expect(composeRank(80, null)).toBe(80);
    expect(composeRank(null, 70)).toBe(70);
  });

  it("weights chemistry above taste when both exist", () => {
    expect(composeRank(100, 0)).toBe(62);
    expect(composeRank(0, 100)).toBe(38);
  });
});
