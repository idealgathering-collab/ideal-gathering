import type { Database } from "@/integrations/supabase/types";

/**
 * Guest profile data for the photo-first card.
 * Used on both /profile (self) and /people/$id (other).
 */
export interface ProfileCardData {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  city: string | null;
  neighborhood: string | null;
  country: string | null;
  bio: string | null;
  dateOfBirth: string | null;
  
  // Aura data (from quiz)
  personaColor: string | null;
  traitSpark: number | null;
  traitCuriosity: number | null;
  traitWarmth: number | null;
  traitDepth: number | null;
  
  // Style preferences
  energyLevel: string | null; // e.g., "high", "medium", "low"
  groupSize: string | null; // e.g., "intimate", "small", "large"
  talkStyle: string | null; // e.g., "listener", "balanced", "talker"
  newPeople: string | null; // e.g., "love", "neutral", "avoid"
  
  // Loves = interests with photos
  interests: string[];
  
  // Here = intentions with photos
  intentions: string[];
  
  // Story = past approved tables (visual filmstrip)
  story: ProfileCardStoryItem[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

/**
 * A story item representing a past approved gathering/table.
 */
export interface ProfileCardStoryItem {
  id: string;
  gatheringId: string;
  venueId: string;
  venueName: string;
  coverUrl: string | null;
  title: string;
  date: string;
  hostName: string;
}

/**
 * Minimal profile for displaying in the card header.
 */
export interface ProfileCardIdentity {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  city: string | null;
  neighborhood: string | null;
  country: string | null;
  personaColor: string | null;
}

/**
 * Aura sector data.
 */
export interface ProfileCardAura {
  personaColor: string | null;
  traitSpark: number | null;
  traitCuriosity: number | null;
  traitWarmth: number | null;
  traitDepth: number | null;
}

/**
 * Style sector data.
 */
export interface ProfileCardStyle {
  energyLevel: string | null;
  groupSize: string | null;
  talkStyle: string | null;
  newPeople: string | null;
}

/**
 * Loves sector data (interests with visuals).
 */
export interface ProfileCardLoves {
  interests: string[];
}

/**
 * Here sector data (intentions with visuals).
 */
export interface ProfileCardHere {
  intentions: string[];
}

/**
 * Story sector data.
 */
export interface ProfileCardStory {
  items: ProfileCardStoryItem[];
}

/**
 * Database row type for profiles.
 */
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
