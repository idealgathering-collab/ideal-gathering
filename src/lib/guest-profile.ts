import type { Database } from "@/integrations/supabase/types";

/**
 * Guest profile data for the photo-first card.
 * Used on both /profile (self) and /people/$id (other).
 */
export interface GuestProfile {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  city: string | null;
  neighborhood: string | null;
  country: string | null;
  bio: string | null;
  
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
  story: GuestStoryItem[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

/**
 * A story item representing a past approved gathering/table.
 */
export interface GuestStoryItem {
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
export interface GuestIdentity {
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
export interface GuestAura {
  personaColor: string | null;
  traitSpark: number | null;
  traitCuriosity: number | null;
  traitWarmth: number | null;
  traitDepth: number | null;
}

/**
 * Style sector data.
 */
export interface GuestStyle {
  energyLevel: string | null;
  groupSize: string | null;
  talkStyle: string | null;
  newPeople: string | null;
}

/**
 * Loves sector data (interests with visuals).
 */
export interface GuestLoves {
  interests: string[];
}

/**
 * Here sector data (intentions with visuals).
 */
export interface GuestHere {
  intentions: string[];
}

/**
 * Story sector data.
 */
export interface GuestStory {
  items: GuestStoryItem[];
}

/**
 * Database row type for profiles with story data.
 */
export type ProfileWithStory = Database["public"]["Tables"]["profiles"]["Row"] & {
  gatherings_attended: Array<{
    id: string;
    gathering: {
      id: string;
      title: string;
      start_time: string;
      host: {
        display_name: string | null;
      } | null;
    } | null;
    venue: {
      id: string;
      name: string;
      cover_url: string | null;
      business: {
        cover_url: string | null;
      } | null;
    } | null;
  }>;
};
