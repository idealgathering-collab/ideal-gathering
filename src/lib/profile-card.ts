import type { Database } from "@/integrations/supabase/types";

/**
 * Profile card data for the photo-first card.
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
  energyLevel: string | null;
  groupSize: string | null;
  talkStyle: string | null;
  newPeople: string | null;
  spontaneity: string | null;

  // Loves = interests with photos
  interests: string[];

  // Here = intentions
  intentions: string[];

  // Story = past approved tables (visual filmstrip)
  story: ProfileCardStoryItem[];

  // Metadata
  createdAt: string;
  updatedAt: string;
}

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

export interface ProfileCardAura {
  personaColor: string | null;
  traitSpark: number | null;
  traitCuriosity: number | null;
  traitWarmth: number | null;
  traitDepth: number | null;
}

export interface ProfileCardStyle {
  energyLevel: string | null;
  groupSize: string | null;
  talkStyle: string | null;
  newPeople: string | null;
  spontaneity: string | null;
}

export interface ProfileCardLoves {
  interests: string[];
}

export interface ProfileCardHere {
  intentions: string[];
}

export interface ProfileCardStory {
  items: ProfileCardStoryItem[];
}

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
