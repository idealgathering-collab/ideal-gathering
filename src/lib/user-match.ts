import type { GuestProfile } from "./guest-profile";
import { fitScore, type TraitScores } from "./matching";
import { interestJaccard } from "./vibe";
import { ageFromDob, ageGapFactor, MAX_COMPATIBLE_AGE_GAP } from "./age";

/**
 * User-to-user match score calculation.
 * Combines trait compatibility, interest overlap, and age compatibility.
 */

/**
 * Match result between two users.
 */
export interface UserMatchResult {
  /** Overall match score (0-100) */
  score: number;
  /** Trait compatibility score (0-100) */
  traitScore: number | null;
  /** Interest overlap percentage (0-100) */
  interestScore: number | null;
  /** Age compatibility factor (0-1) */
  ageFactor: number;
  /** Whether both users have trait data */
  hasTraitData: boolean;
  /** Whether both users have interest data */
  hasInterestData: boolean;
  /** Whether both users have age data */
  hasAgeData: boolean;
}

/**
 * Calculate match score between two users.
 * 
 * Formula:
 * - If both have traits: 50% weight to trait compatibility
 * - If both have interests: 30% weight to interest overlap
 * - If both have ages: 20% weight to age compatibility
 * 
 * Falls back to available data only.
 */
export function calculateUserMatch(
  userA: GuestProfile,
  userB: GuestProfile,
  userADob?: string | null,
  userBDob?: string | null,
): UserMatchResult {
  // Extract trait scores
  const traitsA: TraitScores = {
    spark: userA.traitSpark ?? 50,
    curiosity: userA.traitCuriosity ?? 50,
    warmth: userA.traitWarmth ?? 50,
    depth: userA.traitDepth ?? 50,
  };
  const traitsB: TraitScores = {
    spark: userB.traitSpark ?? 50,
    curiosity: userB.traitCuriosity ?? 50,
    warmth: userB.traitWarmth ?? 50,
    depth: userB.traitDepth ?? 50,
  };

  const hasTraitData = 
    userA.traitSpark !== null &&
    userA.traitCuriosity !== null &&
    userA.traitWarmth !== null &&
    userA.traitDepth !== null &&
    userB.traitSpark !== null &&
    userB.traitCuriosity !== null &&
    userB.traitWarmth !== null &&
    userB.traitDepth !== null;

  // Calculate trait compatibility
  const traitScore = hasTraitData ? fitScore(traitsA, traitsB) : null;

  // Extract interests
  const interestsA = userA.interests || [];
  const interestsB = userB.interests || [];
  const hasInterestData = interestsA.length > 0 && interestsB.length > 0;

  // Calculate interest overlap
  const interestScore = hasInterestData ? interestJaccard(interestsA, interestsB) : null;

  // Extract ages
  const ageA = userADob ? ageFromDob(userADob) : (userA.dateOfBirth ? ageFromDob(userA.dateOfBirth) : null);
  const ageB = userBDob ? ageFromDob(userBDob) : (userB.dateOfBirth ? ageFromDob(userB.dateOfBirth) : null);
  const hasAgeData = ageA !== null && ageB !== null;

  // Calculate age compatibility
  let ageFactor = 1;
  if (hasAgeData) {
    const gap = Math.abs(ageA! - ageB!);
    const interestOverlap = interestScore ?? 0;
    ageFactor = ageGapFactor(gap, interestOverlap);
  }

  // Calculate overall score
  let score = 50; // Default score when no data
  let totalWeight = 0;

  // Add trait score (50% weight)
  if (traitScore !== null) {
    score += (traitScore - 50) * 0.5;
    totalWeight += 0.5;
  }

  // Add interest score (30% weight)
  if (interestScore !== null) {
    score += (interestScore - 50) * 0.3;
    totalWeight += 0.3;
  }

  // Add age factor (20% weight)
  // ageFactor is 0-1, convert to 0-100 scale
  const ageScore = ageFactor * 100;
  score += (ageScore - 50) * 0.2;
  totalWeight += 0.2;

  // Normalize if we have partial data
  if (totalWeight > 0 && totalWeight < 1) {
    // Scale up to account for missing weights
    score = 50 + (score - 50) / totalWeight;
  }

  // Clamp to 0-100
  score = Math.round(Math.max(0, Math.min(100, score)));

  return {
    score,
    traitScore,
    interestScore,
    ageFactor,
    hasTraitData,
    hasInterestData,
    hasAgeData,
  };
}

/**
 * Simplified match score between two profiles (without DOB).
 * Uses only trait scores and interests.
 */
export function calculateProfileMatch(
  profileA: GuestProfile,
  profileB: GuestProfile,
): number {
  const result = calculateUserMatch(profileA, profileB);
  return result.score;
}

/**
 * Get match level description.
 */
export type MatchLevel = "high" | "good" | "steady" | "low";

export function getMatchLevel(score: number): MatchLevel {
  if (score >= 80) return "high";
  if (score >= 60) return "good";
  if (score >= 40) return "steady";
  return "low";
}

/**
 * Get match level color.
 */
export function getMatchLevelColor(level: MatchLevel): string {
  const colors: Record<MatchLevel, string> = {
    high: "#10B981",    // Green
    good: "#3B82F6",    // Blue
    steady: "#F59E0B",  // Orange
    low: "#EF4444",     // Red
  };
  return colors[level];
}

/**
 * Get match explanation text.
 */
export function getMatchExplanation(
  result: UserMatchResult,
  t: (key: string, params?: Record<string, string | number>) => string,
): string[] {
  const explanations: string[] = [];

  if (result.hasTraitData && result.traitScore !== null) {
    explanations.push(
      t("match.explanation.traits", { score: result.traitScore })
    );
  }

  if (result.hasInterestData && result.interestScore !== null) {
    explanations.push(
      t("match.explanation.interests", { score: result.interestScore })
    );
  }

  if (result.hasAgeData) {
    const level = getMatchLevel(Math.round(result.ageFactor * 100));
    explanations.push(
      t(`match.explanation.age.${level}`)
    );
  }

  return explanations;
}
