import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  adminClient,
  block,
  createGathering,
  dbTestsEnabled,
  newFixture,
  sendMessage,
  signInAdmin,
  signInAttendee,
  signInHost,
  tag,
  teardown,
  unblockAll,
  type Fixture,
} from "./harness";

const d = dbTestsEnabled ? describe : describe.skip;

d("blocking and reporting", () => {
  let admin: SupabaseClient;
  let host: { client: SupabaseClient; userId: string };
  let attendee: { client: SupabaseClient; userId: string };
  let adminUser: { client: SupabaseClient; userId: string };
  const fx: Fixture = newFixture();
  let gatheringId: string;

  beforeAll(async () => {
    admin = adminClient();
    host = await signInHost();
    attendee = await signInAttendee();
    adminUser = await signInAdmin(admin);

    const g = await createGathering(admin, fx, { host_id: host.userId, seats: 4 });
    gatheringId = g.id;
    const join = await admin
      .from("gathering_attendees")
      .insert({ gathering_id: gatheringId, user_id: attendee.userId });
    if (join.error) throw join.error;

    await unblockAll(admin, [host.userId, attendee.userId]);
  });

  afterAll(async () => {
    try {
      await unblockAll(admin, [host.userId, attendee.userId]);
      await teardown(admin, fx);
    } finally {
      await Promise.all([host, attendee, adminUser].map((a) => a?.client.auth.signOut().catch(() => undefined)));
    }
  });

  it("shows both sides of the conversation before any block", async () => {
    expect((await sendMessage(host.client, gatheringId, host.userId, "hello from host")).error).toBeNull();
    expect((await sendMessage(attendee.client, gatheringId, attendee.userId, "hello from attendee")).error).toBeNull();

    const seenByAttendee = await attendee.client
      .from("gathering_messages")
      .select("sender_id")
      .eq("gathering_id", gatheringId);
    expect((seenByAttendee.data ?? []).map((m) => m.sender_id)).toContain(host.userId);

    const seenByHost = await host.client
      .from("gathering_messages")
      .select("sender_id")
      .eq("gathering_id", gatheringId);
    expect((seenByHost.data ?? []).map((m) => m.sender_id)).toContain(attendee.userId);
  });

  it("hides messages in both directions once a block exists", async () => {
    await block(attendee.client, attendee.userId, host.userId);

    const blockerView = await attendee.client
      .from("gathering_messages")
      .select("sender_id")
      .eq("gathering_id", gatheringId);
    expect((blockerView.data ?? []).map((m) => m.sender_id)).not.toContain(host.userId);

    const blockedView = await host.client
      .from("gathering_messages")
      .select("sender_id")
      .eq("gathering_id", gatheringId);
    expect((blockedView.data ?? []).map((m) => m.sender_id)).not.toContain(attendee.userId);
  });

  it("only lets the blocker remove their own block", async () => {
    const byOther = await host.client
      .from("user_blocks")
      .delete()
      .eq("blocker_id", attendee.userId)
      .eq("blocked_id", host.userId)
      .select("blocker_id");
    expect(byOther.data ?? []).toHaveLength(0);

    const byOwner = await attendee.client
      .from("user_blocks")
      .delete()
      .eq("blocker_id", attendee.userId)
      .eq("blocked_id", host.userId)
      .select("blocker_id");
    expect(byOwner.error).toBeNull();
    expect(byOwner.data ?? []).toHaveLength(1);
  });

  it("clamps a new report to open and lets only an admin resolve it", async () => {
    const created = await attendee.client
      .from("reports")
      .insert({
        reporter_id: attendee.userId,
        target_type: "user",
        target_id: host.userId,
        target_user_id: host.userId,
        gathering_id: gatheringId,
        reason: tag("harassment"),
        details: tag("integration test report"),
        status: "resolved",
        admin_note: "should be cleared",
      })
      .select("id, status, admin_note")
      .single();
    expect(created.error).toBeNull();
    expect(created.data?.status).toBe("open");
    expect(created.data?.admin_note).toBeNull();

    try {
      const byReporter = await attendee.client
        .from("reports")
        .update({ status: "dismissed" })
        .eq("id", created.data!.id)
        .select("id");
      // Either RLS filters the update out, or the trigger raises.
      if (byReporter.error) expect(byReporter.error.message).toMatch(/Only admins can update reports|row-level/i);
      else expect(byReporter.data ?? []).toHaveLength(0);

      const byAdmin = await adminUser.client
        .from("reports")
        .update({ status: "resolved", admin_note: tag("handled") })
        .eq("id", created.data!.id)
        .select("status")
        .maybeSingle();
      expect(byAdmin.error).toBeNull();
      expect(byAdmin.data?.status).toBe("resolved");
    } finally {
      await admin.from("reports").delete().eq("id", created.data!.id);
    }
  });
});
