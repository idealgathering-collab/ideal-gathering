import { describe, expect, it, vi } from "vitest";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { createPasswordRecovery } from "../../src/lib/password-recovery";
import { authLinkError, cleanAuthLink, hasAuthCallback } from "../../src/lib/auth-link-state";

function fixture() {
  const session = {
    access_token: "recovery-token",
    refresh_token: "refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: 4600,
    user: {
      id: "recovery-user",
      aud: "authenticated",
      app_metadata: {},
      user_metadata: {},
      created_at: "",
    },
  } as Session;
  const auth = {
    exchangeCodeForSession: vi
      .fn()
      .mockResolvedValue({ data: { session, redirectType: "recovery" }, error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session }, error: null }),
    updateUser: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  };
  let time = 1000000;
  const flow = createPasswordRecovery(auth, () => time);
  return {
    auth,
    session,
    flow,
    advance: (ms: number) => {
      time += ms;
    },
  };
}
const link = (query = "code=fresh") => new URL(`https://havato.example/reset-password?${query}`);

describe("password recovery authorization", () => {
  it("rejects an existing session when there is no recovery link", async () => {
    const { flow, auth } = fixture();
    expect(await flow.open(link(""))).toBe("invalid");
    await expect(flow.updatePassword("new-password")).rejects.toThrow("recovery_required");
    expect(auth.getSession).not.toHaveBeenCalled();
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it("rejects implicit tokens even if the URL claims recovery", async () => {
    const { flow, auth } = fixture();
    expect(
      await flow.open(
        new URL("https://havato.example/reset-password#access_token=ordinary&type=recovery"),
      ),
    ).toBe("invalid");
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });
  it("does not authorize a code for an ordinary sign-in", async () => {
    const { flow, auth, session } = fixture();
    auth.exchangeCodeForSession.mockResolvedValue({
      data: { session, redirectType: null },
      error: null,
    });
    expect(await flow.open(link())).toBe("invalid");
    await expect(flow.updatePassword("new-password")).rejects.toThrow();
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it("consumes the recovery code once and revokes sessions after saving", async () => {
    const { flow, auth } = fixture();
    expect(await Promise.all([flow.open(link()), flow.open(link())])).toEqual(["valid", "valid"]);
    expect(auth.exchangeCodeForSession).toHaveBeenCalledTimes(1);
    expect(await flow.updatePassword("new-password")).toEqual({ signedOut: true });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "new-password" });
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "global" });
    await expect(flow.updatePassword("another-password")).rejects.toThrow();
  });
  it.each(["otp_expired", "flow_state_expired", "invalid_grant"])(
    "handles failed exchange: %s",
    async (code) => {
      const { flow, auth } = fixture();
      auth.exchangeCodeForSession.mockResolvedValue({ data: { session: null }, error: { code } });
      expect(await flow.open(link())).toBe(code === "invalid_grant" ? "invalid" : "expired");
      await expect(flow.updatePassword("new-password")).rejects.toThrow();
    },
  );
  it("bounds the grant to fifteen minutes", async () => {
    const { flow, auth, advance } = fixture();
    await flow.open(link());
    advance(15 * 60 * 1000);
    await expect(flow.updatePassword("new-password")).rejects.toThrow();
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it("rejects a grant whose token has already expired", async () => {
    const { flow, auth, session } = fixture();
    session.expires_at = 900;
    expect(await flow.open(link())).toBe("expired");
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it.each(["different-user", "different-token", "signed-out"])(
    "rejects a replaced recovery session: %s",
    async (change) => {
      const { flow, auth, session } = fixture();
      await flow.open(link());
      auth.getSession.mockResolvedValue({
        data: {
          session:
            change === "signed-out"
              ? null
              : {
                  ...session,
                  access_token: change === "different-token" ? "ordinary" : session.access_token,
                  user: {
                    ...session.user,
                    id: change === "different-user" ? "other" : session.user.id,
                  },
                },
        },
        error: null,
      });
      await expect(flow.updatePassword("new-password")).rejects.toThrow();
      expect(auth.updateUser).not.toHaveBeenCalled();
    },
  );
  it("permits retry after an update failure", async () => {
    const { flow, auth } = fixture();
    await flow.open(link());
    auth.updateUser.mockResolvedValueOnce({ error: new Error("network") });
    await expect(flow.updatePassword("new-password")).rejects.toThrow("network");
    await expect(flow.updatePassword("new-password")).resolves.toEqual({ signedOut: true });
  });
  it("reports logout failure without suggesting the password was not saved", async () => {
    const { flow, auth } = fixture();
    await flow.open(link());
    auth.signOut.mockResolvedValue({ error: new Error("network") });
    await expect(flow.updatePassword("new-password")).resolves.toEqual({ signedOut: false });
    await expect(flow.updatePassword("new-password")).rejects.toThrow();
  });
  it("does not authorize a stale exchange after an invalid link is opened", async () => {
    const { flow, auth, session } = fixture();
    let finish!: (value: unknown) => void;
    auth.exchangeCodeForSession.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const first = flow.open(link());
    await flow.open(link(""));
    finish({ data: { session, redirectType: "recovery" }, error: null });
    expect(await first).toBe("invalid");
    await expect(flow.updatePassword("new-password")).rejects.toThrow();
  });
});

describe("email link states and cleanup", () => {
  it.each([
    "?error=access_denied&error_code=otp_expired",
    "#error=access_denied&error_code=otp_expired",
  ])("recognizes expired link in %s", (suffix) => {
    expect(authLinkError(new URL(`https://havato.example/auth${suffix}`))).toBe("expired");
  });
  it("handles invalid/reused links and removes credentials while retaining invite redirect", () => {
    const url = new URL(
      "https://havato.example/auth?mode=signin&lang=fa&invite=abc&redirect=%2Fpending&error_code=bad&code=secret#access_token=secret",
    );
    expect(authLinkError(url)).toBe("invalid");
    expect(cleanAuthLink(url)).toBe("/auth?mode=signin&lang=fa&invite=abc&redirect=%2Fpending");
  });
  it("recognizes callbacks without treating ordinary visits as callbacks", () => {
    expect(hasAuthCallback(link())).toBe(true);
    expect(hasAuthCallback(link("mode=signin"))).toBe(false);
    expect(authLinkError(link())).toBeNull();
  });
});

it("the real Supabase SDK binds recovery exchange to its saved PKCE verifier", async () => {
  const storage = new Map<string, string>();
  const requests: { path: string; body: Record<string, unknown> }[] = [];
  const session = fixture().session;
  session.expires_at = Math.floor(Date.now() / 1000) + 3600;
  const client = createClient("https://backend.example", "public-fixture", {
    auth: {
      flowType: "pkce",
      storageKey: "test-recovery",
      persistSession: true,
      detectSessionInUrl: false,
      autoRefreshToken: false,
      storage: {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => {
          storage.set(key, value);
        },
        removeItem: (key) => {
          storage.delete(key);
        },
      },
    },
    global: {
      fetch: async (input, init) => {
        const url = new URL(String(input));
        const body = JSON.parse(String(init?.body ?? "{}"));
        requests.push({ path: url.pathname, body });
        return new Response(JSON.stringify(url.pathname.endsWith("/token") ? session : {}), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  });
  const requested = await client.auth.resetPasswordForEmail("fixture@example.test", {
    redirectTo: "https://havato.example/reset-password",
  });
  expect(requested.error).toBeNull();
  expect(requests[0].body.code_challenge).toBeTruthy();
  const flow = createPasswordRecovery(client.auth);
  expect(await flow.open(link())).toBe("valid");
  expect(
    requests.find((request) => request.path.endsWith("/token"))?.body.code_verifier,
  ).toBeTruthy();
  await client.auth.signOut({ scope: "local" });
});
