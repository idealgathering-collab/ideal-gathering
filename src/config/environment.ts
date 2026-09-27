export type PublicEnvironment = Record<string, string | undefined>;

export function requireHttpUrl(value: string | undefined, name: string): string {
  if (!value?.trim()) throw new Error(`Missing environment variable: ${name}`);
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error(`${name} must be an HTTP(S) URL without credentials`);
  }
  return url.toString().replace(/\/$/, "");
}

export function publicSupabaseConfig(env: PublicEnvironment) {
  const url = requireHttpUrl(env.VITE_SUPABASE_URL, "VITE_SUPABASE_URL");
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!key) throw new Error("Missing environment variable: VITE_SUPABASE_PUBLISHABLE_KEY");
  // Reject privileged keys before Vite can publish them in browser assets.
  let role: unknown;
  if (key.split(".").length === 3) {
    try {
      role = JSON.parse(atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).role;
    } catch {
      /* Supabase validates the actual credential. */
    }
  }
  if (key.startsWith("sb_secret_") || role === "service_role") {
    throw new Error("VITE_SUPABASE_PUBLISHABLE_KEY must never contain a privileged key");
  }
  return { url, key };
}

export function oauthProvider(env: PublicEnvironment): "supabase" | "lovable" {
  const provider = env.VITE_OAUTH_PROVIDER || "supabase";
  if (provider !== "supabase" && provider !== "lovable") {
    throw new Error("VITE_OAUTH_PROVIDER must be supabase or lovable");
  }
  return provider;
}
