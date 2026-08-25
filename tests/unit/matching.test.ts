import { describe, expect, it } from "vitest";
import { averageTraits, fitScore, traitsFromRow, type TraitScores } from "@/lib/matching";
import { scoreTables } from "@/lib/table-fit";

const T = (spark: number, curiosity: number, warmth: number, depth: number): TraitScores => ({
  spark,
  curiosity,
  warmth,
  depth,
});

describe("traitsFromRow", () => {
  it("returns null for a missing row", () => {
    expect(traitsFromRow(null)).toBeNull();
    expect(traitsFromRow(undefined)).toBeNull();
  });

  it("returns null when any trait is missing", () => {
    expect(
      traitsFromRow({ trait_spark: 70, trait_curiosity: 60, trait_warmth: null, trait_depth: 50 }),
    ).toBeNull();
  });

  it("returns scores for a complete row", () => {
    expect(
      traitsFromRow({ trait_spark: 70, trait_curiosity: 60, trait_warmth: 80, trait_depth: 50 }),
    ).toEqual(T(70, 60, 80, 50));
  });
});

describe("averageTraits", () => {
  it("returns null for an empty list", () => {
    expect(averageTraits([])).toBeNull();
  });

  it("averages each trait", () => {
    expect(averageTraits([T(60, 60, 60, 60), T(80, 80, 80, 80)])).toEqual(T(70, 70, 70, 70));
  });
});

describe("fitScore", () => {
  it("scores identical people at 100", () => {
    expect(fitScore(T(70, 60, 80, 50), T(70, 60, 80, 50))).toBe(100);
  });

  it("is symmetric", () => {
    const a = T(90, 50, 60, 42);
    const b = T(45, 88, 70, 60);
    expect(fitScore(a, b)).toBe(fitScore(b, a));
  });

  it("scores opposites at the floor", () => {
    expect(fitScore(T(0, 0, 0, 0), T(100, 100, 100, 100))).toBe(0);
  });

  it("stays within 0-100", () => {
    const score = fitScore(T(42, 100, 42, 100), T(100, 42, 100, 42));
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe("scoreTables", () => {
  const me = "viewer";
  const myTraits = T(70, 70, 70, 70);

  it("returns a null fit when nobody else has traits", () => {
    const fits = scoreTables({
      viewerId: me,
      myTraits,
      gatheringIds: ["g1"],
      membersByGathering: new Map([["g1", new Set([me, "other"])]]),
      traitsByUser: new Map(),
      blockedWith: new Set(),
    });
    expect(fits).toEqual([{ gatheringId: "g1", fit: null, ratedCount: 0, hasBlocked: false }]);
  });

  it("excludes the viewer's own traits from the average", () => {
    const fits = scoreTables({
      viewerId: me,
      myTraits,
      gatheringIds: ["g1"],
      membersByGathering: new Map([["g1", new Set([me, "a"])]]),
      traitsByUser: new Map([
        [me, T(0, 0, 0, 0)],
        ["a", T(70, 70, 70, 70)],
      ]),
      blockedWith: new Set(),
    });
    expect(fits[0]).toMatchObject({ fit: 100, ratedCount: 1 });
  });

  it("uses mean pairwise fit of the whole table, not just viewer-vs-others", () => {
    // Viewer 70s, twin a (100), opposite b (40). a-vs-b is also 40.
    // Viewer-only mean would be 70; whole-table mean is (100+40+40)/3 = 60.
    const fits = scoreTables({
      viewerId: me,
      myTraits,
      gatheringIds: ["g1"],
      membersByGathering: new Map([["g1", new Set(["a", "b"])]]),
      traitsByUser: new Map([
        ["a", T(70, 70, 70, 70)],
        ["b", T(10, 10, 10, 10)],
      ]),
      blockedWith: new Set(),
    });
    expect(fits[0]).toMatchObject({ fit: 60, ratedCount: 2, hasBlocked: false });
  });

  it("counts the host as a member", () => {
    const fits = scoreTables({
      viewerId: me,
      myTraits,
      gatheringIds: ["g1"],
      membersByGathering: new Map([["g1", new Set(["host"])]]),
      traitsByUser: new Map([["host", T(60, 60, 60, 60)]]),
      blockedWith: new Set(),
    });
    expect(fits[0]).toMatchObject({ fit: 90, ratedCount: 1 });
  });

  it("refuses to score a table containing a blocked person", () => {
    const fits = scoreTables({
      viewerId: me,
      myTraits,
      gatheringIds: ["g1"],
      membersByGathering: new Map([["g1", new Set(["blocked", "a"])]]),
      traitsByUser: new Map([
        ["blocked", T(70, 70, 70, 70)],
        ["a", T(70, 70, 70, 70)],
      ]),
      blockedWith: new Set(["blocked"]),
    });
    expect(fits[0]).toEqual({ gatheringId: "g1", fit: null, ratedCount: 0, hasBlocked: true });
  });

  it("returns one entry per requested gathering, including unknown ids", () => {
    const fits = scoreTables({
      viewerId: me,
      myTraits,
      gatheringIds: ["g1", "g2"],
      membersByGathering: new Map(),
      traitsByUser: new Map(),
      blockedWith: new Set(),
    });
    expect(fits.map((f) => f.gatheringId)).toEqual(["g1", "g2"]);
    expect(fits.every((f) => f.fit === null)).toBe(true);
  });
});
