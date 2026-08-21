import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { checkinWindow } from "@/lib/attendance.functions";

export type FeedbackPerson = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type PendingFeedback = {
  gathering_id: string;
  subject: string;
  starts_at: string;
  city: string | null;
  venue: string | null;
  people: FeedbackPerson[];
};

/** How long a gathering keeps asking for feedback before it ages out. */
const FEEDBACK_TTL_DAYS = 14;

/**
 * Gatherings the caller checked into and hasn't rated yet. A gathering becomes
 * "pending" once they check out, or once the check-in window closes (24h after the end).
 */
export const listPendingFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PendingFeedback[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - FEEDBACK_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { data: mine } = await supabaseAdmin
      .from("gathering_attendees")
      .select("gathering_id, checked_out_at, gatherings(id, subject, starts_at, ends_at, status, city, venue_name)")
      .eq("user_id", context.userId)
      .not("checked_in_at", "is", null)
      .gte("joined_at", since)
      .limit(50);

    const now = Date.now();
    const rows = (mine ?? []).filter((r) => {
      const g = r.gatherings as unknown as {
        starts_at: string;
        ends_at: string | null;
        status: string;
      } | null;
      if (!g || g.status === "cancelled" || g.status === "rejected") return false;
      if (new Date(g.starts_at).getTime() < now - FEEDBACK_TTL_DAYS * 24 * 60 * 60 * 1000) return false;
      return !!r.checked_out_at || now > checkinWindow(g.starts_at, g.ends_at).closesAt;
    });
    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.gathering_id);
    const { data: rated } = await supabaseAdmin
      .from("gathering_ratings")
      .select("gathering_id")
      .eq("rater_id", context.userId)
      .in("gathering_id", ids);
    const ratedIds = new Set((rated ?? []).map((r) => r.gathering_id));

    const open = rows.filter((r) => !ratedIds.has(r.gathering_id));
    if (open.length === 0) return [];

    const openIds = open.map((r) => r.gathering_id);
    const { data: others } = await supabaseAdmin
      .from("gathering_attendees")
      .select("gathering_id, user_id")
      .in("gathering_id", openIds);
    const peopleIds = [...new Set((others ?? []).map((o) => o.user_id))].filter((id) => id !== context.userId);
    const { data: profs } = peopleIds.length
      ? await supabaseAdmin.from("profiles").select("id, display_name, avatar_url").in("id", peopleIds)
      : { data: [] as Array<{ id: string; display_name: string | null; avatar_url: string | null }> };
    const profById = new Map((profs ?? []).map((p) => [p.id, p]));

    return open
      .map((r) => {
        const g = r.gatherings as unknown as {
          subject: string;
          starts_at: string;
          city: string | null;
          venue_name: string | null;
        };
        return {
          gathering_id: r.gathering_id,
          subject: g.subject,
          starts_at: g.starts_at,
          city: g.city ?? null,
          venue: g.venue_name ?? null,
          people: (others ?? [])
            .filter((o) => o.gathering_id === r.gathering_id && o.user_id !== context.userId)
            .map((o) => ({
              user_id: o.user_id,
              display_name: profById.get(o.user_id)?.display_name ?? null,
              avatar_url: profById.get(o.user_id)?.avatar_url ?? null,
            })),
        };
      })
      .sort((a, b) => (a.starts_at < b.starts_at ? 1 : -1))
      .slice(0, 3);
  });

/**
 * Stores one gathering-level rating plus optional per-person ratings.
 * RLS ("Checked-in attendees rate") is the boundary: only checked-in attendees pass.
 */
export const submitRatings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        gatheringId: z.string().uuid(),
        score: z.number().int().min(1).max(5),
        comment: z.string().trim().max(1000).optional(),
        people: z
          .array(z.object({ userId: z.string().uuid(), score: z.number().int().min(1).max(5) }))
          .max(20)
          .optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const rows = [
      {
        gathering_id: data.gatheringId,
        rater_id: context.userId,
        ratee_id: null as string | null,
        score: data.score,
        comment: data.comment && data.comment.length > 0 ? data.comment : null,
      },
      ...(data.people ?? []).map((p) => ({
        gathering_id: data.gatheringId,
        rater_id: context.userId,
        ratee_id: p.userId,
        score: p.score,
        comment: null as string | null,
      })),
    ];

    const { error } = await context.supabase.from("gathering_ratings").insert(rows);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
