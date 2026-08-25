import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ageFromDob } from "@/lib/age";
import { traitsFromRow, type TraitScores } from "@/lib/matching";
import { scoreTables, type TableFit } from "@/lib/table-fit";

export type { TableFit } from "@/lib/table-fit";

export type TableFitResponse = {
  /** True when the viewer finished the personality quiz. */
  viewerHasTraits: boolean;
  /** True when we have anything to score with (quiz, age, interests, or energy). */
  viewerHasSignal: boolean;
  fits: TableFit[];
};

function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && v.length > 0) : [];
}

/**
 * Compatibility must be computed server-side: RLS hides other attendees' rows
 * and their profiles from the browser. Only aggregate numbers leave this handler
 * — never another person's date of birth, age, or raw prefs.
 */
export const getTableFit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { gatheringIds: string[] }) => ({
    gatheringIds: (input.gatheringIds ?? []).filter((id) => typeof id === "string").slice(0, 60),
  }))
  .handler(async ({ data, context }): Promise<TableFitResponse> => {
    const { supabase, userId } = context;

    const [{ data: me }, { data: myPrefRow }] = await Promise.all([
      supabase
        .from("profiles")
        .select("trait_spark, trait_curiosity, trait_warmth, trait_depth, date_of_birth, interests")
        .eq("id", userId)
        .maybeSingle(),
      supabase.from("user_gathering_preferences").select("social_energy").eq("user_id", userId).maybeSingle(),
    ]);

    const myTraits = traitsFromRow(me);
    const viewerAge = ageFromDob(me?.date_of_birth);
    const viewerInterests = asStringList(me?.interests);
    const viewerEnergyPref = myPrefRow?.social_energy ?? null;
    const viewerHasTraits = Boolean(myTraits);
    const viewerHasSignal =
      viewerHasTraits || viewerAge !== null || viewerInterests.length > 0 || Boolean(viewerEnergyPref);

    if (!viewerHasSignal || data.gatheringIds.length === 0) {
      return { viewerHasTraits, viewerHasSignal, fits: [] };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: attendees } = await supabaseAdmin
      .from("gathering_attendees")
      .select("gathering_id, user_id")
      .in("gathering_id", data.gatheringIds);

    const { data: hosts } = await supabaseAdmin
      .from("gatherings")
      .select("id, host_id")
      .in("id", data.gatheringIds);

    const byGathering = new Map<string, Set<string>>();
    for (const id of data.gatheringIds) byGathering.set(id, new Set());
    for (const row of attendees ?? []) byGathering.get(row.gathering_id)?.add(row.user_id);
    for (const row of hosts ?? []) byGathering.get(row.id)?.add(row.host_id);

    const otherIds = new Set<string>();
    for (const set of byGathering.values()) {
      for (const id of set) if (id !== userId) otherIds.add(id);
    }

    // Never compute or show a compatibility number with someone the viewer has
    // blocked, or who has blocked the viewer.
    const { data: blocks } = await supabaseAdmin
      .from("user_blocks")
      .select("blocker_id, blocked_id")
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
    const blockedWith = new Set<string>();
    for (const row of blocks ?? []) {
      blockedWith.add(row.blocker_id === userId ? row.blocked_id : row.blocker_id);
    }
    for (const id of blockedWith) otherIds.delete(id);

    const traitsByUser = new Map<string, TraitScores>();
    const agesByUser = new Map<string, number>();
    const interestsByUser = new Map<string, string[]>();
    const energyPrefByUser = new Map<string, string>();

    if (otherIds.size > 0) {
      const ids = [...otherIds];
      const [{ data: profiles }, { data: prefs }] = await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("id, trait_spark, trait_curiosity, trait_warmth, trait_depth, date_of_birth, interests")
          .in("id", ids),
        supabaseAdmin.from("user_gathering_preferences").select("user_id, social_energy").in("user_id", ids),
      ]);
      for (const p of profiles ?? []) {
        const scores = traitsFromRow(p);
        if (scores) traitsByUser.set(p.id, scores);
        const age = ageFromDob(p.date_of_birth);
        if (age !== null) agesByUser.set(p.id, age);
        const tags = asStringList(p.interests);
        if (tags.length > 0) interestsByUser.set(p.id, tags);
      }
      for (const row of prefs ?? []) {
        if (row.social_energy) energyPrefByUser.set(row.user_id, row.social_energy);
      }
    }

    const fits = scoreTables({
      viewerId: userId,
      myTraits,
      gatheringIds: data.gatheringIds,
      membersByGathering: byGathering,
      traitsByUser,
      blockedWith,
      viewerAge,
      agesByUser,
      viewerInterests,
      interestsByUser,
      viewerEnergyPref,
      energyPrefByUser,
    });

    return { viewerHasTraits, viewerHasSignal, fits };
  });
