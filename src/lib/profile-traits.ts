import { supabase } from "@/integrations/supabase/client";
import type { TraitScores } from "@/lib/matching";

/**
 * Persist the signed-in user's quiz trait scores to their profile.
 * Retaking the quiz overwrites the previous result.
 */
export async function saveMyTraits(userId: string, scores: TraitScores) {
  const { error } = await supabase
    .from("profiles")
    .update({
      trait_spark: Math.round(scores.spark),
      trait_curiosity: Math.round(scores.curiosity),
      trait_warmth: Math.round(scores.warmth),
      trait_depth: Math.round(scores.depth),
      traits_updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) throw error;
}
