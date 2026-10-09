import { describe, expect, it } from "vitest";
import type { Session } from "@supabase/supabase-js";
import { confirmationLinkState } from "../../src/lib/confirmation-link";
import { authReturnUrl } from "../../src/lib/auth-return";
const session = {
  access_token: "new-token",
  user: { email_confirmed_at: "2026-10-10" },
} as Session;
describe("confirmation callbacks", () => {
  it("accepts the matching confirmed session", () => {
    expect(
      confirmationLinkState(
        new URL("https://havato.example/auth#access_token=new-token&type=signup"),
        session,
        null,
      ),
    ).toBe("valid");
  });
  it.each([null, { ...session, access_token: "old-token" }, { ...session, user: {} } as Session])(
    "rejects absent, cached or unconfirmed sessions",
    (value) => {
      expect(
        confirmationLinkState(
          new URL("https://havato.example/auth#access_token=new-token&type=signup"),
          value,
          null,
        ),
      ).toBe("invalid");
    },
  );
  it("rejects a purpose marker or code without verified implicit callback credentials", () => {
    expect(
      confirmationLinkState(new URL("https://havato.example/auth#type=signup"), session, null),
    ).toBe("invalid");
    expect(
      confirmationLinkState(new URL("https://havato.example/auth?code=unverified"), session, null),
    ).toBe("invalid");
  });
  it("shows expired/invalid errors even while already signed in", () => {
    expect(
      confirmationLinkState(
        new URL("https://havato.example/auth#error_code=otp_expired&error=access_denied"),
        session,
        null,
      ),
    ).toBe("expired");
    expect(
      confirmationLinkState(new URL("https://havato.example/auth?error_code=bad"), session, null),
    ).toBe("invalid");
  });
  it("does not infer confirmation from ordinary sign-in", () => {
    expect(confirmationLinkState(new URL("https://havato.example/auth"), session, null)).toBe(
      "idle",
    );
  });
  it("retains safe invitation/venue destinations and rejects external redirects", () => {
    expect(
      new URL(authReturnUrl("https://havato.example", "/venue/register")).searchParams.get(
        "redirect",
      ),
    ).toBe("/venue/register");
    for (const redirect of [
      "//attacker.example",
      "/\\attacker.example",
      "https://attacker.example",
    ]) {
      expect(
        new URL(authReturnUrl("https://havato.example", redirect)).searchParams.has("redirect"),
      ).toBe(false);
    }
  });
});
