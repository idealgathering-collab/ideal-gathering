import { ageGapFactor, maxAgeGap } from "@/lib/age";
import { fitScore, type TraitScores } from "@/lib/matching";
import { energyForPerson, tableInterestScore, vibeFactor, type EnergyBand } from "@/lib/vibe";

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
  myTraits: TraitScores | null;
  gatheringIds: string[];
  /** Members (attendees + host) per gathering. */
  membersByGathering: Map<string, Set<string>>;
  traitsByUser: Map<string, TraitScores>;
  blockedWith: Set<string>;
  /** Viewer's age in full years. Omit / null → age is ignored (existing chemistry numbers stay put). */
  viewerAge?: number | null;
  /** Other members' ages. Missing ids are skipped. Never sent to the client. */
  agesByUser?: Map<string, number>;
  viewerInterests?: string[];
  interestsByUser?: Map<string, string[]>;
  /** Explicit social_energy pref. Spark is used as a fallback when this is missing. */
  viewerEnergyPref?: string | null;
  energyPrefByUser?: Map<string, string>;
};

function clampScore(n: number): number {
  return Math.round(Math.min(100, Math.max(0, n)));
}

function energyOf(
  id: string,
  traitsByUser: Map<string, TraitScores>,
  energyPrefByUser: Map<string, string> | undefined,
): EnergyBand | null {
  return energyForPerson(energyPrefByUser?.get(id) ?? null, traitsByUser.get(id) ?? null);
}

/** Pure compatibility scoring for a list of gatherings. */
export function scoreTables({
  viewerId,
  myTraits,
  gatheringIds,
  membersByGathering,
  traitsByUser,
  blockedWith,
  viewerAge = null,
  agesByUser,
  viewerInterests = [],
  interestsByUser,
  viewerEnergyPref = null,
  energyPrefByUser,
}: ScoreTablesInput): TableFit[] {
  const viewerEnergy = energyForPerson(viewerEnergyPref, myTraits);

  return gatheringIds.map((gatheringId) => {
    const members = membersByGathering.get(gatheringId) ?? new Set<string>();
    let hasBlocked = false;
    const rated: TraitScores[] = [];
    const otherAges: number[] = [];
    const otherInterests: string[][] = [];
    const otherEnergy: Array<EnergyBand | null> = [];

    for (const id of members) {
      if (id === viewerId) continue;
      if (blockedWith.has(id)) {
        hasBlocked = true;
        continue;
      }
      const scores = traitsByUser.get(id);
      if (scores) rated.push(scores);
      const age = agesByUser?.get(id);
      if (typeof age === "number") otherAges.push(age);
      const tags = interestsByUser?.get(id);
      if (tags && tags.length > 0) otherInterests.push(tags);
      otherEnergy.push(energyOf(id, traitsByUser, energyPrefByUser));
    }

    if (hasBlocked) {
      return { gatheringId, fit: null, ratedCount: 0, hasBlocked: true };
    }

    // Mean pairwise fit — averaging trait vectors first makes a table of
    // opposites look like a perfect match for a middle-of-the-road viewer.
    const chemistry =
      myTraits && rated.length > 0
        ? rated.reduce((sum, scores) => sum + fitScore(myTraits, scores), 0) / rated.length
        : null;

    const gap = maxAgeGap(viewerAge, otherAges);
    const af = gap === null ? 1 : ageGapFactor(gap);
    const vf = vibeFactor(viewerEnergy, otherEnergy);
    const interests = tableInterestScore(viewerInterests, otherInterests);

    const hasSignal = chemistry !== null || af < 1 || vf < 1 || interests !== null;
    if (!hasSignal) {
      return { gatheringId, fit: null, ratedCount: rated.length, hasBlocked: false };
    }

    const base = chemistry ?? 70;
    let raw = base * af * vf;
    if (interests !== null) raw = raw * 0.78 + interests * 0.22;
    return {
      gatheringId,
      fit: clampScore(raw),
      ratedCount: rated.length,
      hasBlocked: false,
    };
  });
}
