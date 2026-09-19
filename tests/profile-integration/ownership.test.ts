// Framework dispatch is bypassed; the Supabase client, HTTP RPC, RLS and queries are real.
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
vi.mock("@/integrations/supabase/client", () => ({
  get supabase() {
    return state.client;
  },
}));
vi.mock("@/integrations/supabase/client.server", () => ({
  get supabaseAdmin() {
    return state.service;
  },
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
import { changedFields, completeOnboarding, saveProfileData } from "@/lib/profile-data";
import { loadMyGatheringPreferences } from "@/lib/gathering-preferences";
import { loadProfileCard, loadProfileCards } from "@/lib/profile-card.functions";
import { loadPublicProfile } from "@/lib/public-profile.functions";
import { getTableFit } from "@/lib/matching.functions";
import { preferenceScore } from "@/lib/recommend";

let ids: Record<string, string>;
let secret: string;
function client(id: string, role = "authenticated") {
  const segments = [
    { alg: "HS256", typ: "JWT" },
    { sub: id, role, exp: Math.floor(Date.now() / 1000) + 3600 },
  ].map((x) => Buffer.from(JSON.stringify(x)).toString("base64url"));
  const jwt = `${segments.join(".")}.${createHmac("sha256", secret).update(segments.join(".")).digest("base64url")}`;
  return createClient<Database>("http://127.0.0.1:55440", jwt, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${jwt}` },
      fetch: (input, init) => fetch(String(input).replace("/rest/v1/", "/"), init),
    },
  });
}
beforeAll(async () => {
  if (!process.env.IG002_RUNTIME) throw Error("Disposable IG002_RUNTIME required");
  const runtime = resolve(process.env.IG002_RUNTIME);
  ids = JSON.parse(await readFile(resolve(runtime, "ig002-fixtures.json"), "utf8"));
  secret = await readFile(resolve(runtime, "test-jwt-secret"), "utf8");
  state.client = client(ids.legacy);
  state.service = client(ids.legacy, "service_role");
});
describe("canonical profile ownership via real database", () => {
  it("current API schema cache resolves the typed transactional RPC", async () => {
    const { data, error } = await state.client!.rpc("save_my_profile_data", {
      _profile: {},
      _preferences: {},
    });
    expect(error).toBeNull();
    expect(data).toBe(true);
  });
  it("self and batched cards use canonical intentions/style instead of profile duplicates", async () => {
    const own = await loadProfileCard(ids.legacy);
    expect(own).toMatchObject({
      intentions: ["make_friends"],
      energyLevel: "lively",
      talkStyle: "deep",
      newPeople: "warm_up",
      groupSize: "large",
    });
    expect((await loadProfileCards([ids.legacy]))[0]).toMatchObject({
      intentions: own?.intentions,
      energyLevel: own?.energyLevel,
    });
  });
  it("public loader and people card use canonical intentions with no wider private projection", async () => {
    state.client = client(ids.existing);
    const row = await loadPublicProfile({ data: { userId: ids.legacy } });
    expect(row).toMatchObject({
      intentions: ["make_friends"],
      date_of_birth: "1990-01-01",
      energy_level: null,
      talk_style: null,
      new_people_pref: null,
      group_size: null,
    });
    for (const field of [
      "nationality",
      "gender",
      "social_links",
      "spontaneity",
      "gathering_types",
      "social_energy",
    ])
      expect(row).not.toHaveProperty(field);
    const card = await loadProfileCard(ids.legacy);
    expect(card).toMatchObject({
      intentions: ["make_friends"],
      dateOfBirth: "1990-01-01",
      energyLevel: null,
    });
    state.client = client(ids.legacy);
  });
  it("profile edit does not overwrite newer onboarding preferences", async () => {
    const original = await loadMyGatheringPreferences(ids.legacy);
    await completeOnboarding({ social_energy: "calm", spontaneity: "planner" });
    await saveProfileData(
      { bio: "[test-IG002] profile edit" },
      changedFields(
        { intentions: original!.intentions, gathering_types: original!.gathering_types },
        { intentions: ["learn_something"], gathering_types: original!.gathering_types },
      ),
    );
    expect(await loadMyGatheringPreferences(ids.legacy)).toMatchObject({
      intentions: ["learn_something"],
      social_energy: "calm",
      spontaneity: "planner",
      conversation_style: "deep",
    });
  });
  it("onboarding edit does not overwrite newer profile preferences/identity", async () => {
    const original = (await loadMyGatheringPreferences(ids.legacy))!;
    await saveProfileData(
      { bio: "[test-IG002] latest identity" },
      { intentions: ["shared_interests"] },
    );
    await completeOnboarding(changedFields(original, { ...original, social_energy: "lively" }));
    expect(await loadMyGatheringPreferences(ids.legacy)).toMatchObject({
      intentions: ["shared_interests"],
      social_energy: "lively",
    });
    expect((await loadProfileCard(ids.legacy))?.bio).toBe("[test-IG002] latest identity");
  });
  it("empty and null canonical choices never resurrect legacy values", async () => {
    await saveProfileData({}, { intentions: [], social_energy: null, preferred_group_size: null });
    expect(await loadProfileCard(ids.legacy)).toMatchObject({
      intentions: [],
      energyLevel: null,
      groupSize: null,
    });
    expect(await loadPublicProfile({ data: { userId: ids.legacy } })).toMatchObject({
      intentions: [],
    });
  });
  it("matching signal comes from canonical preferences only, without changing its model", async () => {
    state.client = client(ids.fresh);
    await saveProfileData({}, { social_energy: "calm" });
    const invoke = getTableFit as unknown as (
      args: unknown,
    ) => Promise<{ viewerHasSignal: boolean }>;
    expect(
      (
        await invoke({
          context: { supabase: state.client, userId: ids.fresh },
          data: { gatheringIds: [] },
        })
      ).viewerHasSignal,
    ).toBe(true);
    await saveProfileData({}, { social_energy: null });
    expect(
      (
        await invoke({
          context: { supabase: state.client, userId: ids.fresh },
          data: { gatheringIds: [] },
        })
      ).viewerHasSignal,
    ).toBe(false);
  });
  it("recommendation input is the saved preference source", async () => {
    await saveProfileData({}, { preferred_group_size: 3, gathering_types: ["coffee"] });
    const prefs = await loadMyGatheringPreferences(ids.fresh);
    expect(prefs).toMatchObject({ preferred_group_size: 3, gathering_types: ["coffee"] });
    // Same ranking function as Explore; no scoring implementation changes.
    const coffee = preferenceScore(
      { subject: "Coffee", seats: 3, gathering_type: "coffee" },
      prefs,
    );
    const other = preferenceScore(
      { subject: "Outdoor hike", seats: 10, gathering_type: "outdoors" },
      prefs,
    );
    expect(coffee.hasSignal).toBe(true);
    expect(coffee.matchedTypes).toContain("coffee");
    expect(coffee.score!).toBeGreaterThan(other.score!);
  });
  it("ordinary users cannot load another raw preference row", async () => {
    expect(await loadMyGatheringPreferences(ids.legacy)).toBeNull();
  });
});
