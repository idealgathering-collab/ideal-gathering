import { supabase } from "@/integrations/supabase/client";

export type GatheringCard = {
  id: string;
  subject: string;
  description: string | null;
  starts_at: string;
  seats: number;
  venue_name: string;
  neighborhood: string;
  business: { id: string; name: string; city: string | null; cover_url: string | null } | null;
  table: { id: string; label: string } | null;
  attendee_count: number;
};

export async function fetchApprovedGatherings(): Promise<GatheringCard[]> {
  const { data, error } = await supabase
    .from("gatherings")
    .select(
      "id, subject, description, starts_at, seats, venue_name, neighborhood, business:businesses(id,name,city,cover_url), table:venue_tables(id,label), gathering_attendees(user_id)"
    )
    .eq("status", "approved")
    .gte("starts_at", new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString())
    .order("starts_at", { ascending: true })
    .limit(60);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    subject: row.subject,
    description: row.description,
    starts_at: row.starts_at,
    seats: row.seats,
    venue_name: row.venue_name ?? "",
    neighborhood: row.neighborhood ?? "",
    business: row.business as GatheringCard["business"],
    table: row.table as GatheringCard["table"],
    attendee_count: (row.gathering_attendees as Array<unknown> | null)?.length ?? 0,
  }));
}

export async function fetchGathering(id: string) {
  const { data, error } = await supabase
    .from("gatherings")
    .select(
      "id, subject, description, starts_at, seats, status, host_id, venue_name, neighborhood, business:businesses(id,name,city,address,cover_url), table:venue_tables(id,label,capacity), gathering_attendees(user_id)"
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function joinGathering(gatheringId: string, userId: string) {
  const { error } = await supabase
    .from("gathering_attendees")
    .insert({ gathering_id: gatheringId, user_id: userId });
  if (error) throw error;
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

