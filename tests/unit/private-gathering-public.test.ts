import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ rows: [] as Array<Record<string, unknown>> }));
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => {
  const chain = { middleware: () => chain, inputValidator: () => chain, handler: (fn: unknown) => fn };
  return chain;
} }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: {
  from: () => {
    let rows = state.rows;
    const chain = {
      select: () => chain,
      eq: (field: string, value: unknown) => { rows = rows.filter(r => r[field] === value); return chain; },
      gte: () => chain,
      order: () => chain,
      limit: () => Promise.resolve({ data: rows, error: null }),
      maybeSingle: () => Promise.resolve({ data: rows[0] ?? null, error: null }),
    };
    return chain;
  },
} }));
import { getPublicGathering, listSitemapGatherings } from "@/lib/public-data.functions";

describe("public service-role projections", () => {
  beforeEach(() => {
    state.rows = [
      { id: "private-id", subject: "Secret home address", visibility: "private", status: "approved", starts_at: "2099-01-01T12:00:00Z" },
      { id: "public-id", subject: "Public tea", visibility: "public", status: "approved", starts_at: "2099-01-01T12:00:00Z" },
    ];
  });
  it("cannot return private metadata even with a known UUID", async () => {
    const call = getPublicGathering as unknown as (arg: { data: { id: string } }) => Promise<unknown>;
    expect(await call({ data: { id: "private-id" } })).toBeNull();
    expect(await call({ data: { id: "public-id" } })).toMatchObject({ subject: "Public tea" });
  });
  it("excludes private events from the service-role sitemap", async () => {
    const call = listSitemapGatherings as unknown as () => Promise<Array<{ id: string }>>;
    expect((await call()).map(g => g.id)).toEqual(["public-id"]);
  });
});
