import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type PublicBusiness = {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  address: string | null;
  cover_url: string | null;
  menu_link: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
};

export type PublicProfile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

const SAFE_BIZ_COLS =
  "id, name, description, city, address, cover_url, menu_link, lat, lng, created_at";

export const listApprovedBusinesses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<PublicBusiness[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("businesses")
      .select(SAFE_BIZ_COLS)
      .eq("status", "approved")
      .order("name");
    if (error) throw new Error(error.message);
    return (data ?? []) as PublicBusiness[];
  });

export const getApprovedBusiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<PublicBusiness | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("businesses")
      .select(SAFE_BIZ_COLS)
      .eq("status", "approved")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row as PublicBusiness | null) ?? null;
  });

export const getPublicProfiles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ ids: z.array(z.string().uuid()) }).parse(d),
  )
  .handler(async ({ data }): Promise<PublicProfile[]> => {
    if (data.ids.length === 0) return [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    return (rows ?? []) as PublicProfile[];
  });
