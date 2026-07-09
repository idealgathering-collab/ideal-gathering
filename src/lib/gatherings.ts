import { supabase } from "@/integrations/supabase/client";

export type GatheringCard = {
  id: string;
  subject: string;
  description: string | null;
  starts_at: string;
  seats: number;
  business: { id: string; name: string; city: string | null; cover_url: string | null } | null;
  table: { id: string; label: string } | null;
  attendee_count: number;
};

export async function fetchApprovedGatherings(): Promise<GatheringCard[]> {
  const { data, error } = await supabase
    .from("gatherings")
    .select(
      "id, subject, description, starts_at, seats, business:businesses(id,name,city,cover_url), table:venue_tables(id,label), gathering_attendees(user_id)"
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
    business: row.business as GatheringCard["business"],
    table: row.table as GatheringCard["table"],
    attendee_count: (row.gathering_attendees as Array<unknown> | null)?.length ?? 0,
  }));
}

export async function fetchGathering(id: string) {
  const { data, error } = await supabase
    .from("gatherings")
    .select(
      "id, subject, description, starts_at, seats, status, host_id, business:businesses(id,name,city,address,cover_url), table:venue_tables(id,label,capacity), gathering_attendees(user_id)"
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
