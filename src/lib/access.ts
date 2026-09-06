import { supabase } from "@/integrations/supabase/client";

export type UserAccessStatus = "waitlisted" | "invited" | "registered" | "onboarded" | "active";
export type BusinessStatus = "pending" | "approved" | "rejected";

export type AccessState = {
  betaLaunched: boolean;
  isAdmin: boolean;
  isVenue: boolean;
  userStatus: UserAccessStatus | null;
  onboarded: boolean;
  hasBusiness: boolean;
  businessStatus: BusinessStatus | null;
  /** May use the member product (explore, join, chat…). */
  hasProductAccess: boolean;
  /** May use the venue portal tools (tables, menu, activating gatherings). */
  hasVenueAccess: boolean;
};

const INVITE_KEY = "ig.pendingInvite";

export function rememberInvite(code: string) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(INVITE_KEY, code.trim().toUpperCase());
}

export function readInvite(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(INVITE_KEY);
}

export function clearInvite() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(INVITE_KEY);
}

export function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

/** Public: is the beta open for everyone yet? */
export async function isBetaLaunched(): Promise<boolean> {
  const { data } = await supabase.rpc("is_beta_launched");
  return data === true;
}

/** Public: does this invitation code exist and is it still usable? */
export async function checkInvitation(code: string): Promise<boolean> {
  const value = normalizeCode(code);
  if (!value) return false;
  const { data, error } = await supabase.rpc("check_invitation", { _code: value });
  if (error) return false;
  return data === true;
}

/** Signed in: consume the invitation for the current account. */
export async function redeemInvitation(code: string): Promise<boolean> {
  const value = normalizeCode(code);
  if (!value) return false;
  const { data, error } = await supabase.rpc("redeem_invitation", { _code: value });
  if (error) return false;
  return data === true;
}

/** Redeem an invitation kept from before sign-up, if any. */
export async function redeemPendingInvite(): Promise<void> {
  const code = readInvite();
  if (!code) return;
  const ok = await redeemInvitation(code);
  if (ok) clearInvite();
}

export async function fetchAccessState(userId: string): Promise<AccessState> {
  const [launchedRes, rolesRes, profileRes, bizRes] = await Promise.all([
    supabase.rpc("is_beta_launched"),
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase.from("profiles").select("access_status, onboarded_at").eq("id", userId).maybeSingle(),
    supabase.from("businesses").select("status").eq("owner_id", userId).limit(1),
  ]);

  const betaLaunched = launchedRes.data === true;
  const roles = new Set((rolesRes.data ?? []).map((r) => r.role as string));
  const isAdmin = roles.has("admin");
  const isVenue = roles.has("venue");
  const userStatus = (profileRes.data?.access_status as UserAccessStatus | undefined) ?? null;
  const onboarded = !!profileRes.data?.onboarded_at;
  const business = (bizRes.data ?? [])[0] as { status: BusinessStatus } | undefined;

  const memberReady = userStatus === "onboarded" || userStatus === "active";

  return {
    betaLaunched,
    isAdmin,
    isVenue,
    userStatus,
    onboarded,
    hasBusiness: !!business,
    businessStatus: business?.status ?? null,
    hasProductAccess: isAdmin || (betaLaunched && memberReady),
    hasVenueAccess: isAdmin || (betaLaunched && business?.status === "approved"),
  };
}
