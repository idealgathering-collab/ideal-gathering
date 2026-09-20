// Real PostgREST/SQL/RLS. Framework dispatch and Storage HTTP signing are simulated.
import { beforeAll, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Database } from "@/integrations/supabase/types";
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/integrations/supabase/client.server", () => ({
  get supabaseAdmin() {
    return client(ids.owner, "service_role");
  },
}));
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
import {
  createLifeMoment,
  updateLifeMoment,
  deleteLifeMoment,
  loadOwnLifeMoments,
  loadVisibleLifeMoments,
  createLifeMomentPhotoUpload,
} from "@/lib/life-moments.functions";
import { MOMENT_PHOTO_TTL_SECONDS, momentPhotoPath } from "@/lib/life-moments";
type Moment = Database["public"]["Tables"]["life_moments"]["Row"];
let ids: Record<string, string>;
let secret: string;
const signedRequests: Array<{
  path: string;
  authenticated: boolean;
  body: Record<string, unknown>;
  upsert: string | null;
}> = [];
let failSigning = false;
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
      fetch: async (input, init) => {
        const url = String(input);
        if (url.includes("/storage/v1/")) {
          const headers = new Headers(init?.headers);
          signedRequests.push({
            path: new URL(url).pathname,
            authenticated: headers.get("Authorization") === `Bearer ${jwt}`,
            body: JSON.parse(String(init?.body ?? "{}")),
            upsert: headers.get("x-upsert"),
          });
          if (failSigning)
            return new Response(JSON.stringify({ message: "denied" }), {
              status: 403,
              headers: { "Content-Type": "application/json" },
            });
          return new Response(
            JSON.stringify(
              url.includes("/upload/sign/")
                ? { url: "/object/upload/sign/test?token=test-only-token" }
                : { signedURL: "/object/sign/test?token=test-only-token" },
            ),
            { headers: { "Content-Type": "application/json" } },
          );
        }
        return fetch(url.replace("/rest/v1/", "/"), init);
      },
    },
  });
}
async function call<T>(fn: unknown, userId: string, data: unknown): Promise<T> {
  return (fn as (args: unknown) => Promise<T>)({
    data,
    context: { userId, supabase: client(userId) },
  });
}
const creation = {
  title: "[test-IG003] API memory",
  note: "PRIVATE API NOTE",
  happened_at: "2020-01-01T12:00:00Z",
};
let own: Moment;
beforeAll(async () => {
  if (!process.env.IG003_RUNTIME) throw Error("Disposable IG003_RUNTIME required");
  const runtime = resolve(process.env.IG003_RUNTIME);
  ids = JSON.parse(await readFile(resolve(runtime, "ig003-fixtures.json"), "utf8"));
  secret = await readFile(resolve(runtime, "test-jwt-secret"), "utf8");
});
describe("life moments application/API foundation", () => {
  it("creates a private own manual moment through real HTTP", async () => {
    own = await call<Moment>(createLifeMoment, ids.owner, creation);
    expect(own).toMatchObject({
      user_id: ids.owner,
      title: creation.title,
      note: creation.note,
      visibility: "private",
      gathering_id: null,
    });
  });
  it("loads own notes but never leaks them in the shared projection", async () => {
    const rows = await call<Array<Moment>>(loadOwnLifeMoments, ids.owner, {});
    expect(rows.find((r) => r.id === own.id)?.note).toBe(creation.note);
    const shared = await call<Array<Record<string, unknown>>>(loadVisibleLifeMoments, ids.viewer, {
      userId: ids.owner,
    });
    expect(shared.some((r) => r.id === ids.sharedMoment)).toBe(true);
    expect(shared.some((r) => r.id === own.id)).toBe(false);
    for (const row of shared)
      expect(Object.keys(row).sort()).toEqual(
        ["id", "user_id", "title", "happened_at", "photoUrl"].sort(),
      );
    expect(JSON.stringify(shared)).not.toContain("PRIVATE");
  });
  it("raw HTTP reads cannot get another user's private or shared rows", async () => {
    const { data, error } = await client(ids.viewer)
      .from("life_moments")
      .select("*")
      .eq("user_id", ids.owner);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
  it("updates only supplied own fields and supports sharing then hiding", async () => {
    const updated = await call<Moment>(updateLifeMoment, ids.owner, {
      id: own.id,
      patch: { title: "[test-IG003] Edited", visibility: "profile" },
    });
    expect(updated.note).toBe(creation.note);
    let visible = await call<Array<{ id: string }>>(loadVisibleLifeMoments, ids.viewer, {
      userId: ids.owner,
    });
    expect(visible.some((r) => r.id === own.id)).toBe(true);
    await call(updateLifeMoment, ids.owner, {
      id: own.id,
      patch: { visibility: "private", note: null },
    });
    visible = await call<Array<{ id: string }>>(loadVisibleLifeMoments, ids.viewer, {
      userId: ids.owner,
    });
    expect(visible.some((r) => r.id === own.id)).toBe(false);
  });
  it("rejects another user's edit/delete/media upload", async () => {
    await expect(
      call(updateLifeMoment, ids.viewer, { id: own.id, patch: { title: "attack" } }),
    ).rejects.toThrow("Moment not found");
    await expect(call(deleteLifeMoment, ids.viewer, { id: own.id })).rejects.toThrow(
      "Moment not found",
    );
    const before = signedRequests.length;
    await expect(
      call(createLifeMomentPhotoUpload, ids.viewer, { id: own.id, extension: "jpg" }),
    ).rejects.toThrow("Moment not found");
    expect(signedRequests.length).toBe(before);
  });
  it("rejects forged ownership and immutable link patches before writing", async () => {
    await expect(
      call(createLifeMoment, ids.owner, { ...creation, user_id: ids.viewer }),
    ).rejects.toThrow();
    await expect(
      call(updateLifeMoment, ids.owner, { id: own.id, patch: { gathering_id: ids.gathering } }),
    ).rejects.toThrow();
  });
  it("validates missing gathering, nonparticipation and duplicates through the database", async () => {
    await expect(
      call(createLifeMoment, ids.owner, { ...creation, gathering_id: crypto.randomUUID() }),
    ).rejects.toThrow("Invalid gathering");
    await expect(
      call(createLifeMoment, ids.outsider, { ...creation, gathering_id: ids.gathering }),
    ).rejects.toThrow("Invalid gathering");
    await expect(
      call(createLifeMoment, ids.owner, { ...creation, gathering_id: ids.gathering }),
    ).rejects.toThrow("duplicate key");
  });
  it("creates a valid gathering-linked moment with its historical event date", async () => {
    const row = await call<Moment>(createLifeMoment, ids.owner, {
      ...creation,
      gathering_id: ids.apiGathering,
    });
    expect(row.gathering_id).toBe(ids.apiGathering);
    expect(Date.parse(row.happened_at)).toBeGreaterThan(Date.parse(creation.happened_at));
    await call(deleteLifeMoment, ids.owner, { id: row.id });
  });
  it("blocked viewers cause no privileged signing", async () => {
    const viewer = client(ids.viewer);
    const { error } = await viewer
      .from("user_blocks")
      .insert({ blocker_id: ids.viewer, blocked_id: ids.owner });
    expect(error).toBeNull();
    const before = signedRequests.length;
    try {
      expect(await call(loadVisibleLifeMoments, ids.viewer, { userId: ids.owner })).toEqual([]);
      expect(signedRequests.length).toBe(before);
    } finally {
      await viewer
        .from("user_blocks")
        .delete()
        .eq("blocker_id", ids.viewer)
        .eq("blocked_id", ids.owner);
    }
  });
  it("denies unverified/waitlisted/venue creation and shared reads", async () => {
    for (const kind of ["unverified", "waitlisted", "venue"]) {
      await expect(call(createLifeMoment, ids[kind], creation)).rejects.toThrow("Forbidden");
      await expect(call(loadVisibleLifeMoments, ids[kind], { userId: ids.owner })).rejects.toThrow(
        "Forbidden",
      );
    }
  });
  it("denies anonymous projection and invalid JWT", async () => {
    const { error } = await client(ids.viewer, "anon").rpc("list_visible_life_moments", {
      _user_id: ids.owner,
    });
    expect(error?.code).toBe("42501");
    const response = await fetch("http://127.0.0.1:55440/life_moments", {
      headers: { Authorization: "Bearer invalid" },
    });
    expect(response.status).toBe(401);
  });
  it("signs only authorized projection paths with bounded TTL (Storage transport stub)", async () => {
    signedRequests.length = 0;
    await call(loadVisibleLifeMoments, ids.viewer, { userId: ids.owner });
    expect(signedRequests).toHaveLength(1);
    expect(signedRequests[0]).toMatchObject({
      path: `/storage/v1/object/sign/life-moment-media/${ids.photoPath}`,
      authenticated: true,
      body: { expiresIn: MOMENT_PHOTO_TTL_SECONDS },
    });
  });
  it("issues owner-scoped unique upload paths with overwrite disabled (Storage transport stub)", async () => {
    const upload = await call<{ path: string; token: string }>(
      createLifeMomentPhotoUpload,
      ids.owner,
      { id: own.id, extension: "jpg" },
    );
    expect(upload.path.startsWith(`${ids.owner}/${own.id}/`)).toBe(true);
    expect(signedRequests.at(-1)?.upsert).not.toBe("true");
    expect(signedRequests.at(-1)?.authenticated).toBe(true);
    await call(updateLifeMoment, ids.owner, { id: own.id, patch: { photo_path: upload.path } });
    await expect(
      call(updateLifeMoment, ids.owner, {
        id: own.id,
        patch: { photo_path: momentPhotoPath(ids.viewer, own.id, crypto.randomUUID(), "jpg") },
      }),
    ).rejects.toThrow("Invalid moment photo");
  });
  it("signing failures fail closed instead of exposing a public URL", async () => {
    failSigning = true;
    try {
      await expect(call(loadVisibleLifeMoments, ids.viewer, { userId: ids.owner })).rejects.toThrow(
        "Moment photo unavailable",
      );
    } finally {
      failSigning = false;
    }
  });
  it("deletes own record and subsequent own reads no longer return it", async () => {
    expect(await call(deleteLifeMoment, ids.owner, { id: own.id })).toEqual({ deleted: true });
    const rows = await call<Array<Moment>>(loadOwnLifeMoments, ids.owner, {});
    expect(rows.some((r) => r.id === own.id)).toBe(false);
  });
});
