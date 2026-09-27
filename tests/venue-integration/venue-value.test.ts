import { beforeAll, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Database } from "@/integrations/supabase/types";
import type { VenueDashboardData } from "@/lib/venue-dashboard";
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    let validate = (d: unknown): unknown => d;
    const builder = {
      middleware: () => builder,
      inputValidator: (fn: typeof validate) => {
        validate = fn;
        return builder;
      },
      handler: (fn: (a: unknown) => unknown) => (args: { data: unknown }) =>
        fn({ ...args, data: validate(args.data) }),
    };
    return builder;
  },
}));
import { loadVenueDashboard } from "@/lib/venue-dashboard.functions";
let ids: Record<string, string> & { businesses: Record<string, string> };
let secret: string;
function client(id: string) {
  const parts = [
    { alg: "HS256", typ: "JWT" },
    { sub: id, role: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 },
  ].map((x) => Buffer.from(JSON.stringify(x)).toString("base64url"));
  const jwt =
    parts.join(".") +
    "." +
    createHmac("sha256", secret).update(parts.join(".")).digest("base64url");
  return createClient<Database>("http://127.0.0.1:55440", jwt, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${jwt}` },
      fetch: (input, init) => fetch(String(input).replace("/rest/v1/", "/"), init),
    },
  });
}
async function call(id: string, data: unknown = {}): Promise<VenueDashboardData> {
  return (loadVenueDashboard as unknown as (args: unknown) => Promise<VenueDashboardData>)({
    data,
    context: { userId: id, supabase: client(id) },
  });
}
beforeAll(async () => {
  if (!process.env.IG008_RUNTIME)
    throw Error("IG008_RUNTIME must identify marked disposable runtime");
  const runtime = resolve(process.env.IG008_RUNTIME);
  ids = JSON.parse(await readFile(resolve(runtime, "ig008-fixtures.json"), "utf8"));
  secret = await readFile(resolve(runtime, "test-jwt-secret"), "utf8");
});
describe("venue dashboard over real SQL/PostgREST", () => {
  it("own verified counts and minimal projection", async () => {
    const data = await call(ids.venue);
    expect(data).toMatchObject({
      visits: 11,
      unique_visitors: 3,
      new_visitors: 2,
      returning_visitors: 1,
      completed_count: 5,
      average_attendance: 2,
      upcoming_count: 23,
    });
    expect(data.upcoming).toHaveLength(20);
    for (const field of [
      ids.a,
      ids.b,
      ids.c,
      "email",
      "phone",
      "note",
      "checkin_lat",
      "checkin_lng",
    ])
      expect(JSON.stringify(data)).not.toContain(field);
  });
  for (const kind of ["consumer", "otherVenue", "pending", "rejected", "unverified"])
    it(kind + " cannot read target venue", async () => {
      await expect(call(ids[kind], { businessId: ids.businesses.venue })).rejects.toThrow(
        "Dashboard unavailable",
      );
    });
  it("Owner can read same real aggregates", async () => {
    const data = await call(ids.owner, { businessId: ids.businesses.venue });
    expect(data.visits).toBe(11);
    expect(data.upcoming.every((g) => g.can_open)).toBe(true);
  });
  it("strict validated target and page inputs", async () => {
    for (const data of [
      { businessId: "bad" },
      { upcomingPage: -1 },
      { completedPage: 1.5 },
      { userId: ids.venue },
      { includePrivate: true },
    ])
      await expect(call(ids.venue, data)).rejects.toThrow();
  });
  it("pagination is deterministic without partial totals", async () => {
    const a = await call(ids.venue),
      b = await call(ids.venue, { upcomingPage: 1 });
    expect(b.upcoming).toHaveLength(3);
    expect(b.upcoming_count).toBe(a.upcoming_count);
    expect(b.upcoming.some((g) => a.upcoming.some((other) => other.id === g.id))).toBe(false);
  });
  it("another venue gets its own data only", async () => {
    const data = await call(ids.otherVenue);
    expect(data.visits).toBe(1);
    expect(data.completed_count).toBe(1);
  });
  it("existing profile table and menu writes preserve ownership", async () => {
    const own = client(ids.venue),
      other = client(ids.otherVenue);
    const { error } = await own
      .from("businesses")
      .update({ description: "Updated synthetic venue description" })
      .eq("id", ids.businesses.venue);
    expect(error).toBeNull();
    const update = await other
      .from("businesses")
      .update({ description: "ATTACK" })
      .eq("id", ids.businesses.venue)
      .select("id");
    expect(update.data ?? []).toEqual([]);
    const insert = await other
      .from("menu_items")
      .insert({ business_id: ids.businesses.venue, name: "ATTACK", price: 1 });
    expect(insert.error).not.toBeNull();
  });
});
