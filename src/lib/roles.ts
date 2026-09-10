import { supabase } from "@/integrations/supabase/client";

const PREVIEW_KEY = "ig.adminPreview";

export function setAdminPreview(on: boolean) {
  if (typeof sessionStorage === "undefined") return;
  if (on) sessionStorage.setItem(PREVIEW_KEY, "1");
  else sessionStorage.removeItem(PREVIEW_KEY);
}

export function isAdminPreview() {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(PREVIEW_KEY) === "1";
}

export async function fetchRoles(userId: string): Promise<Set<string>> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return new Set((data ?? []).map((r) => r.role as string));
}

export async function claimInitialOwner(): Promise<boolean> {
  const { data, error } = await (supabase as any).rpc("claim_initial_owner");
  if (error) throw new Error(error.message);
  return data === true;
}

/** Default home for this account. Owners land on /owner, admins on /admin. */
export async function homePathForUser(userId: string, redirect?: string): Promise<string> {
  const { fetchAccessState } = await import("@/lib/access");
  const access = await fetchAccessState(userId);
  if (access.isOwner && !isAdminPreview()) return "/owner";
  if (access.isAdmin && !isAdminPreview()) return "/admin";
  if (access.isVenue && !access.isAdmin && !access.isOwner) return "/venue/dashboard";
  if (!access.hasProductAccess) return access.onboarded ? "/pending" : "/onboarding";
  if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) return redirect;
  return "/dashboard";
}
