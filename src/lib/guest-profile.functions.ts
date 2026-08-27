import { supabase } from "@/integrations/supabase/client";
import type { GuestProfile, GuestStoryItem, ProfileWithStory } from "./guest-profile";

/**
 * Load a guest profile by user ID.
 * Used for both self profile (/profile) and other profiles (/people/$id).
 */
export async function loadGuestProfile(userId: string): Promise<GuestProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id,
      display_name,
      avatar_url,
      cover_url,
      city,
      neighborhood,
      country,
      bio,
      persona_color,
      trait_spark,
      trait_curiosity,
      trait_warmth,
      trait_depth,
      energy_level,
      group_size,
      talk_style,
      new_people_pref,
      interests,
      intentions,
      created_at,
      updated_at,
      
      // Load past approved gatherings for story
      gatherings_attended:gatherings_attendees(
        gathering:gatherings(
          id,
          title,
          start_time,
          host:profiles(display_name)
        ),
        venue:venues(
          id,
          name,
          cover_url,
          business:businesses(cover_url)
        ),
        status
      )
    `)
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    console.error("Error loading guest profile:", error);
    return null;
  }

  return transformProfileData(data);
}

/**
 * Load multiple guest profiles by user IDs.
 */
export async function loadGuestProfiles(userIds: string[]): Promise<GuestProfile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id,
      display_name,
      avatar_url,
      cover_url,
      city,
      neighborhood,
      country,
      bio,
      persona_color,
      trait_spark,
      trait_curiosity,
      trait_warmth,
      trait_depth,
      energy_level,
      group_size,
      talk_style,
      new_people_pref,
      interests,
      intentions,
      created_at,
      updated_at
    `)
    .in("id", userIds);

  if (error) {
    console.error("Error loading guest profiles:", error);
    return [];
  }

  return data.map(transformProfileData);
}

/**
 * Transform database profile data into the GuestProfile format.
 */
function transformProfileData(data: ProfileWithStory): GuestProfile {
  const approvedGatherings = (data.gatherings_attended as unknown as Array<{
    gathering: {
      id: string;
      title: string;
      start_time: string;
      host: { display_name: string | null } | null;
    };
    venue: {
      id: string;
      name: string;
      cover_url: string | null;
      business: { cover_url: string | null } | null;
    };
    status: string;
  }>) || [];

  // Filter for approved/attended gatherings, sort by date descending, limit to 4
  const storyItems = approvedGatherings
    .filter(g => g.status === "approved" || g.status === "attended")
    .sort((a, b) => new Date(b.gathering.start_time).getTime() - new Date(a.gathering.start_time).getTime())
    .slice(0, 4)
    .map((g): GuestStoryItem => ({
      id: g.gathering.id,
      gatheringId: g.gathering.id,
      venueId: g.venue.id,
      venueName: g.venue.name,
      coverUrl: g.venue.cover_url || g.venue.business?.cover_url || null,
      title: g.gathering.title,
      date: g.gathering.start_time,
      hostName: g.gathering.host?.display_name || "Unknown",
    }));

  return {
    id: data.id,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    coverUrl: data.cover_url,
    city: data.city,
    neighborhood: data.neighborhood,
    country: data.country,
    bio: data.bio,
    personaColor: data.persona_color,
    traitSpark: data.trait_spark,
    traitCuriosity: data.trait_curiosity,
    traitWarmth: data.trait_warmth,
    traitDepth: data.trait_depth,
    energyLevel: data.energy_level,
    groupSize: data.group_size,
    talkStyle: data.talk_style,
    newPeople: data.new_people_pref,
    interests: Array.isArray(data.interests) ? data.interests : [],
    intentions: Array.isArray(data.intentions) ? data.intentions : [],
    story: storyItems,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Get the display name for a profile, falling back to email or ID.
 */
export function getDisplayName(profile: GuestProfile | null): string {
  if (!profile) return "Unknown";
  if (profile.displayName) return profile.displayName;
  return "Guest";
}

/**
 * Get the location string for a profile.
 */
export function getLocationString(profile: GuestProfile): string | null {
  const parts = [profile.neighborhood, profile.city, profile.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

/**
 * Check if a profile has completed the quiz (has aura data).
 */
export function hasAuraData(profile: GuestProfile): boolean {
  return profile.personaColor !== null && 
    (profile.traitSpark !== null || 
     profile.traitCuriosity !== null || 
     profile.traitWarmth !== null || 
     profile.traitDepth !== null);
}

/**
 * Check if a profile has style preferences.
 */
export function hasStyleData(profile: GuestProfile): boolean {
  return profile.energyLevel !== null || 
    profile.groupSize !== null || 
    profile.talkStyle !== null || 
    profile.newPeople !== null;
}
