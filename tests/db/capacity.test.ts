import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  adminClient,
  createGathering,
  dbTestsEnabled,
  newFixture,
  signInAttendee,
  signInHost,
  teardown,
  type Fixture,
} from "./harness";
import { classifyJoinError } from "@/lib/join-errors";

const d = dbTestsEnabled ? describe : describe.skip;

d("join flow: seats, duplicates and closed gatherings", () => {
  let admin: SupabaseClient;
  let host: { client: SupabaseClient; userId: string };
  let attendee: { client: SupabaseClient; userId: string };
  const fx: Fixture = newFixture();

  beforeAll(async () => {
    admin = adminClient();
    host = await signInHost();
    attendee = await signInAttendee();
  });

  afterAll(async () => {
    try {
      await teardown(admin, fx);
    } finally {
      await host?.client.auth.signOut();
      await attendee?.client.auth.signOut();
    }
  });

  it("accepts a join while seats remain", async () => {
    const g = await createGathering(admin, fx, { host_id: host.userId, seats: 3 });
    const { error } = await attendee.client
      .from("gathering_attendees")
      .insert({ gathering_id: g.id, user_id: attendee.userId });
    expect(error).toBeNull();
  });

  it("rejects a second join by the same user as already joined", async () => {
    const g = await createGathering(admin, fx, { host_id: host.userId, seats: 4 });
    const first = await attendee.client
      .from("gathering_attendees")
      .insert({ gathering_id: g.id, user_id: attendee.userId });
    expect(first.error).toBeNull();

    const second = await attendee.client
      .from("gathering_attendees")
      .insert({ gathering_id: g.id, user_id: attendee.userId });
    expect(second.error).not.toBeNull();
    expect(classifyJoinError(second.error!)).toBe("already_joined");
  });

  it("rejects a join once every seat is taken", async () => {
    const g = await createGathering(admin, fx, { host_id: host.userId, seats: 1 });
    const seatFiller = await admin
      .from("gathering_attendees")
      .insert({ gathering_id: g.id, user_id: host.userId });
    expect(seatFiller.error).toBeNull();

    const { error } = await attendee.client
      .from("gathering_attendees")
      .insert({ gathering_id: g.id, user_id: attendee.userId });
    expect(error).not.toBeNull();
    expect(classifyJoinError(error!)).toBe("full");
  });

  it("lets exactly one of two simultaneous joins take the last seat", async () => {
    const g = await createGathering(admin, fx, { host_id: host.userId, seats: 1 });
    const results = await Promise.all([
      attendee.client.from("gathering_attendees").insert({ gathering_id: g.id, user_id: attendee.userId }),
      host.client.from("gathering_attendees").insert({ gathering_id: g.id, user_id: host.userId }),
    ]);
    const ok = results.filter((r) => r.error === null);
    const failed = results.filter((r) => r.error !== null);
    expect(ok).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect(classifyJoinError(failed[0].error!)).toBe("full");
  });

  it("rejects a join on a cancelled gathering", async () => {
    const g = await createGathering(admin, fx, { host_id: host.userId, status: "cancelled", seats: 4 });
    const { error } = await attendee.client
      .from("gathering_attendees")
      .insert({ gathering_id: g.id, user_id: attendee.userId });
    expect(error).not.toBeNull();
    expect(classifyJoinError(error!)).toBe("closed");
  });

  it("rejects a join on a rejected gathering", async () => {
    const g = await createGathering(admin, fx, { host_id: host.userId, status: "rejected", seats: 4 });
    const { error } = await attendee.client
      .from("gathering_attendees")
      .insert({ gathering_id: g.id, user_id: attendee.userId });
    expect(error).not.toBeNull();
    expect(classifyJoinError(error!)).toBe("closed");
  });
});
