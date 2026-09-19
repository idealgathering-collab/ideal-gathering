import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { GatheringPreferences } from "./gathering-preferences";
import type { TraitScores } from "./matching";

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type ProfileEdit = Pick<
  ProfileUpdate,
  | "display_name"
  | "bio"
  | "date_of_birth"
  | "nationality"
  | "gender"
  | "city"
  | "country"
  | "neighborhood"
  | "interests"
  | "social_links"
>;
type ProfilePatch = ProfileEdit &
  Pick<
    ProfileUpdate,
    | "trait_spark"
    | "trait_curiosity"
    | "trait_warmth"
    | "trait_depth"
    | "traits_updated_at"
    | "onboarded_at"
  >;

/** Only changed fields are submitted; edits to other fields in another flow survive. */
export function changedFields<T extends object>(before: T, after: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(after).filter(
      ([key, value]) => JSON.stringify(value) !== JSON.stringify(before[key as keyof T]),
    ),
  ) as Partial<T>;
}

/** Atomic, self-only patch; the database enforces field allowlists and existing RLS. */
export async function saveProfileData(
  profile: ProfilePatch,
  preferences: Partial<GatheringPreferences>,
) {
  const { data, error } = await supabase.rpc("save_my_profile_data", {
    _profile: profile,
    _preferences: preferences,
  });
  if (error) throw error;
  if (data !== true) throw new Error("Profile was not saved");
}

export async function completeOnboarding(
  preferences: Partial<GatheringPreferences>,
  scores?: TraitScores,
) {
  const now = new Date().toISOString();
  await saveProfileData(
    {
      onboarded_at: now,
      ...(scores
        ? {
            trait_spark: Math.round(scores.spark),
            trait_curiosity: Math.round(scores.curiosity),
            trait_warmth: Math.round(scores.warmth),
            trait_depth: Math.round(scores.depth),
            traits_updated_at: now,
          }
        : {}),
    },
    preferences,
  );
}
