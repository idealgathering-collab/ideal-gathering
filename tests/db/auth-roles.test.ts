import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  adminClient,
  createThrowawayUser,
  dbTestsEnabled,
  deleteUsers,
  signInAttendee,
} from "./harness";

const d = dbTestsEnabled ? describe : describe.skip;

d("signup, roles and account-type separation", () => {
  let admin: SupabaseClient;
  const disposables: string[] = [];

  beforeAll(() => {
    admin = adminClient();
  });

  afterAll(async () => {
    await deleteUsers(admin, disposables);
  });

  async function rolesOf(userId: string) {
    const { data, error } = await admin.from("user_roles").select("role").eq("user_id", userId);
    if (error) throw error;
    return (data ?? []).map((r) => r.role as string).sort();
  }

  it("gives a plain signup the user role and a profile", async () => {
    const user = await createThrowawayUser(admin, undefined, disposables);
    expect(await rolesOf(user.id)).toEqual(["user"]);

    const { data } = await admin.from("profiles").select("id, display_name").eq("id", user.id).maybeSingle();
    expect(data?.id).toBe(user.id);
    expect(data?.display_name).toBeTruthy();
  });

  it("gives a venue signup the venue role", async () => {
    const user = await createThrowawayUser(admin, "venue", disposables);
    expect(await rolesOf(user.id)).toEqual(["venue"]);
  });

  it("falls back to user for an unknown account type", async () => {
    const user = await createThrowawayUser(admin, "admin", disposables);
    expect(await rolesOf(user.id)).toEqual(["user"]);
  });

  it("stops a signed-in account from granting itself a role", async () => {
    const me = await signInAttendee();
    try {
      const insert = await me.client
        .from("user_roles")
        .insert({ user_id: me.userId, role: "admin" })
        .select("id");
      expect(insert.error).not.toBeNull();

      const update = await me.client.from("user_roles").update({ role: "admin" }).eq("user_id", me.userId);
      expect(update.error).not.toBeNull();

      const del = await me.client.from("user_roles").delete().eq("user_id", me.userId).select("id");
      expect(del.error ? true : (del.data ?? []).length === 0).toBe(true);

      expect(await rolesOf(me.userId)).not.toContain("admin");
    } finally {
      await me.client.auth.signOut();
    }
  });

  it("only exposes the signed-in account's own roles", async () => {
    const other = await createThrowawayUser(admin, undefined, disposables);
    const me = await signInAttendee();
    try {
      const { data } = await me.client.from("user_roles").select("user_id").eq("user_id", other.id);
      expect(data ?? []).toHaveLength(0);
    } finally {
      await me.client.auth.signOut();
    }
  });
});
