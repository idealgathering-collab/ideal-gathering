import { ageGapFactor, tableAgeSpan } from "@/lib/age";
import { learnedEnergyFactor, personHistoryFactor, type PersonRating } from "@/lib/match-history";
import { meanPairwiseFit, type TraitScores } from "@/lib/matching";
import {
  energyForPerson,
  tableCohesionFactor,
  tableInterestScore,
  type EnergyBand,
} from "@/lib/vibe";

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
  /** Viewer's past ratings of specific people. Never sent to the client. */
  ratingsByUser?: Map<string, PersonRating>;
  /** Energy bands the viewer has already said they didn't enjoy. */
  avoidEnergy?: EnergyBand[];
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
  ratingsByUser,
  avoidEnergy = [],
}: ScoreTablesInput): TableFit[] {
  const viewerEnergy = energyForPerson(viewerEnergyPref, myTraits);

  return gatheringIds.map((gatheringId) => {
    const members = membersByGathering.get(gatheringId) ?? new Set<string>();
    let hasBlocked = false;
    const otherIds: string[] = [];
    const rated: TraitScores[] = [];
    const ages: Array<number | null> = typeof viewerAge === "number" ? [viewerAge] : [];
    const otherInterests: string[][] = [];
    const bands: Array<EnergyBand | null> = [viewerEnergy];

    for (const id of members) {
      if (id === viewerId) continue;
      if (blockedWith.has(id)) {
        hasBlocked = true;
        continue;
      }
      otherIds.push(id);
      const scores = traitsByUser.get(id);
      if (scores) rated.push(scores);
      const age = agesByUser?.get(id);
      if (typeof age === "number") ages.push(age);
      const tags = interestsByUser?.get(id);
      if (tags && tags.length > 0) otherInterests.push(tags);
      bands.push(energyOf(id, traitsByUser, energyPrefByUser));
    }

    if (hasBlocked) {
      return { gatheringId, fit: null, ratedCount: 0, hasBlocked: true };
    }

    // Every pair at the table — host included. Averaging only viewer-vs-other
    // lets a mismatched pair of guests hide behind a popular host.
    const pool = myTraits ? [myTraits, ...rated] : rated;
    const chemistry = meanPairwiseFit(pool);

    const interests = tableInterestScore(viewerInterests, otherInterests);
    const gap = tableAgeSpan(ages);
    const af = gap === null ? 1 : ageGapFactor(gap, interests);
    const vf = tableCohesionFactor(bands);
    const hf = personHistoryFactor(otherIds, ratingsByUser);
    const lf = learnedEnergyFactor(avoidEnergy, bands);

    const hasSignal =
      chemistry !== null || af < 1 || vf < 1 || hf < 1 || lf < 1 || interests !== null;
    if (!hasSignal) {
      return { gatheringId, fit: null, ratedCount: rated.length, hasBlocked: false };
    }

    const base = chemistry ?? 70;
    let raw = base * af * vf * hf * lf;
    // Shared interests can lift a 7–10 year pairing. They cannot rescue a hard age miss.
    if (interests !== null && af > 0.1) raw = raw * 0.78 + interests * 0.22;
    return {
      gatheringId,
      fit: clampScore(raw),
      ratedCount: rated.length,
      hasBlocked: false,
    };
  });
}
