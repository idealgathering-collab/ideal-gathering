import type { EnergyBand } from "@/lib/vibe";

export const FEEDBACK_REASONS = ["vibe", "attitude", "energy", "conversation"] as const;
export type FeedbackReason = (typeof FEEDBACK_REASONS)[number];

export type PersonRating = {
  score: number;
  reasons: FeedbackReason[];
};

export function isFeedbackReason(v: unknown): v is FeedbackReason {
  return typeof v === "string" && (FEEDBACK_REASONS as readonly string[]).includes(v);
}

export function parseReasons(value: unknown): FeedbackReason[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isFeedbackReason);
}

/**
 * How past ratings of *these specific people* should move the next table.
 * 1–2 stars = do not seat them together again. 3 = a soft warning.
 */
export function personHistoryFactor(
  memberIds: Iterable<string>,
  ratings: Map<string, PersonRating> | undefined,
): number {
  if (!ratings || ratings.size === 0) return 1;
  let worst = 1;
  for (const id of memberIds) {
    const r = ratings.get(id);
    if (!r) continue;
    if (r.score <= 2) return 0.08;
    if (r.score === 3) worst = Math.min(worst, 0.85);
  }
  return worst;
}

/** Energy bands the viewer has already said they didn't enjoy sitting with. */
export function avoidBandsFromHistory(
  history: Array<{ score: number; reasons: FeedbackReason[]; energy: EnergyBand | null }>,
): EnergyBand[] {
  const bands: EnergyBand[] = [];
  for (const h of history) {
    if (h.score > 2 || !h.energy || h.energy === "mixed") continue;
    bands.push(h.energy);
  }
  return bands;
}

/**
 * If the last table's vibe/attitude was a miss, don't put them back in
 * the same energy cluster. One hit softens; two crushes.
 */
export function learnedEnergyFactor(
  avoidBands: EnergyBand[],
  tableBands: Array<EnergyBand | null>,
): number {
  if (avoidBands.length === 0) return 1;
  const known = tableBands.filter((b): b is EnergyBand => b !== null && b !== "mixed");
  if (known.length === 0) return 1;
  const reserved = known.filter((b) => b === "reserved").length;
  const outgoing = known.filter((b) => b === "outgoing").length;
  const majority: EnergyBand | null =
    reserved > known.length / 2 ? "reserved" : outgoing > known.length / 2 ? "outgoing" : null;
  if (!majority) return 1;
  const hits = avoidBands.filter((b) => b === majority).length;
  if (hits >= 2) return 0.32;
  if (hits === 1) return 0.7;
  return 1;
}
