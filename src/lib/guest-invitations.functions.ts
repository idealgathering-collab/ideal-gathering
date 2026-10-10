import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { hostGuestRow } from "./guest-invitations";

export const createGuestInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    id: z.string().uuid(), label: z.string().trim().min(1).max(80), days: z.union([z.literal(1),z.literal(3),z.literal(7)]),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const { randomBytes, createHash } = await import("node:crypto");
    const token = randomBytes(32).toString("base64url");
    const { data: result, error } = await context.supabase.rpc("manage_guest_invitation", {
      _id: data.id, _action: "create", _hash: createHash("sha256").update(token).digest("hex"), _label: data.label, _days: data.days,
    });
    if (error) throw new Error(error.message.includes("GUEST_RATE_LIMIT") ? "limited" : "failed");
    const saved = z.object({ id: z.string().uuid(), expires_at: z.string() }).parse(result);
    return { ...saved, token };
  });

export const manageGuestInvitations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.discriminatedUnion("action", [
    z.object({ id: z.string().uuid(), action: z.literal("list") }),
    z.object({ id: z.string().uuid(), action: z.literal("revoke"), invitation: z.string().uuid() }),
  ]).parse(v))
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("manage_guest_invitation", {
      _id: data.id, _action: data.action, ...(data.action === "revoke" ? { _invite: data.invitation } : {}),
    });
    if (error) throw new Error("failed");
    return data.action === "list" ? z.array(hostGuestRow).parse(result) : [];
  });
