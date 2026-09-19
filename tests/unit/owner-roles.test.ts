import { beforeEach, describe, expect, it, vi } from "vitest";
import { claimInitialOwner, homePathForUser } from "@/lib/roles";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), access: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: mocks.rpc } }));
vi.mock("@/lib/access", () => ({ fetchAccessState: mocks.access }));

beforeEach(() => vi.resetAllMocks());

describe("owner claim RPC", () => {
  it("uses the authenticated no-argument RPC", async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    expect(await claimInitialOwner()).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith("claim_initial_owner");
  });
  it.each([false, null])("does not claim success for %s", async (data) => {
    mocks.rpc.mockResolvedValue({ data, error: null });
    expect(await claimInitialOwner()).toBe(false);
  });
  it("surfaces authorization errors", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "Forbidden" } });
    await expect(claimInitialOwner()).rejects.toThrow("Forbidden");
  });
});

describe("privileged home compatibility", () => {
  it.each([
    [{ isOwner: true, isAdmin: true }, "/owner"],
    [{ isOwner: true, isAdmin: false }, "/owner"],
    [{ isOwner: false, isAdmin: true }, "/admin"],
    [{ isVenue: true }, "/venue/dashboard"],
    [{ hasProductAccess: true }, "/dashboard"],
  ])("routes %j to %s", async (access, path) => {
    mocks.access.mockResolvedValue(access);
    expect(await homePathForUser("test-user")).toBe(path);
  });
});
