import { GATHERING_TYPES, MAX_GATHERING_TYPES, type GatheringType } from "@/lib/gathering-types";
import { supabase } from "@/integrations/supabase/client";

/** Stable machine-readable option values for the gathering preference questions. */
export const INTENTION_OPTIONS = [
  "meet_new_people",
  "make_friends",
  "meaningful_conversations",
  "discover_places",
  "do_things_together",
  "learn_something",
  "shared_interests",
  "get_out",
] as const;

/**
 * Gathering type options for user preferences.
 * Must match GATHERING_TYPES from gathering-types.ts for consistency.
 */
export const GATHERING_TYPE_OPTIONS: readonly GatheringType[] = GATHERING_TYPES;

/** value === null means "I don't really mind". */
export const GROUP_SIZE_OPTIONS = [
  { k: "small", value: 3 },
  { k: "medium", value: 4 },
  { k: "large", value: 5 },
  { k: "any", value: null },
] as const;

export const SOCIAL_ENERGY_OPTIONS = ["calm", "mixed", "lively", "depends"] as const;
export const CONVERSATION_STYLE_OPTIONS = ["light", "mix", "meaningful", "deep", "all"] as const;
export const SPONTANEITY_OPTIONS = ["spontaneous", "sometimes", "some_planning", "planner"] as const;
export const STRANGER_COMFORT_OPTIONS = ["love_it", "comfortable", "familiar_face", "warm_up"] as const;

export const MAX_INTENTIONS = 3;
export { MAX_GATHERING_TYPES } from "@/lib/gathering-types";

export type GatheringPreferences = {
  intentions: string[];
  gathering_types: GatheringType[];
  preferred_group_size: number | null;
  social_energy: string | null;
  conversation_style: string | null;
  spontaneity: string | null;
  stranger_comfort: string | null;
};

export const EMPTY_PREFERENCES: GatheringPreferences = {
  intentions: [],
  gathering_types: [],
  preferred_group_size: null,
  social_energy: null,
  conversation_style: null,
  spontaneity: null,
  stranger_comfort: null,
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

/** Load the signed-in user's saved preferences, or null when nothing is stored yet. */
export async function loadMyGatheringPreferences(userId: string): Promise<GatheringPreferences | null> {
  const { data, error } = await supabase
    .from("user_gathering_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    intentions: asStringArray(data.intentions),
    gathering_types: asStringArray(data.gathering_types) as GatheringPreferences["gathering_types"],
    preferred_group_size: data.preferred_group_size ?? null,
    social_energy: data.social_energy ?? null,
    conversation_style: data.conversation_style ?? null,
    spontaneity: data.spontaneity ?? null,
    stranger_comfort: data.stranger_comfort ?? null,
  };
}

/** True when the user answered at least one question — nothing is saved for a fully empty form. */
export function hasAnyAnswer(prefs: GatheringPreferences) {
  return (
    prefs.intentions.length > 0 ||
    prefs.gathering_types.length > 0 ||
    prefs.preferred_group_size !== null ||
    Boolean(prefs.social_energy) ||
    Boolean(prefs.conversation_style) ||
    Boolean(prefs.spontaneity) ||
    Boolean(prefs.stranger_comfort)
  );
}

/** Upsert the preferences for the signed-in user (RLS: auth.uid() = user_id). */
export async function saveMyGatheringPreferences(userId: string, prefs: GatheringPreferences) {
  const { error } = await supabase.from("user_gathering_preferences").upsert(
    {
      user_id: userId,
      intentions: prefs.intentions,
      gathering_types: prefs.gathering_types,
      preferred_group_size: prefs.preferred_group_size,
      social_energy: prefs.social_energy,
      conversation_style: prefs.conversation_style,
      spontaneity: prefs.spontaneity,
      stranger_comfort: prefs.stranger_comfort,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}
