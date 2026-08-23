import { describe, expect, it } from "vitest";
import { scoreTables } from "@/lib/table-fit";
import type { TraitScores } from "@/lib/matching";

const me: TraitScores = { spark: 70, curiosity: 70, warmth: 70, depth: 70 };
const twin: TraitScores = { spark: 70, curiosity: 70, warmth: 70, depth: 70 };
const opposite: TraitScores = { spark: 10, curiosity: 10, warmth: 10, depth: 10 };

function members(entries: Record<string, string[]>) {
  return new Map(Object.entries(entries).map(([k, v]) => [k, new Set(v)]));
}

describe("scoreTables", () => {
  it("scores a table against the other rated members", () => {
    const [fit] = scoreTables({
      viewerId: "me",
      myTraits: me,
      gatheringIds: ["g1"],
      membersByGathering: members({ g1: ["me", "a"] }),
      traitsByUser: new Map([["a", twin]]),
      blockedWith: new Set(),
    });
    expect(fit.fit).toBe(100);
    expect(fit.ratedCount).toBe(1);
    expect(fit.hasBlocked).toBe(false);
  });

  it("returns no score when nobody else has taken the quiz", () => {
    const [fit] = scoreTables({
      viewerId: "me",
      myTraits: me,
      gatheringIds: ["g1"],
      membersByGathering: members({ g1: ["me", "a"] }),
      traitsByUser: new Map(),
      blockedWith: new Set(),
    });
    expect(fit.fit).toBeNull();
    expect(fit.ratedCount).toBe(0);
  });

  it("never scores a table that includes a blocked person", () => {
    const [fit] = scoreTables({
      viewerId: "me",
      myTraits: me,
      gatheringIds: ["g1"],
      membersByGathering: members({ g1: ["me", "blocked"] }),
      traitsByUser: new Map([["blocked", twin]]),
      blockedWith: new Set(["blocked"]),
    });
    expect(fit.fit).toBeNull();
    expect(fit.ratedCount).toBe(0);
    expect(fit.hasBlocked).toBe(true);
  });

  it("suppresses the table even when unblocked members would score well", () => {
    const [fit] = scoreTables({
      viewerId: "me",
      myTraits: me,
      gatheringIds: ["g1"],
      membersByGathering: members({ g1: ["me", "a", "blocked"] }),
      traitsByUser: new Map([
        ["a", twin],
        ["blocked", twin],
      ]),
      blockedWith: new Set(["blocked"]),
    });
    expect(fit.hasBlocked).toBe(true);
    expect(fit.fit).toBeNull();
  });

  it("ignores the viewer's own traits in the average", () => {
    const [fit] = scoreTables({
      viewerId: "me",
      myTraits: me,
      gatheringIds: ["g1"],
      membersByGathering: members({ g1: ["me", "far"] }),
      traitsByUser: new Map([
        ["me", me],
        ["far", opposite],
      ]),
      blockedWith: new Set(),
    });
    expect(fit.ratedCount).toBe(1);
    expect(fit.fit).toBe(40);
  });

  it("returns one entry per requested gathering, including empty ones", () => {
    const fits = scoreTables({
      viewerId: "me",
      myTraits: me,
      gatheringIds: ["g1", "g2"],
      membersByGathering: members({ g1: ["me"] }),
      traitsByUser: new Map(),
      blockedWith: new Set(),
    });
    expect(fits.map((f) => f.gatheringId)).toEqual(["g1", "g2"]);
    expect(fits.every((f) => f.fit === null)).toBe(true);
  });
});
