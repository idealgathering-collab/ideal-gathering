import { averageTraits, fitScore, type TraitScores } from "@/lib/matching";

export type TableFit = {
  gatheringId: string;
  /** 0-100 compatibility with the other rated attendees, or null when nobody else has taken the quiz. */
  fit: number | null;
  /** How many other attendees have trait scores. */
  ratedCount: number;
  /** True when the viewer and someone at this table have blocked each other; no score is computed. */
  hasBlocked?: boolean;
};

export type ScoreTablesInput = {
  viewerId: string;
  myTraits: TraitScores;
  gatheringIds: string[];
  /** Members (attendees + host) per gathering. */
  membersByGathering: Map<string, Set<string>>;
  traitsByUser: Map<string, TraitScores>;
  blockedWith: Set<string>;
};

/** Pure compatibility scoring for a list of gatherings. */
export function scoreTables({
  viewerId,
  myTraits,
  gatheringIds,
  membersByGathering,
  traitsByUser,
  blockedWith,
}: ScoreTablesInput): TableFit[] {
  return gatheringIds.map((gatheringId) => {
    const members = membersByGathering.get(gatheringId) ?? new Set<string>();
    let hasBlocked = false;
    const rated: TraitScores[] = [];
    for (const id of members) {
      if (id === viewerId) continue;
      if (blockedWith.has(id)) {
        hasBlocked = true;
        continue;
      }
      const scores = traitsByUser.get(id);
      if (scores) rated.push(scores);
    }
    if (hasBlocked) {
      return { gatheringId, fit: null, ratedCount: 0, hasBlocked: true };
    }
    const avg = averageTraits(rated);
    return {
      gatheringId,
      fit: avg ? fitScore(myTraits, avg) : null,
      ratedCount: rated.length,
      hasBlocked: false,
    };
  });
}
