import type { TraitScores } from "@/lib/matching";

/** Coarse social band. Reserved ≈ shy/calm; outgoing ≈ the "go out" person. */
export type EnergyBand = "reserved" | "mixed" | "outgoing";

/**
 * Spark is the quiz axis that tracks outgoing vs reserved.
 * Mid-range (the default 60–70s) is mixed so existing chemistry numbers stay put.
 */
export function energyFromSpark(spark: number): EnergyBand {
  if (spark >= 75) return "outgoing";
  if (spark <= 50) return "reserved";
  return "mixed";
}

/** Pref `social_energy`: calm / mixed / lively / depends. */
export function energyFromPref(pref: string | null | undefined): EnergyBand | null {
  if (pref === "calm") return "reserved";
  if (pref === "lively") return "outgoing";
  if (pref === "mixed") return "mixed";
  return null;
}

/** Prefer an explicit pref, else infer from quiz spark. */
export function energyForPerson(
  pref: string | null | undefined,
  traits: TraitScores | null | undefined,
): EnergyBand | null {
  return energyFromPref(pref) ?? (traits ? energyFromSpark(traits.spark) : null);
}

/**
 * How well the viewer's energy sits with the people already at the table.
 *
 * Only a reserved/outgoing clash is penalized (the “five shy people and one
 * go-out person” case). Mixed sits anywhere at 1 so tables without a clear
 * energy cluster keep their chemistry score.
 */
export function vibeFactor(viewer: EnergyBand | null, table: Array<EnergyBand | null>): number {
  if (!viewer) return 1;
  const known = table.filter((b): b is EnergyBand => b !== null);
  if (known.length === 0) return 1;

  const reserved = known.filter((b) => b === "reserved").length;
  const outgoing = known.filter((b) => b === "outgoing").length;
  const majority: EnergyBand | null =
    reserved > known.length / 2 ? "reserved" : outgoing > known.length / 2 ? "outgoing" : null;

  if (!majority || viewer === "mixed" || viewer === majority) return 1;
  return 0.28;
}

/**
 * Whole-table cohesion: reserved and outgoing people should not share a table.
 * Mixed does not count as a clash. Used so the table works for everyone, not
 * just the person currently browsing.
 */
export function tableCohesionFactor(bands: Array<EnergyBand | null>): number {
  let reserved = 0;
  let outgoing = 0;
  for (const b of bands) {
    if (b === "reserved") reserved += 1;
    else if (b === "outgoing") outgoing += 1;
  }
  if (reserved > 0 && outgoing > 0) return 0.28;
  return 1;
}

/** Jaccard overlap 0–100 between two interest slug lists. */
export function interestJaccard(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const mine = new Set(a);
  let inter = 0;
  for (const tag of b) if (mine.has(tag)) inter += 1;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : (inter / union) * 100;
}

/** Mean Jaccard vs members who listed interests. Null when nobody can be compared. */
export function tableInterestScore(viewer: string[], others: string[][]): number | null {
  if (viewer.length === 0) return null;
  const scored = others.filter((list) => list.length > 0);
  if (scored.length === 0) return null;
  const total = scored.reduce((sum, list) => sum + interestJaccard(viewer, list), 0);
  return total / scored.length;
}
