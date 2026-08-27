/**
 * Unsplash photo mappings for intentions (here sector).
 * These are stock photos used as visual representations for each intention.
 * Vendor-supplied before go-live.
 * 
 * Intentions represent what someone is looking for in a gathering.
 */

/**
 * Mapping of intention tags to Unsplash photo IDs or search queries.
 */
export const INTENTION_VISUALS: Record<string, string> = {
  // Social intentions
  "make_friends": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
  "meet_new_people": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac",
  "network": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
  "find_community": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac",
  "socialize": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b",
  
  // Learning & Growth
  "learn": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173",
  "share_knowledge": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
  "mentor": "https://images.unsplash.com/photo-1521791136064-7986c2920216",
  "be_inspired": "https://images.unsplash.com/photo-1506126613408-eca07ce68773",
  "discuss_ideas": "https://images.unsplash.com/photo-1518709268805-4e9042af2176",
  
  // Professional
  "collaborate": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
  "find_partners": "https://images.unsplash.com/photo-1521791136064-7986c2920216",
  "build_something": "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
  "work_together": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
  
  // Creative
  "create": "https://images.unsplash.com/photo-1541961017774-22349e4a1262",
  "brainstorm": "https://images.unsplash.com/photo-1518709268805-4e9042af2176",
  "express_myself": "https://images.unsplash.com/photo-1541961017774-22349e4a1262",
  
  // Relaxation & Fun
  "relax": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
  "have_fun": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b",
  "unwind": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
  "enjoy_life": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085",
  
  // Support & Healing
  "support_others": "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca",
  "find_support": "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca",
  "heal": "https://images.unsplash.com/photo-1506126613408-eca07ce68773",
  
  // Adventure
  "explore": "https://images.unsplash.com/photo-1488646953014-85cb44e25828",
  "try_new_things": "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9",
  "adventure": "https://images.unsplash.com/photo-1551632811-561732d1e306",
  
  // Relationships
  "find_love": "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2",
  "date": "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2",
  "connect": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
  
  // Spiritual
  "find_meaning": "https://images.unsplash.com/photo-1506126613408-eca07ce68773",
  "meditate": "https://images.unsplash.com/photo-1506126613408-eca07ce68773",
  "reflect": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
  
  // Help & Service
  "help_others": "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca",
  "volunteer": "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca",
  "give_back": "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca",
};

/**
 * Get the Unsplash URL for an intention.
 */
export function getIntentionVisual(intention: string): string {
  const visual = INTENTION_VISUALS[intention];
  if (visual) {
    return visual;
  }
  // Fallback to a generic social URL
  return `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80`;
}

/**
 * Get a small version of an intention visual.
 */
export function getIntentionVisualSmall(intention: string): string {
  const url = getIntentionVisual(intention);
  return url.replace(/w=\d+/, 'w=200') + (url.includes('?') ? '&' : '?') + 'q=80';
}

/**
 * Get a medium version of an intention visual.
 */
export function getIntentionVisualMedium(intention: string): string {
  const url = getIntentionVisual(intention);
  return url.replace(/w=\d+/, 'w=400') + (url.includes('?') ? '&' : '?') + 'q=80';
}
