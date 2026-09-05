import { supabase } from "@/integrations/supabase/client";
import type { ProfileCardData, ProfileCardStoryItem, ProfileRow } from "./profile-card";

const PROFILE_COLUMNS = `
  id,
  display_name,
  avatar_url,
  cover_url,
  city,
  neighborhood,
  country,
  bio,
  date_of_birth,
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
`;

type ProfileSelection = Pick<
  ProfileRow,
  | "id"
  | "display_name"
  | "avatar_url"
  | "cover_url"
  | "city"
  | "neighborhood"
  | "country"
  | "bio"
  | "date_of_birth"
  | "persona_color"
  | "trait_spark"
  | "trait_curiosity"
  | "trait_warmth"
  | "trait_depth"
  | "energy_level"
  | "group_size"
  | "talk_style"
  | "new_people_pref"
  | "interests"
  | "intentions"
  | "created_at"
  | "updated_at"
>;

/**
 * Load a guest profile by user ID.
 * Used for both self profile (/profile) and other profiles (/people/$id).
 */
export async function loadProfileCard(userId: string): Promise<ProfileCardData | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    // RLS only exposes the viewer's own row, so any other member's profile has to
    // come back through the server function with a redacted public projection.
    const { loadPublicProfile } = await import("./public-profile.functions");
    const publicRow = await loadPublicProfile({ data: { userId } });
    if (!publicRow) {
      if (error) console.error("Error loading guest profile:", error);
      return null;
    }
    return transformProfileData(publicRow as unknown as ProfileSelection, []);
  }

  const story = await loadStoryItems(userId);
  return transformProfileData(data as ProfileSelection, story);
}

/**
 * Load multiple guest profiles by user IDs (without story data).
 */
export async function loadProfileCards(userIds: string[]): Promise<ProfileCardData[]> {
  if (userIds.length === 0) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .in("id", userIds);

  if (error || !data) {
    if (error) console.error("Error loading guest profiles:", error);
    return [];
  }

  return (data as ProfileSelection[]).map((row) => transformProfileData(row, []));
}

/**
 * Load past gatherings the user attended, as visual story items.
 */
async function loadStoryItems(userId: string): Promise<ProfileCardStoryItem[]> {
  const { data, error } = await supabase
    .from("gathering_attendees")
    .select(
      `gathering:gatherings(
        id,
        subject,
        starts_at,
        venue_name,
        business:businesses(id, name, cover_url)
      )`,
    )
    .eq("user_id", userId)
    .limit(20);

  if (error || !data) return [];

  const now = Date.now();

  return data
    .map((row) => row.gathering)
    .filter((g): g is NonNullable<typeof g> => !!g)
    .filter((g) => new Date(g.starts_at).getTime() < now)
    .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
    .slice(0, 4)
    .map((g): ProfileCardStoryItem => ({
      id: g.id,
      gatheringId: g.id,
      venueId: g.business?.id ?? "",
      venueName: g.business?.name ?? g.venue_name ?? "",
      coverUrl: g.business?.cover_url ?? null,
      title: g.subject,
      date: g.starts_at,
      hostName: "",
    }));
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

/**
 * Transform database profile data into the ProfileCardData format.
 */
function transformProfileData(data: ProfileSelection, story: ProfileCardStoryItem[]): ProfileCardData {
  return {
    id: data.id,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    coverUrl: data.cover_url,
    city: data.city,
    neighborhood: data.neighborhood,
    country: data.country,
    bio: data.bio,
    dateOfBirth: data.date_of_birth ?? null,
    personaColor: data.persona_color,
    traitSpark: data.trait_spark,
    traitCuriosity: data.trait_curiosity,
    traitWarmth: data.trait_warmth,
    traitDepth: data.trait_depth,
    energyLevel: data.energy_level,
    groupSize: data.group_size,
    talkStyle: data.talk_style,
    newPeople: data.new_people_pref,
    interests: asStringArray(data.interests),
    intentions: asStringArray(data.intentions),
    story,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Get the display name for a profile, falling back to a generic label.
 */
export function getDisplayName(profile: { displayName: string | null } | null): string {
  if (!profile) return "Unknown";
  if (profile.displayName) return profile.displayName;
  return "Guest";
}

/**
 * Get the location string for a profile.
 */
export function getLocationString(profile: {
  neighborhood: string | null;
  city: string | null;
  country: string | null;
}): string | null {
  const parts = [profile.neighborhood, profile.city, profile.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

/**
 * Check if a profile has completed the quiz (has aura data).
 */
export function hasAuraData(profile: ProfileCardData): boolean {
  return (
    profile.personaColor !== null ||
    (profile.traitSpark !== null ||
      profile.traitCuriosity !== null ||
      profile.traitWarmth !== null ||
      profile.traitDepth !== null)
  );
}

/**
 * Check if a profile has style preferences.
 */
export function hasStyleData(profile: ProfileCardData): boolean {
  return (
    profile.energyLevel !== null ||
    profile.groupSize !== null ||
    profile.talkStyle !== null ||
    profile.newPeople !== null
  );
}
