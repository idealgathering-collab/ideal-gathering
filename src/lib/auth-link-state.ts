export type LinkState = "idle" | "checking" | "valid" | "expired" | "invalid";

/** Read both Supabase query and fragment errors; never show provider text. */
export function authLinkError(url: URL): "expired" | "invalid" | null {
  const hash = new URLSearchParams(url.hash.slice(1));
  const value = (key: string) => url.searchParams.get(key) ?? hash.get(key);
  if (!value("error") && !value("error_code") && !value("error_description")) return null;
  return value("error_code") === "otp_expired" ? "expired" : "invalid";
}

export function hasAuthCallback(url: URL): boolean {
  const hash = new URLSearchParams(url.hash.slice(1));
  return Boolean(url.searchParams.get("code") || hash.get("access_token") || hash.get("type"));
}

/** Remove credentials/error data while retaining route, language and invite target. */
export function cleanAuthLink(url: URL): string {
  const clean = new URL(url);
  for (const key of ["code", "token_hash", "type", "error", "error_code", "error_description"]) {
    clean.searchParams.delete(key);
  }
  clean.hash = "";
  return clean.pathname + clean.search;
}
