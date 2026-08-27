/**
 * Gathering Types Taxonomy
 * 
 * Centralized definition of gathering type categories.
 * Used for:
 * - User preferences (what types of gatherings they like to attend)
 * - Gathering inference (auto-detecting gathering type from description)
 * - Matching algorithm (connecting users with compatible gathering types)
 * - Visual representation (icons, images for each type)
 * 
 * Design Principles:
 * - Each gathering has ONE primary type
 * - Types are mutually exclusive categories
 * - Slugs are short, URL-friendly, and multilingual-compatible
 * - Each type has clear semantic meaning
 */

/**
 * Gathering type identifiers.
 * These are the canonical slugs used throughout the app.
 */
export type GatheringType = typeof GATHERING_TYPES[number];

/**
 * All valid gathering types.
 * Order matters for UI display - more common types first.
 */
export const GATHERING_TYPES = [
  // Food & Drink (most common)
  "coffee",      // Coffee shop meetups, cafe gatherings
  "food",        // Restaurant, dinner, brunch, food-focused
  
  // Exploration & Adventure
  "city",        // City exploration, neighborhood walks
  "outdoors",    // Hiking, parks, nature, beach
  
  // Entertainment & Games
  "games",       // Board games, video games, game nights
  
  // Creative & Artistic
  "creative",    // Making, creating, DIY, crafts
  "arts",        // Museums, galleries, concerts, performances
  
  // Intellectual & Learning
  "learning",    // Workshops, classes, educational
  "books",       // Book clubs, reading groups
  "tech",        // Tech meetups, coding, startups
  
  // Timing & Style
  "spontaneous", // Last-minute, impromptu gatherings
] as const;

/**
 * Gathering type categories for UI grouping.
 * Helps organize types into logical groups in the UI.
 */
export interface GatheringTypeCategory {
  id: string;
  labelKey: string; // i18n key: gatheringType.category.<id>
  types: GatheringType[];
  icon: string; // Lucide icon name
}

/**
 * Category grouping for gathering types.
 */
export const GATHERING_TYPE_CATEGORIES: GatheringTypeCategory[] = [
  {
    id: "food_drink",
    labelKey: "gatheringType.category.foodDrink",
    types: ["coffee", "food"],
    icon: "Coffee",
  },
  {
    id: "exploration",
    labelKey: "gatheringType.category.exploration",
    types: ["city", "outdoors"],
    icon: "Compass",
  },
  {
    id: "entertainment",
    labelKey: "gatheringType.category.entertainment",
    types: ["games"],
    icon: "GameController",
  },
  {
    id: "creative",
    labelKey: "gatheringType.category.creative",
    types: ["creative", "arts"],
    icon: "Paintbrush",
  },
  {
    id: "intellectual",
    labelKey: "gatheringType.category.intellectual",
    types: ["learning", "books", "tech"],
    icon: "BookOpen",
  },
  {
    id: "timing",
    labelKey: "gatheringType.category.timing",
    types: ["spontaneous"],
    icon: "Clock",
  },
];

/**
 * Get all gathering types as a Set for fast lookup.
 */
export const GATHERING_TYPE_SET = new Set(GATHERING_TYPES);

/**
 * Check if a string is a valid gathering type.
 */
export function isGatheringType(value: string): value is GatheringType {
  return GATHERING_TYPE_SET.has(value as GatheringType);
}

/**
 * Get the category for a gathering type.
 */
export function getGatheringTypeCategory(type: GatheringType): GatheringTypeCategory | null {
  for (const category of GATHERING_TYPE_CATEGORIES) {
    if (category.types.includes(type)) {
      return category;
    }
  }
  return null;
}

/**
 * Get the display label for a gathering type.
 * Uses i18n key: gatheringType.<type>
 */
export function getGatheringTypeLabel(
  t: (key: string, params?: Record<string, string | number>) => string,
  type: GatheringType,
): string {
  return t(`gatheringType.${type}`);
}

/**
 * Get the description for a gathering type.
 * Uses i18n key: gatheringType.<type>.description
 */
export function getGatheringTypeDescription(
  t: (key: string, params?: Record<string, string | number>) => string,
  type: GatheringType,
): string {
  return t(`gatheringType.${type}.description`);
}

/**
 * Maximum number of gathering types a user can select.
 */
export const MAX_GATHERING_TYPES = 5;

/**
 * Default gathering type when none is specified.
 */
export const DEFAULT_GATHERING_TYPE: GatheringType = "coffee";
