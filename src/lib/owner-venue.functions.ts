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
  owner_id?: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  lat?: number | null;
  lng?: number | null;
  street_number?: string | null;
  description_extra?: string | null;
  cover_url: string | null;
  phone: string | null;
  mobile: string | null;
  menu_link: string | null;
  status: string;
  created_at: string;
  venue_tables: Array<{ id: string; label: string; capacity: number }>;
};

const PREVIEW_SELECT =
  "id, owner_id, name, description, address, city, lat, lng, street_number, description_extra, cover_url, phone, mobile, menu_link, status, created_at, venue_tables(id,label,capacity)";

export const listOwnerVenuePreviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OwnerVenuePreview[]> => {
    await assertOwner(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("businesses")
      .select(PREVIEW_SELECT)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as OwnerVenuePreview[];
  });

export const getOwnerVenuePreview = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => {
    const id = (input as { id?: string })?.id;
    if (!id) throw new Error("Venue id required");
    return { id };
  })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<OwnerVenuePreview | null> => {
    await assertOwner(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("businesses")
      .select(PREVIEW_SELECT)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row ?? null) as unknown as OwnerVenuePreview | null;
  });
