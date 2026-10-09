import type { Session } from "@supabase/supabase-js";
import { authLinkError, type LinkState } from "./auth-link-state";

type RecoveryAuth = {
  exchangeCodeForSession: (code: string) => Promise<{
    data: { session: Session | null; redirectType?: string | null };
    error: { code?: string } | null;
  }>;
  getSession: () => Promise<{ data: { session: Session | null }; error: unknown }>;
  updateUser: (attributes: { password: string }) => Promise<{ error: unknown }>;
  signOut: (options: { scope: "local" | "global" }) => Promise<{ error: unknown }>;
};

/** A fresh code exchange on the isolated PKCE client is the only grant source. */
export function createPasswordRecovery(auth: RecoveryAuth, now = () => Date.now()) {
  let grant: { userId: string; accessToken: string; expiresAt: number } | null = null;
  let pending: { code: string; result: Promise<LinkState> } | null = null;
  let saving = false;
  let generation = 0;

  async function exchange(code: string, attempt: number): Promise<LinkState> {
    grant = null;
    try {
      const { data, error } = await auth.exchangeCodeForSession(code);
      if (attempt !== generation) return "invalid";
      if (error || !data.session || data.redirectType !== "recovery") {
        await auth.signOut({ scope: "local" });
        return error?.code === "otp_expired" || error?.code === "flow_state_expired"
          ? "expired"
          : "invalid";
      }
      const expiresAt = Math.min((data.session.expires_at ?? 0) * 1000, now() + 15 * 60 * 1000);
      if (expiresAt <= now()) return "expired";
      grant = { userId: data.session.user.id, accessToken: data.session.access_token, expiresAt };
      return "valid";
    } catch {
      return "invalid";
    }
  }

  return {
    open(url: URL): Promise<LinkState> {
      const error = authLinkError(url);
      const code = url.searchParams.get("code");
      if (error || !code) {
        generation++;
        grant = null;
        pending = null;
        return Promise.resolve(error ?? "invalid");
      }
      // React effect replay must not consume a one-time code twice.
      if (pending?.code === code) return pending.result;
      pending = { code, result: exchange(code, ++generation) };
      return pending.result;
    },
    async updatePassword(password: string) {
      if (saving || !grant || grant.expiresAt <= now()) throw new Error("recovery_required");
      saving = true;
      const authorization = grant;
      try {
        const { data, error } = await auth.getSession();
        if (
          error ||
          grant !== authorization ||
          !data.session ||
          data.session.user.id !== authorization.userId ||
          data.session.access_token !== authorization.accessToken ||
          authorization.expiresAt <= now()
        ) {
          grant = null;
          throw new Error("recovery_required");
        }
        const result = await auth.updateUser({ password });
        if (result.error) throw result.error;
        grant = null;
        pending = null;
        // Revoke sessions after the password is saved. Local cleanup is best effort.
        let signedOut = false;
        try {
          signedOut = !(await auth.signOut({ scope: "global" })).error;
        } catch {
          /* Password was already saved. */
        }
        return { signedOut };
      } finally {
        saving = false;
      }
    },
  };
}
