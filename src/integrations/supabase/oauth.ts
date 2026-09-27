import { oauthProvider } from "@/config/environment";
import { supabase } from "./client";

export async function signInWithGoogle(redirectTo: string) {
  if (oauthProvider({ VITE_OAUTH_PROVIDER: import.meta.env.VITE_OAUTH_PROVIDER }) === "lovable") {
    const { lovable } = await import("../lovable");
    return lovable.auth.signInWithOAuth("google", { redirect_uri: redirectTo });
  }
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  return { error, redirected: Boolean(data.url) && !error };
}
