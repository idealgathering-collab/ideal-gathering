import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { averageTraits, fitScore, traitsFromRow, type TraitScores } from "@/lib/matching";

export type TableFit = {
  gatheringId: string;
  /** 0-100 compatibility with the other rated attendees, or null when nobody else has taken the quiz. */
  fit: number | null;
  /** How many other attendees have trait scores. */
  ratedCount: number;
};

export type TableFitResponse = {
  viewerHasTraits: boolean;
  fits: TableFit[];
};

/**
 * Compatibility must be computed server-side: RLS hides other attendees' rows
 * and their profiles from the browser. Only aggregate numbers leave this handler.
 */
export const getTableFit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { gatheringIds: string[] }) => ({
    gatheringIds: (input.gatheringIds ?? []).filter((id) => typeof id === "string").slice(0, 60),
  }))
  .handler(async ({ data, context }): Promise<TableFitResponse> => {
    const { supabase, userId } = context;

    const { data: me } = await supabase
      .from("profiles")
      .select("trait_spark, trait_curiosity, trait_warmth, trait_depth")
      .eq("id", userId)
      .maybeSingle();

    const myTraits = traitsFromRow(me);
    if (!myTraits || data.gatheringIds.length === 0) {
      return { viewerHasTraits: Boolean(myTraits), fits: [] };
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

    const traitsByUser = new Map<string, TraitScores>();
    if (otherIds.size > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, trait_spark, trait_curiosity, trait_warmth, trait_depth")
        .in("id", [...otherIds]);
      for (const p of profiles ?? []) {
        const scores = traitsFromRow(p);
        if (scores) traitsByUser.set(p.id, scores);
      }
    }

    const fits: TableFit[] = data.gatheringIds.map((gatheringId) => {
      const members = byGathering.get(gatheringId) ?? new Set<string>();
      const rated: TraitScores[] = [];
      for (const id of members) {
        if (id === userId) continue;
        const scores = traitsByUser.get(id);
        if (scores) rated.push(scores);
      }
      const avg = averageTraits(rated);
      return {
        gatheringId,
        fit: avg ? fitScore(myTraits, avg) : null,
        ratedCount: rated.length,
      };
    });

    return { viewerHasTraits: true, fits };
  });
