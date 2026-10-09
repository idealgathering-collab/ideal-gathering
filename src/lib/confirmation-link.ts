import type { Session } from "@supabase/supabase-js";
import { authLinkError, hasAuthCallback, type LinkState } from "./auth-link-state";

/** A cached session cannot stand in for the credentials in a confirmation URL. */
export function confirmationLinkState(
  url: URL,
  session: Session | null,
  error: unknown,
): LinkState {
  const failure = authLinkError(url);
  if (failure) return failure;
  if (!hasAuthCallback(url)) return "idle";
  const token = new URLSearchParams(url.hash.slice(1)).get("access_token");
  return !error && token && session?.access_token === token && session.user.email_confirmed_at
    ? "valid"
    : "invalid";
}
