import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type AuthContext = { supabase: SupabaseClient<Database>; userId: string };

/** Uses the caller's token and current database grants, never cached role claims. */
export async function hasPlatformOperations(context: AuthContext): Promise<boolean> {
  const { data, error } = await context.supabase.rpc("has_platform_permission", {
    _permission: "platform_operations",
  });
  if (error) throw new Error("Could not verify platform access");
  return data === true;
}

export async function assertPlatformOperations(context: AuthContext): Promise<void> {
  if (!(await hasPlatformOperations(context))) throw new Error("Forbidden");
}

export async function assertOwner(context: AuthContext): Promise<void> {
  const { data, error } = await context.supabase.rpc("is_owner", { _user_id: context.userId });
  if (error || data !== true) throw new Error("Forbidden");
}
