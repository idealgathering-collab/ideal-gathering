// Real PostgREST/SQL/RLS. Framework dispatch and Storage HTTP signing are simulated.
import { beforeAll, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Database } from "@/integrations/supabase/types";
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
import { setSigningClient } from "./signing-stub";
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
  loadGatheringLifeMoment,
} from "@/lib/life-moments.functions";
import { MOMENT_PHOTO_TTL_SECONDS, momentPhotoPath } from "@/lib/life-moments";
import { loadOwnLifeGatherings } from "@/lib/life-profile.functions";
type Moment = Database["public"]["Tables"]["life_moments"]["Row"];
let ids: Record<string, string>;
let secret: string;
let flow: {
  events: Record<string, { id: string; subject: string; starts_at: string }>;
  existingMoment: string;
};
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
  flow = JSON.parse(await readFile(resolve(runtime, "ig004-fixtures.json"), "utf8"));
  setSigningClient(client(ids.owner, "service_role"));
});

describe("own Life Profile gathering snapshot", () => {
  type Rows = Awaited<ReturnType<typeof loadOwnLifeGatherings>>;
  const load = (id: string) => call<Rows>(loadOwnLifeGatherings, id, {});
  it("includes eligible hosted history, with a bounded minimal projection", async () => {
    const rows = await load(ids.owner);
    expect(rows.some((g) => g.id === flow.events.ended.id)).toBe(true);
    expect(rows.some((g) => g.id === flow.events.fallbackEnded.id)).toBe(true);
    expect(rows.length).toBeLessThanOrEqual(24);
    expect(new Set(rows.map((g) => g.id)).size).toBe(rows.length);
    for (const row of rows)
      expect(Object.keys(row).sort()).toEqual(["happened_at", "id", "place", "title"]);
    expect(rows.map((g) => Date.parse(g.happened_at))).toEqual(
      rows.map((g) => Date.parse(g.happened_at)).sort((a, b) => b - a),
    );
    for (const key of ["future", "cancelled", "fallbackLive"])
      expect(rows.some((g) => g.id === flow.events[key].id)).toBe(false);
  });
  it("includes checked-in participation but not unchecked bookings", async () => {
    expect((await load(ids.viewer)).some((g) => g.id === flow.events.ended.id)).toBe(true);
    expect((await load(ids.outsider)).some((g) => g.id === flow.events.ended.id)).toBe(false);
  });
  it.each(["unverified", "waitlisted", "venue"])(
    "does not expose activity to %s accounts",
    async (kind) => {
      expect(await load(ids[kind])).toEqual([]);
    },
  );
  it("cannot request another user's history", async () => {
    await expect(call(loadOwnLifeGatherings, ids.viewer, { userId: ids.owner })).rejects.toThrow();
  });
  it.each([false, true])("suppresses a blocked host in either direction (%s)", async (reverse) => {
    const blocker = reverse ? ids.owner : ids.viewer;
    const blocked = reverse ? ids.viewer : ids.owner;
    const actor = client(blocker);
    expect(
      (await actor.from("user_blocks").insert({ blocker_id: blocker, blocked_id: blocked })).error,
    ).toBeNull();
    try {
      expect((await load(ids.viewer)).some((g) => g.id === flow.events.ended.id)).toBe(false);
    } finally {
      await actor.from("user_blocks").delete().eq("blocker_id", blocker).eq("blocked_id", blocked);
    }
  });
});

describe("completed gathering moment flow", () => {
  type Loaded = Awaited<ReturnType<typeof loadGatheringLifeMoment>>;
  const load = (user: string, gatheringId: string) =>
    call<Loaded>(loadGatheringLifeMoment, user, { gatheringId });
  it("host receives title, date and place without entering facts", async () => {
    const result = await load(ids.owner, flow.events.ended.id);
    expect(result.prefill).toEqual({
      id: flow.events.ended.id,
      title: flow.events.ended.subject,
      happened_at: expect.any(String),
      place: "Test place · Test city",
    });
    expect(Date.parse(result.prefill!.happened_at)).toBe(Date.parse(flow.events.ended.starts_at));
    expect(result.moment).toBeNull();
  });
  it("checked-in attendee loads the exact existing moment", async () => {
    const result = await load(ids.viewer, flow.events.ended.id);
    expect(result.prefill?.id).toBe(flow.events.ended.id);
    expect(result.moment).toMatchObject({
      id: flow.existingMoment,
      user_id: ids.viewer,
      note: null,
      visibility: "profile",
    });
  });
  it("unchecked attendee receives no prefill or another user's memory", async () => {
    expect(await load(ids.outsider, flow.events.ended.id)).toEqual({ prefill: null, moment: null });
  });
  it.each(["future", "cancelled", "fallbackLive"])(
    "%s gathering cannot prompt or create",
    async (kind) => {
      expect((await load(ids.owner, flow.events[kind].id)).prefill).toBeNull();
      await expect(
        call(createLifeMoment, ids.owner, { ...creation, gathering_id: flow.events[kind].id }),
      ).rejects.toThrow("Invalid gathering");
    },
  );
  it.each(["unverified", "waitlisted", "venue"])("%s account gets no context", async (kind) => {
    expect(await load(ids[kind], flow.events.ended.id)).toEqual({ prefill: null, moment: null });
  });
  it("two simultaneous core-only saves recover the same private moment", async () => {
    const input = {
      title: flow.events.ended.subject,
      happened_at: flow.events.ended.starts_at,
      gathering_id: flow.events.ended.id,
    };
    const results = await Promise.all([
      call<Moment & { alreadyExists: boolean }>(createLifeMoment, ids.owner, input),
      call<Moment & { alreadyExists: boolean }>(createLifeMoment, ids.owner, input),
    ]);
    expect(new Set(results.map((r) => r.id)).size).toBe(1);
    expect(results.map((r) => r.alreadyExists).sort()).toEqual([false, true]);
    for (const row of results)
      expect(row).toMatchObject({ note: null, photo_path: null, visibility: "private" });
    expect((await load(ids.owner, flow.events.ended.id)).moment?.id).toBe(results[0].id);
  });
  it("duplicate retry never overwrites the saved note or visibility", async () => {
    const existing = (await load(ids.owner, flow.events.ended.id)).moment!;
    await call(updateLifeMoment, ids.owner, {
      id: existing.id,
      patch: { note: "Original personal note", visibility: "profile" },
    });
    const retry = await call<Moment & { alreadyExists: boolean }>(createLifeMoment, ids.owner, {
      ...creation,
      gathering_id: flow.events.ended.id,
    });
    expect(retry).toMatchObject({
      id: existing.id,
      note: "Original personal note",
      visibility: "profile",
      alreadyExists: true,
    });
  });
  it("blocked participant retains only their own saved record, without live host context", async () => {
    const c = client(ids.viewer);
    expect(
      (await c.from("user_blocks").insert({ blocker_id: ids.viewer, blocked_id: ids.owner })).error,
    ).toBeNull();
    try {
      const result = await load(ids.viewer, flow.events.ended.id);
      expect(result.prefill).toBeNull();
      expect(result.moment?.id).toBe(flow.existingMoment);
      expect(JSON.stringify(result)).not.toContain("Original personal note");
    } finally {
      await c.from("user_blocks").delete().eq("blocker_id", ids.viewer).eq("blocked_id", ids.owner);
    }
  });
  it("missing IDs and forged request fields reveal no moment data", async () => {
    expect(await load(ids.viewer, crypto.randomUUID())).toEqual({ prefill: null, moment: null });
    await expect(
      call(loadGatheringLifeMoment, ids.viewer, {
        gatheringId: flow.events.ended.id,
        userId: ids.owner,
      }),
    ).rejects.toThrow();
  });
  it("a failed photo signer does not prevent loading or editing the saved note", async () => {
    const existing = (await load(ids.owner, flow.events.ended.id)).moment!;
    const path = momentPhotoPath(ids.owner, existing.id, crypto.randomUUID(), "jpg");
    await call(updateLifeMoment, ids.owner, { id: existing.id, patch: { photo_path: path } });
    failSigning = true;
    try {
      const result = await load(ids.owner, flow.events.ended.id);
      expect(result.moment).toMatchObject({
        id: existing.id,
        photoUrl: null,
        note: "Original personal note",
      });
      await call(updateLifeMoment, ids.owner, {
        id: existing.id,
        patch: { note: null, visibility: "private" },
      });
    } finally {
      failSigning = false;
    }
  });
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
    const existing = await call<Moment & { alreadyExists: boolean }>(createLifeMoment, ids.owner, {
      ...creation,
      gathering_id: ids.gathering,
    });
    expect(existing.alreadyExists).toBe(true);
    expect(existing.note).not.toBe(creation.note);
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
  it("own timeline keeps private text and controls available when photo signing fails", async () => {
    await call(updateLifeMoment, ids.owner, { id: own.id, patch: { note: creation.note } });
    failSigning = true;
    try {
      const rows = await call<Array<Moment & { photoUrl: string | null }>>(
        loadOwnLifeMoments,
        ids.owner,
        {},
      );
      const row = rows.find((r) => r.id === own.id);
      expect(row?.photoUrl).toBeNull();
      expect(row?.note).toBe(creation.note);
      expect(rows.every((r) => r.user_id === ids.owner)).toBe(true);
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
import { loadPublicProfile } from "@/lib/public-profile.functions";
import { blockUser, unblockUser, submitReport } from "@/lib/moderation.functions";

describe("IG-006 member profile and safety API", () => {
  let member: Record<string, string>;
  type Profile = Awaited<ReturnType<typeof loadPublicProfile>>;
  const load = (viewer: string, target: string) =>
    call<Profile>(loadPublicProfile, viewer, { userId: target });
  beforeAll(async () => {
    member = JSON.parse(
      await readFile(resolve(process.env.IG003_RUNTIME!, "ig006-fixtures.json"), "utf8"),
    );
  });
  it("authorized member sees only the safe canonical projection", async () => {
    const row = await load(member.viewer, member.owner);
    expect(row).toMatchObject({
      display_name: "[test-IG006] owner",
      city: "Member city",
      energy_level: "calm",
      talk_style: "deep",
      group_size: "small",
      intentions: ["make_friends"],
    });
    expect(Object.keys(row!).sort()).toEqual(
      [
        "display_name",
        "avatar_url",
        "city",
        "bio",
        "interests",
        "intentions",
        "energy_level",
        "group_size",
        "talk_style",
        "new_people_pref",
      ].sort(),
    );
    for (const value of [
      "PRIVATE NOTE",
      "PRIVATE AREA",
      "PRIVATE VENUE",
      "1990-05-18",
      "example.invalid",
    ])
      expect(JSON.stringify(row)).not.toContain(value);
  });
  it("unrelated and missing targets have the same result", async () => {
    expect(await load(member.outsider, member.owner)).toBeNull();
    expect(await load(member.viewer, "00000000-0000-4000-8000-000000000001")).toBeNull();
  });
  it("shared moments use the existing gated projection without private notes", async () => {
    const rows = await call<Array<Record<string, unknown>>>(loadVisibleLifeMoments, member.viewer, {
      userId: member.owner,
      limit: 12,
    });
    expect(rows.map((r) => r.title)).toEqual(["Shared memory"]);
    for (const r of rows)
      for (const field of ["note", "gathering_id", "photo_path", "lat", "lng"])
        expect(r).not.toHaveProperty(field);
    expect(
      await call(loadVisibleLifeMoments, member.outsider, { userId: member.owner, limit: 12 }),
    ).toEqual([]);
  });
  for (const reverse of [false, true])
    it(`existing block/unblock actions gate profile and moments (reverse=${reverse})`, async () => {
      const blocker = reverse ? member.owner : member.viewer,
        blocked = reverse ? member.viewer : member.owner;
      try {
        expect(await call(blockUser, blocker, { userId: blocked })).toEqual({ ok: true });
        expect(await load(member.viewer, member.owner)).toBeNull();
        expect(
          await call(loadVisibleLifeMoments, member.viewer, { userId: member.owner, limit: 12 }),
        ).toEqual([]);
      } finally {
        await call(unblockUser, blocker, { userId: blocked });
      }
      expect(await load(member.viewer, member.owner)).not.toBeNull();
    });
  it("existing report action saves caller ownership and target", async () => {
    expect(
      await call(submitReport, member.viewer, {
        targetType: "user",
        targetId: member.owner,
        targetUserId: member.owner,
        reason: "other",
        details: "[test-IG006] safety report",
      }),
    ).toEqual({ ok: true });
    const { data, error } = await client(member.viewer)
      .from("reports")
      .select("reporter_id,target_user_id,details")
      .eq("target_user_id", member.owner);
    expect(error).toBeNull();
    expect(data).toEqual([
      {
        reporter_id: member.viewer,
        target_user_id: member.owner,
        details: "[test-IG006] safety report",
      },
    ]);
  });
  it("self-block/report protections remain", async () => {
    await expect(call(blockUser, member.viewer, { userId: member.viewer })).rejects.toThrow();
    await expect(
      call(submitReport, member.viewer, {
        targetType: "user",
        targetId: member.viewer,
        targetUserId: member.viewer,
        reason: "other",
      }),
    ).rejects.toThrow();
  });
  it("rejects invalid and extra profile input", async () => {
    await expect(call(loadPublicProfile, member.viewer, { userId: "invalid" })).rejects.toThrow();
    await expect(
      call(loadPublicProfile, member.viewer, { userId: member.owner, includePrivate: true }),
    ).rejects.toThrow();
  });
  it("signs only an authorized target avatar and strips its stored path", async () => {
    const path = `${member.owner}/avatar.png`;
    const setAvatar = async (value: string | null) => {
      const { error } = await client(member.owner)
        .from("profiles")
        .update({ avatar_url: value })
        .eq("id", member.owner);
      expect(error).toBeNull();
    };
    try {
      await setAvatar(path);
      const before = signedRequests.length;
      expect(await load(member.outsider, member.owner)).toBeNull();
      expect(signedRequests).toHaveLength(before);
      const row = await load(member.viewer, member.owner);
      expect(row?.avatar_url).toContain("/object/sign/test");
      expect(JSON.stringify(row)).not.toContain(path);
      expect(signedRequests.at(-1)?.body).toEqual({ expiresIn: 60 });
      for (const unsafe of [`${member.viewer}/avatar.png`, "https://example.invalid/tracker"]) {
        await setAvatar(unsafe);
        const count = signedRequests.length;
        expect((await load(member.viewer, member.owner))?.avatar_url).toBeNull();
        expect(signedRequests).toHaveLength(count);
      }
    } finally {
      await setAvatar(null);
    }
  });
});

import { loadOwnLifeSummary } from "@/lib/life-summary.functions";
import type { LifeSummary } from "@/lib/life-summary";
describe("IG-007 private activity summary API", () => {
  let summaryIds: Record<string, string>;
  beforeAll(async () => {
    summaryIds = JSON.parse(
      await readFile(resolve(process.env.IG003_RUNTIME!, "ig007-fixtures.json"), "utf8"),
    );
  });
  it("returns complete period aggregates without row limits or identities", async () => {
    const result = await call<LifeSummary>(loadOwnLifeSummary, summaryIds.owner, {});
    expect(result.gatherings).toBe(28);
    expect(result.moments).toBe(103);
    expect(result.categories.reduce((n, c) => n + c.count, 0)).toBe(result.gatherings);
    expect(result.periods.reduce((n, p) => n + p.gatherings, 0)).toBe(result.gatherings);
    expect(JSON.stringify(result)).not.toContain(summaryIds.owner);
    expect(JSON.stringify(result)).not.toContain("PRIVATE");
    for (const field of ["people", "places", "user_id", "note", "lat", "lng"])
      expect(result).not.toHaveProperty(field);
  });
  it("another account receives only its own empty summary", async () => {
    const result = await call<LifeSummary>(loadOwnLifeSummary, summaryIds.empty, {});
    expect(result).toMatchObject({ gatherings: 0, moments: 0, categories: [] });
  });
  it("cannot select a target or arbitrary window", async () => {
    await expect(
      call(loadOwnLifeSummary, summaryIds.empty, { userId: summaryIds.owner }),
    ).rejects.toThrow();
    await expect(call(loadOwnLifeSummary, summaryIds.owner, { days: 365 })).rejects.toThrow();
  });
  for (const kind of ["unverified", "waitlisted", "venue"])
    it(`rejects ${kind} summary access`, async () => {
      await expect(call(loadOwnLifeSummary, summaryIds[kind], {})).rejects.toThrow(
        "Summary unavailable",
      );
    });
});
