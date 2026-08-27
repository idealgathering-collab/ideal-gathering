/**
 * Profile sectors for the guest card.
 * Order: aura → style → loves → here → story
 * Trust is intentionally OFF - do not add it.
 */
export const PROFILE_SECTORS = [
  "aura",
  "style", 
  "loves",
  "here",
  "story",
] as const;

export type ProfileSector = typeof PROFILE_SECTORS[number];

/**
 * Check if a string is a valid profile sector.
 */
export function isProfileSector(value: string): value is ProfileSector {
  return PROFILE_SECTORS.includes(value as ProfileSector);
}

/**
 * Get the display order index for a sector.
 */
export function sectorOrder(sector: ProfileSector): number {
  return PROFILE_SECTORS.indexOf(sector);
}
