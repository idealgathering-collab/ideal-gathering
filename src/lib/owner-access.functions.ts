import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertOwner } from "@/lib/platform-authorization";

export const adminAccessChangeSchema = z
  .object({
    userId: z.string().uuid(),
    action: z.enum(["grant", "restrict", "restore", "remove"]),
  })
  .strict();

export const verifyOwnerAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context);
    return { userId: context.userId };
  });

export const listAdminAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context);
    const { data, error } = await context.supabase.rpc("list_admin_access");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const changeAdminAccess = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => adminAccessChangeSchema.parse(input))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await assertOwner(context);
    // Caller-scoped RPC rechecks Owner authority inside the transaction.
    const { error } = await context.supabase.rpc("manage_admin_access", {
      _user_id: data.userId,
      _action: data.action,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
