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

export type PublicGathering = {
  id: string;
  subject: string;
  description: string | null;
  starts_at: string;
  seats: number;
  status: string;
  venue_name: string | null;
  neighborhood: string | null;
  gathering_type: string | null;
  attendee_count: number;
  business: {
    id: string;
    name: string;
    city: string | null;
    address: string | null;
    cover_url: string | null;
  } | null;
};

const PUBLIC_GATHERING_COLS =
  "id, subject, description, starts_at, seats, status, venue_name, neighborhood, gathering_type, business:businesses(id,name,city,address,cover_url), gathering_attendees(user_id)";

type RawGathering = Record<string, unknown>;

function toPublicGathering(row: RawGathering): PublicGathering {
  return {
    id: row.id as string,
    subject: row.subject as string,
    description: (row.description as string | null) ?? null,
    starts_at: row.starts_at as string,
    seats: row.seats as number,
    status: row.status as string,
    venue_name: (row.venue_name as string | null) ?? null,
    neighborhood: (row.neighborhood as string | null) ?? null,
    gathering_type: (row.gathering_type as string | null) ?? null,
    attendee_count: (row.gathering_attendees as Array<unknown> | null)?.length ?? 0,
    business: (row.business as PublicGathering["business"]) ?? null,
  };
}

/** Public, unauthenticated read of a single approved gathering (metadata only). */
export const getPublicGathering = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<PublicGathering | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("gatherings")
      .select(PUBLIC_GATHERING_COLS)
      .eq("id", data.id)
      .eq("status", "approved")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? toPublicGathering(row as RawGathering) : null;
  });

/** Upcoming approved gatherings, used to build the sitemap. */
export const listSitemapGatherings = createServerFn({ method: "GET" }).handler(
  async (): Promise<Array<{ id: string; starts_at: string }>> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("gatherings")
      .select("id, starts_at")
      .eq("status", "approved")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(2000);
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<{ id: string; starts_at: string }>;
  },
);
