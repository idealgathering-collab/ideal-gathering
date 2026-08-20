import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type BlockedPerson = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type RoomMessage = {
  id: string;
  gathering_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export const REPORT_REASONS = ["harassment", "spam", "unsafe", "noshow", "other"] as const;

/** Ids the caller has blocked, plus ids that have blocked the caller. Server-only. */
async function blockPairIds(userId: string): Promise<string[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_blocks")
    .select("blocker_id, blocked_id")
    .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
  const ids = new Set<string>();
  for (const row of data ?? []) {
    ids.add(row.blocker_id === userId ? row.blocked_id : row.blocker_id);
  }
  ids.delete(userId);
  return [...ids];
}

export const listMyBlocks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BlockedPerson[]> => {
    const { data, error } = await context.supabase
      .from("user_blocks")
      .select("blocked_id, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    if (rows.length === 0) return [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in(
        "id",
        rows.map((r) => r.blocked_id),
      );
    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
    return rows.map((r) => ({
      user_id: r.blocked_id,
      display_name: byId.get(r.blocked_id)?.display_name ?? null,
      avatar_url: byId.get(r.blocked_id)?.avatar_url ?? null,
      created_at: r.created_at,
    }));
  });

export const blockUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    if (data.userId === context.userId) throw new Error("Cannot block yourself");
    const { error } = await context.supabase
      .from("user_blocks")
      .upsert({ blocker_id: context.userId, blocked_id: data.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const unblockUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("user_blocks")
      .delete()
      .eq("blocker_id", context.userId)
      .eq("blocked_id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const submitReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        targetType: z.enum(["user", "gathering"]),
        targetId: z.string().uuid(),
        targetUserId: z.string().uuid().nullable().optional(),
        gatheringId: z.string().uuid().nullable().optional(),
        reason: z.enum(REPORT_REASONS),
        details: z.string().max(500).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    if (data.targetUserId && data.targetUserId === context.userId) {
      throw new Error("Cannot report yourself");
    }
    const { error } = await context.supabase.from("reports").insert({
      reporter_id: context.userId,
      target_type: data.targetType,
      target_id: data.targetId,
      target_user_id: data.targetUserId ?? null,
      gathering_id: data.gatheringId ?? null,
      reason: data.reason,
      details: data.details?.trim() || null,
    });
    // A duplicate open report is treated as success: the reporter learns nothing
    // extra and the queue stays clean.
    if (error && error.code !== "23505") throw new Error(error.message);
    return { ok: true };
  });

/**
 * Chat messages for a room with block pairs removed in BOTH directions.
 * Reverse blocks can't be read in the browser (RLS hides them), so the
 * filtering has to happen here.
 */
export const listGatheringMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ gatheringId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<{ messages: RoomMessage[]; hiddenUserIds: string[] }> => {
    const hidden = await blockPairIds(context.userId);
    const { data: rows, error } = await context.supabase
      .from("gathering_messages")
      .select("id, gathering_id, sender_id, body, created_at")
      .eq("gathering_id", data.gatheringId)
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) throw new Error(error.message);
    const hiddenSet = new Set(hidden);
    return {
      messages: ((rows ?? []) as RoomMessage[]).filter((m) => !hiddenSet.has(m.sender_id)),
      hiddenUserIds: hidden,
    };
  });

export type AdminReportRow = {
  id: string;
  reporter_id: string;
  target_type: "user" | "gathering";
  target_id: string;
  target_user_id: string | null;
  gathering_id: string | null;
  reason: string;
  details: string | null;
  status: "open" | "resolved" | "dismissed";
  admin_note: string | null;
  created_at: string;
  reporter_name: string | null;
  target_name: string | null;
  gathering_subject: string | null;
};

export const listReports = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ status: z.enum(["open", "resolved", "dismissed"]) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<AdminReportRow[]> => {
    const { data: adminRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRow) throw new Error("Forbidden");

    const { data: rows, error } = await context.supabase
      .from("reports")
      .select(
        "id, reporter_id, target_type, target_id, target_user_id, gathering_id, reason, details, status, admin_note, created_at",
      )
      .eq("status", data.status)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    const list = rows ?? [];
    if (list.length === 0) return [];

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userIds = new Set<string>();
    for (const r of list) {
      userIds.add(r.reporter_id);
      if (r.target_user_id) userIds.add(r.target_user_id);
    }
    const gatheringIds = list.map((r) => r.gathering_id).filter(Boolean) as string[];

    const [{ data: profiles }, { data: gatherings }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, display_name").in("id", [...userIds]),
      gatheringIds.length
        ? supabaseAdmin.from("gatherings").select("id, subject").in("id", gatheringIds)
        : Promise.resolve({ data: [] as Array<{ id: string; subject: string }> }),
    ]);
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));
    const subjById = new Map((gatherings ?? []).map((g) => [g.id, g.subject]));

    return list.map((r) => ({
      ...r,
      reporter_name: nameById.get(r.reporter_id) ?? null,
      target_name: r.target_user_id ? (nameById.get(r.target_user_id) ?? null) : null,
      gathering_subject: r.gathering_id ? (subjById.get(r.gathering_id) ?? null) : null,
    })) as AdminReportRow[];
  });

export const setReportStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["resolved", "dismissed"]),
        note: z.string().max(500).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: adminRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRow) throw new Error("Forbidden");
    const { error } = await context.supabase
      .from("reports")
      .update({
        status: data.status,
        admin_note: data.note?.trim() || null,
        resolved_at: new Date().toISOString(),
        resolved_by: context.userId,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
