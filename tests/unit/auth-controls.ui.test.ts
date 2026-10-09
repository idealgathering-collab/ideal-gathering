import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import type { Root } from "react-dom/client";
import { pathToFileURL } from "node:url";
import { authCopy } from "../../src/i18n/auth";
const mocks = vi.hoisted(() => ({
  open: vi.fn(),
  update: vi.fn(),
  resend: vi.fn(),
  signOut: vi.fn(),
  navigate: vi.fn(),
  getSession: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { resend: mocks.resend, signOut: mocks.signOut, getSession: mocks.getSession },
  },
}));
vi.mock("@/integrations/supabase/recovery", () => ({
  passwordRecovery: () => ({ open: mocks.open, updatePassword: mocks.update }),
}));
vi.mock("@/components/site-header", () => ({ SiteHeader: () => null }));
vi.mock("@/components/language-switcher", () => ({ LanguageSwitcher: () => null }));
vi.mock("@/components/quiz-saved-note", () => ({ QuizSavedNote: () => null }));
vi.mock("@/lib/seo", () => ({ localizedHead: vi.fn() }));
vi.mock("@/lib/roles", () => ({ homePathForUser: vi.fn() }));
vi.mock("@/lib/waiting-registration", () => ({ registerWaitingUser: vi.fn() }));
vi.mock("@/integrations/supabase/oauth", () => ({ signInWithGoogle: vi.fn() }));
vi.mock("@/lib/access", () => ({
  checkInvitation: vi.fn(),
  readInvite: () => null,
  rememberInvite: vi.fn(),
  redeemPendingInvite: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));
vi.mock("@/i18n", () => ({
  useT: () => (key: string, vars?: Record<string, number>) =>
    (authCopy.en[key] ?? key).replace("{seconds}", String(vars?.seconds)),
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: object) => ({
    ...options,
    useSearch: () => ({ mode: "signin" }),
  }),
  useNavigate: () => mocks.navigate,
  Link: ({ children, to }: { children: string; to: string }) =>
    createElement("a", { href: to }, children),
}));
import { ResendConfirmation } from "../../src/components/resend-confirmation";
import { Route } from "../../src/routes/reset-password";
import { Route as AuthRoute } from "../../src/routes/auth";

describe.skipIf(!process.env.HAVATO_TEST_JSDOM)("authentication controls DOM integration", () => {
  let root: Root;
  let host: HTMLElement;
  let dom: { window: Window & typeof globalThis };
  async function render(
    component = createElement(ResendConfirmation, {
      initialEmail: "fixture@example.test",
      redirect: "/pending",
    }),
  ) {
    await act(async () => {
      root.render(component);
    });
  }
  async function submit() {
    await act(async () => {
      host
        .querySelector("form")!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
  }
  async function input(id: string, value: string) {
    await act(async () => {
      const element = host.querySelector<HTMLInputElement>(`#${id}`)!;
      Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")!.set!.call(
        element,
        value,
      );
      element.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }
  beforeEach(async () => {
    const { JSDOM } = await import(
      /* @vite-ignore */ pathToFileURL(process.env.HAVATO_TEST_JSDOM!).href
    );
    dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
      url: "https://havato.example/reset-password?code=fresh",
    });
    for (const key of [
      "window",
      "document",
      "navigator",
      "HTMLElement",
      "HTMLInputElement",
      "Element",
      "Node",
      "Event",
      "CustomEvent",
      "MutationObserver",
      "getComputedStyle",
    ]) {
      vi.stubGlobal(
        key,
        key === "window" ? dom.window : dom.window[key as keyof typeof dom.window],
      );
    }
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.clearAllMocks();
    mocks.resend.mockResolvedValue({ error: null });
    mocks.open.mockResolvedValue("invalid");
    mocks.update.mockResolvedValue({ signedOut: true });
    mocks.signOut.mockResolvedValue({ error: null });
    mocks.getSession.mockResolvedValue({
      data: { session: { user: { id: "existing-user" } } },
      error: null,
    });
    host = document.getElementById("root")!;
    const { createRoot } = await import("react-dom/client");
    root = createRoot(host);
  }, 30000);
  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    vi.useRealTimers();
    dom.window.close();
    vi.unstubAllGlobals();
  });
  it("resends with the signup API and preserved destination, then disables retry for sixty seconds", async () => {
    await render();
    await submit();
    expect(mocks.resend).toHaveBeenCalledWith({
      type: "signup",
      email: "fixture@example.test",
      options: { emailRedirectTo: "https://havato.example/auth?mode=signin&redirect=%2Fpending" },
    });
    expect(host.querySelector("button")!.disabled).toBe(true);
    expect(host.textContent).toContain(authCopy.en["auth.resend.sent"]);
    await submit();
    expect(mocks.resend).toHaveBeenCalledTimes(1);
  });
  it("handles provider failure and rate limiting without displaying private provider text", async () => {
    mocks.resend.mockResolvedValue({
      error: { status: 429, message: "private provider response" },
    });
    await render();
    await submit();
    expect(host.textContent).toContain(authCopy.en["auth.resend.failed"]);
    expect(host.textContent).not.toContain("private provider response");
    expect(host.querySelector("button")!.disabled).toBe(true);
  });
  it("re-enables resend after the cooldown", async () => {
    vi.useFakeTimers();
    await render();
    await submit();
    for (let i = 0; i < 60; i++)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
    expect(host.querySelector("button")!.disabled).toBe(false);
  });
  it.each(["invalid", "expired"])(
    "the real reset page hides the password form for %s links",
    async (state) => {
      mocks.open.mockResolvedValue(state);
      await render(
        createElement((Route as unknown as { component: () => React.ReactNode }).component),
      );
      expect(host.querySelector("form")).toBeNull();
      expect(host.textContent).toContain(authCopy.en[`reset.${state}`]);
      expect(host.querySelector("a")!.getAttribute("href")).toBe("/auth");
      expect(mocks.update).not.toHaveBeenCalled();
    },
  );
  it("the real reset page saves only after recovery validation and clears the ordinary session", async () => {
    mocks.open.mockResolvedValue("valid");
    await render(
      createElement((Route as unknown as { component: () => React.ReactNode }).component),
    );
    expect(mocks.open.mock.calls[0][0].searchParams.get("code")).toBe("fresh");
    expect(window.location.search).toBe("");
    await input("pw", "new-password");
    await input("pw2", "new-password");
    await submit();
    expect(mocks.update).toHaveBeenCalledWith("new-password");
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(mocks.navigate).toHaveBeenCalledWith({ to: "/auth", search: { mode: "signin" } });
  });
  it("the real reset page refuses mismatched passwords", async () => {
    mocks.open.mockResolvedValue("valid");
    await render(
      createElement((Route as unknown as { component: () => React.ReactNode }).component),
    );
    await input("pw", "new-password");
    await input("pw2", "different-password");
    await submit();
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it.each(["otp_expired", "bad_link"])(
    "the real auth page keeps %s visible even with an existing session",
    async (code) => {
      window.history.replaceState(
        null,
        "",
        `/auth?mode=signin#error=access_denied&error_code=${code}`,
      );
      await render(
        createElement((AuthRoute as unknown as { component: () => React.ReactNode }).component),
      );
      expect(host.textContent).toContain(
        authCopy.en[code === "otp_expired" ? "auth.link.expired" : "auth.link.invalid"],
      );
      expect(host.querySelector("#confirmation-email")).not.toBeNull();
      expect(mocks.getSession).not.toHaveBeenCalled();
      expect(mocks.navigate).not.toHaveBeenCalled();
      expect(window.location.hash).toBe("");
    },
  );
});
