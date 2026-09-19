import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  result: { data: null as null | { role: string }, error: null as null | { message: string } },
  privileged: vi.fn(),
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const builder = {
      middleware: () => builder,
      inputValidator: () => builder,
      handler: (fn: (args: unknown) => unknown) => fn,
    };
    return builder;
  },
}));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { from: mocks.privileged },
}));
import { getOwnerActivity, getOwnerDirectory, getOwnerSnapshot } from "@/lib/owner.functions";
import { getOwnerVenuePreview, listOwnerVenuePreviews } from "@/lib/owner-venue.functions";

const query = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn(async () => mocks.result),
};
const args = {
  context: { userId: "caller", supabase: { from: vi.fn(() => query) } },
  data: { section: "waitlist", id: "venue" },
};
const handlers = [
  getOwnerActivity,
  getOwnerDirectory,
  getOwnerSnapshot,
  getOwnerVenuePreview,
  listOwnerVenuePreviews,
];
beforeEach(() => {
  vi.clearAllMocks();
  mocks.result = { data: null, error: null };
  mocks.privileged.mockImplementation(() => {
    throw new Error("privileged read reached");
  });
});

describe("owner server authorization", () => {
  for (const [index, handler] of handlers.entries()) {
    const invoke = () => (handler as unknown as (input: typeof args) => Promise<unknown>)(args);
    it(`handler ${index} denies an authenticated account without owner before privileged access`, async () => {
      await expect(invoke()).rejects.toThrow("Forbidden");
      expect(query.eq).toHaveBeenCalledWith("user_id", "caller");
      expect(query.eq).toHaveBeenCalledWith("role", "owner");
      expect(mocks.privileged).not.toHaveBeenCalled();
    });
    it(`handler ${index} fails closed on role lookup errors`, async () => {
      mocks.result = { data: { role: "owner" }, error: { message: "lookup failed" } };
      await expect(invoke()).rejects.toThrow("lookup failed");
      expect(mocks.privileged).not.toHaveBeenCalled();
    });
    it(`handler ${index} allows an owner through its authorization gate`, async () => {
      mocks.result = { data: { role: "owner" }, error: null };
      await expect(invoke()).rejects.toThrow("privileged read reached");
      expect(mocks.privileged).toHaveBeenCalled();
    });
  }
});
