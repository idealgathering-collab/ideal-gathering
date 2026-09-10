import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertOwner(context: any) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "owner")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export type OwnerVenuePreview = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  cover_url: string | null;
  phone: string | null;
  mobile: string | null;
  menu_link: string | null;
  status: string;
  created_at: string;
  venue_tables: Array<{ id: string; label: string; capacity: number }>;
};

export const listOwnerVenuePreviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OwnerVenuePreview[]> => {
    await assertOwner(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("businesses")
      .select("id, name, description, address, city, cover_url, phone, mobile, menu_link, status, created_at, venue_tables(id,label,capacity)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as OwnerVenuePreview[];
  });
