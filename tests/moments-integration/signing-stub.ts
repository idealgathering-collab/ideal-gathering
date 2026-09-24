// Test-only boundary: never resolve a hosted service client from concurrent imports.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
export let supabaseAdmin: SupabaseClient<Database>;
export function setSigningClient(client: SupabaseClient<Database>) {
  supabaseAdmin = client;
}
