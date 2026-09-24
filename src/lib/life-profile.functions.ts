import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** A bounded own-profile snapshot. The existing context RPC authorizes each
 * completed gathering (including blocks, beta access and checked-in attendance).
 * Never use the old card's booking-based story as proof of participation. */
export const loadOwnLifeGatherings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value: unknown) => z.object({}).strict().parse(value))
  .handler(async ({ context }) => {
    const now = new Date().toISOString();
    const [hosted, joined] = await Promise.all([
      context.supabase
        .from("gatherings")
        .select("id, starts_at")
        .eq("host_id", context.userId)
        .eq("status", "approved")
        .lte("starts_at", now)
        .order("starts_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(12),
      context.supabase
        .from("gatherings")
        .select("id, starts_at, gathering_attendees!inner(user_id)")
        .eq("gathering_attendees.user_id", context.userId)
        .eq("status", "approved")
        .lte("starts_at", now)
        .order("starts_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(12),
    ]);
    if (hosted.error || joined.error) throw new Error("Gatherings unavailable");
    const ids = [...new Set([...(hosted.data ?? []), ...(joined.data ?? [])].map((g) => g.id))];
    const rows = await Promise.all(
      ids.map(async (id) => {
        const result = await context.supabase.rpc("get_gathering_moment_context", {
          _gathering_id: id,
        });
        if (result.error) throw new Error("Gatherings unavailable");
        return result.data?.[0] ?? null;
      }),
    );
    return rows
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .sort((a, b) => b.happened_at.localeCompare(a.happened_at) || b.id.localeCompare(a.id));
  });
