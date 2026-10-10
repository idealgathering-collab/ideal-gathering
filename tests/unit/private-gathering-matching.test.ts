import { expect, it, vi } from "vitest";
const fixture = vi.hoisted(() => ({ privilegedRead: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => {
  const chain = { middleware: () => chain, inputValidator: () => chain, handler: (fn: unknown) => fn };
  return chain;
} }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { from: fixture.privilegedRead } }));
import { getTableFit } from "@/lib/matching.functions";
it("does not read private guest signals even when the caller supplies the UUID", async () => {
  const supabase = { from: (table: string) => {
    const chain = { select: () => chain, eq: () => chain, in: () => chain,
      maybeSingle: () => Promise.resolve({ data: table === "profiles" ? { trait_spark: 60, trait_curiosity: 70, trait_warmth: 80, trait_depth: 90, date_of_birth: "1990-01-01", interests: [] } : { social_energy: "low" } }),
      then: (fn: (r: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(fn) };
    return chain;
  } };
  const call = getTableFit as unknown as (input: unknown) => Promise<unknown>;
  expect(await call({ data: { gatheringIds: ["private-id"] }, context: { supabase, userId: "outsider" } })).toMatchObject({ viewerHasTraits: true, fits: [] });
  expect(fixture.privilegedRead).not.toHaveBeenCalled();
});
