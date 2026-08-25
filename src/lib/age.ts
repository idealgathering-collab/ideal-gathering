/** Full years since `dob` (ISO date). Null when the value isn't a real date. */
export function ageFromDob(dob: string | null | undefined, now: Date = new Date()): number | null {
  if (!dob) return null;
  const b = new Date(dob);
  if (Number.isNaN(b.getTime())) return null;
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age -= 1;
  if (age < 0 || age > 120) return null;
  return age;
}

/**
 * Multiplier applied to table chemistry so a 20-year-old is not ranked
 * next to a 40-year-old. Uses the *largest* gap at the table — one
 * mismatched person is enough.
 *
 * 0–6 years → 1. 18+ years → ~0.06.
 */
export function ageGapFactor(maxGapYears: number): number {
  if (!Number.isFinite(maxGapYears) || maxGapYears <= 6) return 1;
  if (maxGapYears <= 8) return 0.88;
  if (maxGapYears <= 10) return 0.7;
  if (maxGapYears <= 12) return 0.48;
  if (maxGapYears <= 15) return 0.28;
  if (maxGapYears <= 17) return 0.15;
  return 0.06;
}

/** Largest |viewer − other| among known ages, or null when we can't compare. */
export function maxAgeGap(viewerAge: number | null | undefined, others: Array<number | null | undefined>): number | null {
  if (typeof viewerAge !== "number") return null;
  let max: number | null = null;
  for (const age of others) {
    if (typeof age !== "number") continue;
    const gap = Math.abs(viewerAge - age);
    if (max === null || gap > max) max = gap;
  }
  return max;
}
