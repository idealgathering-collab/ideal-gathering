import { supabase } from "@/integrations/supabase/client";

export type Invitation = {
  id: string;
  code: string;
  email: string | null;
  note: string | null;
  status: string;
  created_at: string;
  expires_at: string | null;
  redeemed_at: string | null;
  redeemed_by: string | null;
};

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusable characters

export function generateInviteCode(): string {
  const pick = (n: number) =>
    Array.from({ length: n }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");
  return `IG-${pick(4)}-${pick(4)}`;
}

export async function getBetaLaunched(): Promise<boolean> {
  const { data, error } = await supabase.from("app_config").select("beta_launched").maybeSingle();
  if (error) throw new Error(error.message);
  return data?.beta_launched === true;
}

/** Admin only — the database rejects this for anyone else. */
export async function setBetaLaunched(on: boolean): Promise<void> {
  const { error } = await supabase
    .from("app_config")
    .update({ beta_launched: on, launched_at: on ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
    .eq("id", true);
  if (error) throw new Error(error.message);
}

export async function listInvitations(): Promise<Invitation[]> {
  const { data, error } = await supabase
    .from("invitations")
    .select("id, code, email, note, status, created_at, expires_at, redeemed_at, redeemed_by")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as Invitation[];
}

export async function createInvitation(input: { email?: string | null; note?: string | null }): Promise<Invitation> {
  const { data: session } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("invitations")
    .insert({
      code: generateInviteCode(),
      email: input.email?.trim() || null,
      note: input.note?.trim() || null,
      created_by: session.user?.id ?? null,
    })
    .select("id, code, email, note, status, created_at, expires_at, redeemed_at, redeemed_by")
    .single();
  if (error) throw new Error(error.message);
  return data as Invitation;
}

export async function revokeInvitation(id: string): Promise<void> {
  const { error } = await supabase.from("invitations").update({ status: "revoked" }).eq("id", id);
  if (error) throw new Error(error.message);
}

export type WaitlistEntry = {
  id: string;
  name: string;
  email: string;
  city: string | null;
  interests: string | null;
  created_at: string;
};

export async function listWaitlist(): Promise<WaitlistEntry[]> {
  const { data, error } = await supabase
    .from("waitlist")
    .select("id, name, email, city, interests, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as WaitlistEntry[];
}
