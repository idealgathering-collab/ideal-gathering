import { createClient } from "@supabase/supabase-js";
import { publicSupabaseConfig } from "@/config/environment";
import { createPasswordRecovery } from "@/lib/password-recovery";

// Recovery never reads or changes the ordinary browser session's storage.
let client: ReturnType<typeof createClient> | undefined;
let flow: ReturnType<typeof createPasswordRecovery> | undefined;

export function recoveryClient() {
  if (!client) {
    const { url, key } = publicSupabaseConfig(import.meta.env);
    client = createClient(url, key, {
      auth: {
        flowType: "pkce",
        storageKey: "havato-password-recovery",
        persistSession: true,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (
            key.startsWith("sb_publishable_") &&
            headers.get("Authorization") === `Bearer ${key}`
          ) {
            headers.delete("Authorization");
          }
          return fetch(input, { ...init, headers });
        },
      },
    });
  }
  return client;
}

export function passwordRecovery() {
  flow ??= createPasswordRecovery(recoveryClient().auth);
  return flow;
}
