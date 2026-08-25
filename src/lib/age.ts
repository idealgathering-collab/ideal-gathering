/** Hard ceiling. Shared interests can soften a 7–10 year gap; they cannot save 11+. */
export const MAX_COMPATIBLE_AGE_GAP = 10;

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
 * Multiplier from the *span* of ages at the table (oldest − youngest).
 * One mismatched person is enough — the table has to work for everyone.
 *
 * `interestOverlap` 0–100: same-interest pairs keep 7–10 years nearly whole.
 * Anything over 10 years is crushed regardless.
 */
export function ageGapFactor(maxGapYears: number, interestOverlap: number | null = null): number {
  if (!Number.isFinite(maxGapYears) || maxGapYears <= 6) return 1;
  if (maxGapYears > MAX_COMPATIBLE_AGE_GAP) return 0.06;
  const shared = (interestOverlap ?? 0) >= 40;
  if (maxGapYears <= 8) return shared ? 1 : 0.9;
  return shared ? 0.95 : 0.72;
}

/** Largest |a − b| among known ages, or null when fewer than two ages. */
export function tableAgeSpan(ages: Array<number | null | undefined>): number | null {
  const known: number[] = [];
  for (const age of ages) if (typeof age === "number") known.push(age);
  if (known.length < 2) return null;
  return Math.max(...known) - Math.min(...known);
}

/** Largest |viewer − other| among known ages, or null when we can't compare. */
export function maxAgeGap(viewerAge: number | null | undefined, others: Array<number | null | undefined>): number | null {
  if (typeof viewerAge !== "number") return tableAgeSpan(others);
  return tableAgeSpan([viewerAge, ...others]);
}
