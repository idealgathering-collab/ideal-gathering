import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AttendanceRow = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  joined_at: string;
  checked_in_at: string | null;
  checked_out_at: string | null;
};

export type AttendanceRoster = {
  canMark: boolean;
  windowOpen: boolean;
  starts_at: string;
  attendees: AttendanceRow[];
};

export type HostAttendanceSummary = {
  gathering_id: string;
  subject: string;
  starts_at: string;
  joined: number;
  attended: number;
};

/** Minutes before starts_at when marking becomes possible (mirrors the DB trigger). */
export const CHECKIN_OPENS_MINUTES_BEFORE = 30;
/** Hours after the gathering ends when marking closes (mirrors the DB trigger). */
export const CHECKIN_CLOSES_HOURS_AFTER = 24;

export function checkinWindow(startsAt: string, endsAt?: string | null) {
  const start = new Date(startsAt).getTime();
  const end = endsAt ? new Date(endsAt).getTime() : start + 2 * 60 * 60 * 1000;
  return {
    opensAt: start - CHECKIN_OPENS_MINUTES_BEFORE * 60 * 1000,
    closesAt: end + CHECKIN_CLOSES_HOURS_AFTER * 60 * 60 * 1000,
  };
}

/** Maps a Postgres error message from the attendance guard trigger to a stable reason code. */
export function classifyAttendanceError(message: string):
  | "too_early"
  | "window_closed"
  | "closed"
  | "forbidden"
  | "unknown" {
  if (message.includes("CHECKIN_TOO_EARLY")) return "too_early";
  if (message.includes("CHECKIN_WINDOW_CLOSED")) return "window_closed";
  if (message.includes("GATHERING_CLOSED")) return "closed";
  if (/forbidden|permission|row-level/i.test(message)) return "forbidden";
  return "unknown";
}

export const listAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ gatheringId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<AttendanceRoster> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: g, error: gErr } = await supabaseAdmin
      .from("gatherings")
      .select("id, host_id, starts_at, ends_at, status")
      .eq("id", data.gatheringId)
      .maybeSingle();
    if (gErr) throw new Error(gErr.message);
    if (!g) throw new Error("Not found");

    const { data: adminRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    const isAdmin = !!adminRow;
    const isHost = g.host_id === context.userId;
    if (!isHost && !isAdmin) throw new Error("Forbidden");

    const { data: rows, error } = await supabaseAdmin
      .from("gathering_attendees")
      .select("user_id, joined_at, checked_in_at")
      .eq("gathering_id", data.gatheringId)
      .order("joined_at", { ascending: true });
    if (error) throw new Error(error.message);

    const list = rows ?? [];
    const nameById = new Map<string, { display_name: string | null; avatar_url: string | null }>();
    if (list.length > 0) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in(
          "id",
          list.map((r) => r.user_id),
        );
      for (const p of profs ?? []) {
        nameById.set(p.id, { display_name: p.display_name, avatar_url: p.avatar_url });
      }
    }

    const { opensAt, closesAt } = checkinWindow(g.starts_at, g.ends_at);
    const now = Date.now();
    const open = now >= opensAt && now <= closesAt && g.status !== "cancelled" && g.status !== "rejected";

    return {
      canMark: (isHost || isAdmin) && open,
      windowOpen: now >= opensAt,
      starts_at: g.starts_at,
      attendees: list.map((r) => ({
        user_id: r.user_id,
        display_name: nameById.get(r.user_id)?.display_name ?? null,
        avatar_url: nameById.get(r.user_id)?.avatar_url ?? null,
        joined_at: r.joined_at,
        checked_in_at: r.checked_in_at,
      })),
    };
  });

export const setAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        gatheringId: z.string().uuid(),
        userId: z.string().uuid(),
        present: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<{ checked_in_at: string | null }> => {
    // RLS ("Hosts mark attendance" + the admin policy) and the DB trigger are the
    // real boundary here: they decide who may write and within which time window.
    const { data: row, error } = await context.supabase
      .from("gathering_attendees")
      .update({ checked_in_at: data.present ? new Date().toISOString() : null })
      .eq("gathering_id", data.gatheringId)
      .eq("user_id", data.userId)
      .select("checked_in_at")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Forbidden");
    return { checked_in_at: row.checked_in_at };
  });

export const listHostAttendanceSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<HostAttendanceSummary[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cutoff = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabaseAdmin
      .from("gatherings")
      .select("id, subject, starts_at, gathering_attendees(user_id, checked_in_at)")
      .eq("host_id", context.userId)
      .lt("starts_at", cutoff)
      .neq("status", "rejected")
      .order("starts_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return (data ?? []).map((g) => {
      const rows = (g.gathering_attendees ?? []) as Array<{ checked_in_at: string | null }>;
      return {
        gathering_id: g.id,
        subject: g.subject,
        starts_at: g.starts_at,
        joined: rows.length,
        attended: rows.filter((r) => r.checked_in_at).length,
      };
    });
  });
