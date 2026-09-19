// Requires the disposable native fixture + PostgREST from owner-postgres scripts.
// Framework dispatch is bypassed; queries use real signed HTTP/RLS, not DB mocks.
import { beforeAll, describe, expect, it, vi } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const state = vi.hoisted(() => ({
  client: null as SupabaseClient<Database> | null,
  service: null as SupabaseClient<Database> | null,
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/integrations/supabase/client.server", () => ({
  get supabaseAdmin() {
    return state.service;
  },
}));
vi.mock("@/integrations/supabase/client", () => ({
  get supabase() {
    return state.client;
  },
}));
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
vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  createFileRoute: () => (options: unknown) => options,
}));

import { getOwnerActivity, getOwnerDirectory, getOwnerSnapshot } from "@/lib/owner.functions";
import { getOwnerVenuePreview, listOwnerVenuePreviews } from "@/lib/owner-venue.functions";
import { claimInitialOwner, fetchRoles } from "@/lib/roles";
import { Route as ownerRoute } from "@/routes/_authenticated/owner";
import { Route as activityRoute } from "@/routes/_authenticated/owner.activity";
import { Route as directoryRoute } from "@/routes/_authenticated/owner.$section";
import { Route as previewRoute } from "@/routes/_authenticated/owner.venue-preview";

let ids: Record<string, string>;
let secret: string;
function client(id: string, role = "authenticated") {
  const parts = [
    { alg: "HS256", typ: "JWT" },
    { sub: id, role, exp: Math.floor(Date.now() / 1000) + 3600 },
  ].map((x) => Buffer.from(JSON.stringify(x)).toString("base64url"));
  const jwt = `${parts.join(".")}.${createHmac("sha256", secret).update(parts.join(".")).digest("base64url")}`;
  return createClient<Database>("http://127.0.0.1:55440", jwt, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${jwt}` },
      // Local PostgREST is mounted at / rather than Supabase's /rest/v1 prefix.
      fetch: (input, init) => fetch(String(input).replace("/rest/v1/", "/"), init),
    },
  });
}
beforeAll(async () => {
  if (!process.env.IG001_RUNTIME)
    throw new Error("IG001_RUNTIME must identify the disposable local fixture directory");
  const runtime = resolve(process.env.IG001_RUNTIME);
  ids = JSON.parse(await readFile(resolve(runtime, "fixtures.json"), "utf8"));
  secret = await readFile(resolve(runtime, "test-jwt-secret"), "utf8");
  state.service = client(ids.adminA, "service_role");
  state.client = client(ids.adminA);
});

describe("owner handler integration over real PostgREST", () => {
  const entries = [
    getOwnerSnapshot,
    getOwnerActivity,
    getOwnerDirectory,
    listOwnerVenuePreviews,
    getOwnerVenuePreview,
  ];
  for (const [index, handler] of entries.entries()) {
    for (const account of ["adminA", "adminB", "user", "venue", "revoked"]) {
      it(`handler ${index}: ${account} ${account === "adminA" ? "allowed" : "denied"}`, async () => {
        const args = {
          context: { supabase: client(ids[account]), userId: ids[account] },
          data: { section: "waitlist", id: "00000000-0000-0000-0000-000000000000" },
        };
        const result = (handler as unknown as (args: unknown) => Promise<unknown>)(args);
        if (account === "adminA") await expect(result).resolves.not.toBeUndefined();
        else await expect(result).rejects.toThrow("Forbidden");
      });
    }
  }
  it("browser claim helper and role loader use actual RPC and RLS", async () => {
    state.client = client(ids.adminA);
    expect(await claimInitialOwner()).toBe(true);
    expect(await fetchRoles(ids.adminA)).toContain("owner");
    state.client = client(ids.adminB);
    expect(await claimInitialOwner()).toBe(false);
    expect(await fetchRoles(ids.adminA)).not.toContain("owner");
  });
});

describe("owner route gates with actual role queries", () => {
  const routes = [ownerRoute, activityRoute, directoryRoute, previewRoute];
  for (const [index, route] of routes.entries()) {
    for (const account of ["adminA", "adminB", "user", "venue"]) {
      it(`route ${index}: ${account}`, async () => {
        state.client = client(ids[account]);
        const gate = route as unknown as { beforeLoad: (args: unknown) => Promise<unknown> };
        const result = gate.beforeLoad({
          context: { user: { id: ids[account] } },
          params: { section: "waitlist" },
        });
        // Only /owner permits nonowner admins, to display its existing bootstrap screen.
        if (account === "adminA" || (index === 0 && account === "adminB"))
          await expect(result).resolves.toBeUndefined();
        else await expect(result).rejects.toBeDefined();
      });
    }
  }
});
