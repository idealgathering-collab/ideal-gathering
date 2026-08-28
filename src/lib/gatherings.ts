import { supabase } from "@/integrations/supabase/client";
import { JoinError, classifyJoinError } from "@/lib/join-errors";


export type GatheringCard = {
  id: string;
  subject: string;
  description: string | null;
  starts_at: string;
  seats: number;
  venue_name: string;
  neighborhood: string;
  city: string | null;
  gathering_type?: string | null;
  lat?: number | null;
  lng?: number | null;
  business: {
    id: string;
    name: string;
    city: string | null;
    cover_url: string | null;
    lat?: number | null;
    lng?: number | null;
  } | null;
  table: { id: string; label: string } | null;
  attendee_count: number;
};

/** Best-known coordinates for a gathering: its own pin, else its venue. */
export function gatheringCoords(g: GatheringCard): { lat: number; lng: number } | null {
  if (typeof g.lat === "number" && typeof g.lng === "number") return { lat: g.lat, lng: g.lng };
  const b = g.business;
  if (b && typeof b.lat === "number" && typeof b.lng === "number") return { lat: b.lat, lng: b.lng };
  return null;
}


/** Gatherings that start now or later (with a small grace window for in-progress ones). */
function upcomingCutoff() {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
}

/**
 * Approved upcoming gatherings. Pass a city to scope the feed to one market;
 * pass null/undefined to browse every city.
 */
export async function fetchApprovedGatherings(city?: string | null, gatheringType?: string | null): Promise<GatheringCard[]> {
  let query = supabase
    .from("gatherings")
    .select(
      "id, subject, description, starts_at, seats, venue_name, neighborhood, city, lat, lng, gathering_type, business:businesses(id,name,city,cover_url,lat,lng), table:venue_tables(id,label), gathering_attendees(user_id)"
    )
    .eq("status", "approved")
    .gte("starts_at", upcomingCutoff());
  if (city) query = query.eq("city", city);
  if (gatheringType) query = query.eq("gathering_type", gatheringType);
  const { data, error } = await query.order("starts_at", { ascending: true }).limit(60);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    subject: row.subject,
    description: row.description,
    starts_at: row.starts_at,
    seats: row.seats,
    venue_name: row.venue_name ?? "",
    neighborhood: row.neighborhood ?? "",
    city: row.city ?? null,
    gathering_type: (row as { gathering_type?: string | null }).gathering_type ?? null,
    lat: (row as { lat?: number | null }).lat ?? null,
    lng: (row as { lng?: number | null }).lng ?? null,
    business: row.business as GatheringCard["business"],
    table: row.table as GatheringCard["table"],
    attendee_count: (row.gathering_attendees as Array<unknown> | null)?.length ?? 0,
  }));
}

/** Distinct cities that currently have approved, upcoming gatherings. */
export async function fetchGatheringCities(): Promise<string[]> {
  const { data, error } = await supabase
    .from("gatherings")
    .select("city")
    .eq("status", "approved")
    .gte("starts_at", upcomingCutoff())
    .not("city", "is", null);
  if (error) throw error;
  const set = new Set<string>();
  for (const row of data ?? []) {
    const c = (row.city ?? "").trim();
    if (c) set.add(c);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export async function fetchGathering(id: string) {
  const { data, error } = await supabase
    .from("gatherings")
    .select(
      "id, subject, description, starts_at, ends_at, seats, status, host_id, venue_name, neighborhood, gathering_type, business:businesses(id,name,city,address,cover_url), table:venue_tables(id,label,capacity), gathering_attendees(user_id)"
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export { JoinError, classifyJoinError } from "@/lib/join-errors";
export type { JoinFailureReason } from "@/lib/join-errors";


export async function joinGathering(gatheringId: string, userId: string) {
  const { error } = await supabase
    .from("gathering_attendees")
    .insert({ gathering_id: gatheringId, user_id: userId });
  if (error) throw new JoinError(classifyJoinError(error), error.message);
}


export async function leaveGathering(gatheringId: string, userId: string) {
  const { error } = await supabase
    .from("gathering_attendees")
    .delete()
    .eq("gathering_id", gatheringId)
    .eq("user_id", userId);
  if (error) throw error;
}

export function formatDateTime(iso: string, lang?: "en" | "tr" | "fa") {
  const d = new Date(iso);
  return d.toLocaleString(lang, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

