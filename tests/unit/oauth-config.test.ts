import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ direct: vi.fn(), legacy: vi.fn() }));
vi.mock("../../src/integrations/supabase/client", () => ({
  supabase: { auth: { signInWithOAuth: mocks.direct } },
}));
vi.mock("../../src/integrations/lovable", () => ({
  lovable: { auth: { signInWithOAuth: mocks.legacy } },
}));
import { signInWithGoogle } from "../../src/integrations/supabase/oauth";

describe("OAuth deployment selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });
  it("uses Supabase and forwards the target origin", async () => {
    vi.stubEnv("VITE_OAUTH_PROVIDER", "supabase");
    mocks.direct.mockResolvedValue({ data: { url: "https://backend.example/auth" }, error: null });
    expect(await signInWithGoogle("https://staging.example/dashboard")).toEqual({
      error: null,
      redirected: true,
    });
    expect(mocks.direct).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: "https://staging.example/dashboard" },
    });
    expect(mocks.legacy).not.toHaveBeenCalled();
  });
  it("preserves optional Lovable OAuth", async () => {
    vi.stubEnv("VITE_OAUTH_PROVIDER", "lovable");
    mocks.legacy.mockResolvedValue({ redirected: true });
    await signInWithGoogle("https://staging.example");
    expect(mocks.legacy).toHaveBeenCalledWith("google", {
      redirect_uri: "https://staging.example",
    });
    expect(mocks.direct).not.toHaveBeenCalled();
  });
  it("returns authentication errors without claiming a redirect", async () => {
    vi.stubEnv("VITE_OAUTH_PROVIDER", "supabase");
    const error = new Error("provider unavailable");
    mocks.direct.mockResolvedValue({ data: { url: null }, error });
    expect(await signInWithGoogle("https://staging.example")).toEqual({ error, redirected: false });
  });
});
