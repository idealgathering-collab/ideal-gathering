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

  it("does not change chemistry when age/energy/interest maps are empty", () => {
    const [fit] = scoreTables({
      viewerId: "me",
      myTraits: me,
      gatheringIds: ["g1"],
      membersByGathering: members({ g1: ["me", "a"] }),
      traitsByUser: new Map([["a", twin]]),
      blockedWith: new Set(),
      viewerAge: 20,
      agesByUser: new Map(),
      viewerInterests: [],
      interestsByUser: new Map(),
    });
    expect(fit.fit).toBe(100);
  });

  it("crushes a 20-year-old vs a 40-year-old even when chemistry is perfect", () => {
    const [fit] = scoreTables({
      viewerId: "me",
      myTraits: me,
      gatheringIds: ["g1"],
      membersByGathering: members({ g1: ["me", "a"] }),
      traitsByUser: new Map([["a", twin]]),
      blockedWith: new Set(),
      viewerAge: 20,
      agesByUser: new Map([["a", 40]]),
    });
    expect(fit.fit).toBe(6);
  });

  it("does not recommend an outgoing guest into a reserved table", () => {
    const outgoing = { spark: 90, curiosity: 70, warmth: 70, depth: 70 };
    const reserved = { spark: 45, curiosity: 70, warmth: 70, depth: 70 };
    const shy = ["s1", "s2", "s3", "s4", "s5"];
    const [fit] = scoreTables({
      viewerId: "me",
      myTraits: outgoing,
      gatheringIds: ["g1"],
      membersByGathering: members({ g1: ["me", ...shy] }),
      traitsByUser: new Map(shy.map((id) => [id, reserved])),
      blockedWith: new Set(),
    });
    expect(fit.fit).toBeLessThan(45);
    expect(fit.ratedCount).toBe(5);
  });

  it("keeps a reserved guest with a reserved table near the chemistry score", () => {
    const reserved = { spark: 45, curiosity: 70, warmth: 70, depth: 70 };
    const [fit] = scoreTables({
      viewerId: "me",
      myTraits: reserved,
      gatheringIds: ["g1"],
      membersByGathering: members({ g1: ["me", "a"] }),
      traitsByUser: new Map([["a", reserved]]),
      blockedWith: new Set(),
    });
    expect(fit.fit).toBe(100);
  });

  it("does not let shared interests save an 11+ year age span", () => {
    const [fit] = scoreTables({
      viewerId: "me",
      myTraits: me,
      gatheringIds: ["g1"],
      membersByGathering: members({ g1: ["me", "a"] }),
      traitsByUser: new Map([["a", twin]]),
      blockedWith: new Set(),
      viewerAge: 22,
      agesByUser: new Map([["a", 34]]),
      viewerInterests: ["coffee", "books"],
      interestsByUser: new Map([["a", ["coffee", "books"]]]),
    });
    expect(fit.fit).toBe(6);
  });

  it("uses the whole table age span, not just viewer vs host", () => {
    const [fit] = scoreTables({
      viewerId: "me",
      myTraits: me,
      gatheringIds: ["g1"],
      membersByGathering: members({ g1: ["me", "host", "guest"] }),
      traitsByUser: new Map([
        ["host", twin],
        ["guest", twin],
      ]),
      blockedWith: new Set(),
      viewerAge: 24,
      agesByUser: new Map([
        ["host", 24],
        ["guest", 40],
      ]),
    });
    expect(fit.fit).toBe(6);
  });

  it("will not re-seat someone they already rated badly", () => {
    const [fit] = scoreTables({
      viewerId: "me",
      myTraits: me,
      gatheringIds: ["g1"],
      membersByGathering: members({ g1: ["me", "a"] }),
      traitsByUser: new Map([["a", twin]]),
      blockedWith: new Set(),
      ratingsByUser: new Map([["a", { score: 1, reasons: ["vibe"] }]]),
    });
    expect(fit.fit).toBeLessThan(15);
  });
});
