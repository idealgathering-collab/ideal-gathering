/**
 * Unsplash photo mappings for gathering types.
 * These are stock photos used as visual representations for each gathering type.
 * Used in UI to display attractive images for gathering type categories.
 */

import { GATHERING_TYPES, type GatheringType } from "./gathering-types";

/**
 * Mapping of gathering types to Unsplash photo URLs.
 * Each type has a curated, high-quality photo that represents it.
 */
export const GATHERING_TYPE_VISUALS: Record<GatheringType, string> = {
  // Food & Drink
  coffee: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&q=80",
  food: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
  
  // Exploration & Adventure
  city: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&q=80",
  outdoors: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&q=80",
  
  // Entertainment & Games
  games: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&q=80",
  
  // Creative & Artistic
  creative: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&q=80",
  arts: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80",
  
  // Intellectual & Learning
  learning: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80",
  books: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80",
  tech: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80",
  
  // Timing & Style
  spontaneous: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80",
};

/**
 * Get the Unsplash URL for a gathering type.
 * Returns a static URL from the mapping, or a fallback if not found.
 */
export function getGatheringTypeVisual(type: GatheringType): string {
  return GATHERING_TYPE_VISUALS[type];
}

/**
 * Get a small (thumbnail) version of a gathering type visual.
 */
export function getGatheringTypeVisualSmall(type: GatheringType): string {
  const url = getGatheringTypeVisual(type);
  return url.replace(/w=\d+/, 'w=200') + (url.includes('?') ? '&' : '?') + 'q=80';
}

/**
 * Get a medium version of a gathering type visual.
 */
export function getGatheringTypeVisualMedium(type: GatheringType): string {
  const url = getGatheringTypeVisual(type);
  return url.replace(/w=\d+/, 'w=400') + (url.includes('?') ? '&' : '?') + 'q=80';
}

/**
 * Get a large version of a gathering type visual.
 */
export function getGatheringTypeVisualLarge(type: GatheringType): string {
  const url = getGatheringTypeVisual(type);
  return url.replace(/w=\d+/, 'w=800') + (url.includes('?') ? '&' : '?') + 'q=80';
}

/**
 * Get a random gathering type visual for fallback purposes.
 */
export function getRandomGatheringTypeVisual(): string {
  const types = GATHERING_TYPES;
  const randomType = types[Math.floor(Math.random() * types.length)];
  return getGatheringTypeVisual(randomType);
}
