/**
 * Unsplash photo mappings for interests.
 * These are stock photos used as visual representations for each interest.
 * Vendor-supplied before go-live.
 * 
 * Format: interest_id -> Unsplash photo URL or search query
 */

// Unsplash access key for API (configured in environment)
// For static URLs, we use the Unsplash source format: https://images.unsplash.com/photo-{id}?w=400&q=80

/**
 * Mapping of interest tags to Unsplash photo IDs or search queries.
 * Use photo IDs when available for consistent images.
 * Fallback to search queries for dynamic fetching.
 */
export const INTEREST_VISUALS: Record<string, string> = {
  // Arts & Culture
  "art": "https://images.unsplash.com/photo-1541961017774-22349e4a1262",
  "music": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f",
  "film": "https://images.unsplash.com/photo-1489599162810-1e666c4b4e4e",
  "theater": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
  "dance": "https://images.unsplash.com/photo-1523240795612-9a054b0db644",
  "literature": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570",
  "photography": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32",
  "museums": "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65",
  "galleries": "https://images.unsplash.com/photo-1578662996442-48f60103fc96",
  
  // Food & Drink
  "foodie": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085",
  "coffee": "https://images.unsplash.com/photo-1447933601403-0c6688de566e",
  "wine": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3",
  "cocktails": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b",
  "baking": "https://images.unsplash.com/photo-1551024506-0bccd828d307",
  "vegan": "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b",
  "cooking": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136",
  
  // Sports & Outdoors
  "hiking": "https://images.unsplash.com/photo-1551632811-561732d1e306",
  "yoga": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b",
  "cycling": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64",
  "running": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
  "swimming": "https://images.unsplash.com/photo-1544551763-46a013bb70d5",
  "climbing": "https://images.unsplash.com/photo-1522163182402-834f871fd851",
  "surfing": "https://images.unsplash.com/photo-1502680390469-be75c86b636f",
  "skiing": "https://images.unsplash.com/photo-1551524164-6cf2ac531400",
  
  // Travel
  "travel": "https://images.unsplash.com/photo-1488646953014-85cb44e25828",
  "backpacking": "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9",
  "camping": "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4",
  "beach": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
  
  // Technology
  "tech": "https://images.unsplash.com/photo-1518709268805-4e9042af2176",
  "coding": "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
  "gaming": "https://images.unsplash.com/photo-1511512578047-dfb367046420",
  "startups": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
  "ai": "https://images.unsplash.com/photo-1677442136019-21780ecad995",
  
  // Business & Finance
  "entrepreneurship": "https://images.unsplash.com/photo-1521791136064-7986c2920216",
  "finance": "https://images.unsplash.com/photo-1554224155-6726b3ff858f",
  "investing": "https://images.unsplash.com/photo-1611224923853-80b023f02d71",
  "marketing": "https://images.unsplash.com/photo-1460925895917-afdab827c52f",
  
  // Science
  "science": "https://images.unsplash.com/photo-1507413245164-6160d8298b31",
  "psychology": "https://images.unsplash.com/photo-1551836022-deb4988cc6c0",
  "physics": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31",
  "biology": "https://images.unsplash.com/photo-1559757148-5c350d0d3c56",
  
  // Social
  "networking": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
  "volunteering": "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca",
  "social_impact": "https://images.unsplash.com/photo-1559027615-cd4628902d4a",
  "community": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac",
  
  // Wellness
  "meditation": "https://images.unsplash.com/photo-1506126613408-eca07ce68773",
  "wellness": "https://images.unsplash.com/photo-1506629905607-d405b7a30db9",
  "mental_health": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b",
  
  // Education
  "learning": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173",
  "reading": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570",
  "languages": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
  "writing": "https://images.unsplash.com/photo-1455390582262-044cdead277a",
  
  // Nature
  "nature": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05",
  "animals": "https://images.unsplash.com/photo-1544568100-847a948585b9",
  "gardening": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b",
  "sustainability": "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09",
  
  // Fashion
  "fashion": "https://images.unsplash.com/photo-1483985988355-763728e1935b",
  "design": "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e",
  "beauty": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9",
  
  // Music genres
  "jazz": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
  "classical": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
  "rock": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f",
  "pop": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f",
  "hiphop": "https://images.unsplash.com/photo-1516280440614-37939bbacd81",
  "electronic": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
};

/**
 * Get the Unsplash URL for an interest.
 * Returns a static URL if available, otherwise constructs a search URL.
 */
export function getInterestVisual(interest: string): string {
  const visual = INTEREST_VISUALS[interest];
  if (visual) {
    return visual;
  }
  // Fallback to a generic Unsplash search URL
  return `https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&q=80`;
}

/**
 * Get a small (thumbnail) version of an interest visual.
 */
export function getInterestVisualSmall(interest: string): string {
  const url = getInterestVisual(interest);
  // Replace or add width parameter
  return url.replace(/w=\d+/, 'w=200') + (url.includes('?') ? '&' : '?') + 'q=80';
}

/**
 * Get a medium version of an interest visual.
 */
export function getInterestVisualMedium(interest: string): string {
  const url = getInterestVisual(interest);
  return url.replace(/w=\d+/, 'w=400') + (url.includes('?') ? '&' : '?') + 'q=80';
}
