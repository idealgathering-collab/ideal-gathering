import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  adminClient,
  createGathering,
  dbTestsEnabled,
  FAR_AWAY,
  isoIn,
  newFixture,
  signInAttendee,
  signInHost,
  teardown,
  VENUE,
  type Fixture,
} from "./harness";
import { classifyAttendanceError } from "@/lib/attendance-window";

const d = dbTestsEnabled ? describe : describe.skip;

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

d("check-in / check-out enforcement", () => {
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

  /** Gathering starting in `startsInMs` (may be negative) with the attendee already joined. */
  async function joined(startsInMs: number, values: Record<string, unknown> = {}) {
    const g = await createGathering(admin, fx, {
      host_id: host.userId,
      seats: 4,
      starts_at: isoIn(startsInMs),
      ends_at: isoIn(startsInMs + 2 * HOUR),
      ...values,
    });
    const { error } = await admin
      .from("gathering_attendees")
      .insert({ gathering_id: g.id, user_id: attendee.userId });
    if (error) throw error;
    return g.id as string;
  }

  function mark(id: string, patch: Record<string, unknown>) {
    return attendee.client
      .from("gathering_attendees")
      .update(patch)
      .eq("gathering_id", id)
      .eq("user_id", attendee.userId)
      .select("checked_in_at, checked_out_at, checked_in_by, checked_out_by")
      .maybeSingle();
  }

  const atVenue = () => ({
    checked_in_at: new Date().toISOString(),
    checkin_lat: VENUE.lat,
    checkin_lng: VENUE.lng,
  });

  it("blocks a check-in more than 30 minutes before the start", async () => {
    const id = await joined(2 * HOUR);
    const { error } = await mark(id, atVenue());
    expect(classifyAttendanceError(error?.message ?? "")).toBe("too_early");
  });

  it("blocks a check-in more than 24 hours after the end", async () => {
    const id = await joined(-30 * HOUR); // ended ~28h ago
    const { error } = await mark(id, atVenue());
    expect(classifyAttendanceError(error?.message ?? "")).toBe("window_closed");
  });

  it("blocks a check-in on a cancelled gathering", async () => {
    const id = await joined(10 * MIN);
    await admin.from("gatherings").update({ status: "cancelled" }).eq("id", id);
    const { error } = await mark(id, atVenue());
    expect(classifyAttendanceError(error?.message ?? "")).toBe("closed");
  });

  it("requires coordinates when the gathering is geocoded", async () => {
    const id = await joined(10 * MIN);
    const { error } = await mark(id, { checked_in_at: new Date().toISOString() });
    expect(classifyAttendanceError(error?.message ?? "")).toBe("location_required");
  });

  it("blocks a check-in from more than 100 m away", async () => {
    const id = await joined(10 * MIN);
    const { error } = await mark(id, {
      checked_in_at: new Date().toISOString(),
      checkin_lat: FAR_AWAY.lat,
      checkin_lng: FAR_AWAY.lng,
    });
    expect(classifyAttendanceError(error?.message ?? "")).toBe("too_far");
  });

  it("blocks a check-out before a check-in", async () => {
    const id = await joined(10 * MIN);
    const { error } = await mark(id, {
      checked_out_at: new Date().toISOString(),
      checkout_lat: VENUE.lat,
      checkout_lng: VENUE.lng,
    });
    expect(classifyAttendanceError(error?.message ?? "")).toBe("not_checked_in");
  });

  it("accepts an in-window check-in then check-out at the venue", async () => {
    const id = await joined(10 * MIN);
    const inRes = await mark(id, atVenue());
    expect(inRes.error).toBeNull();
    expect(inRes.data?.checked_in_at).toBeTruthy();
    expect(inRes.data?.checked_in_by).toBe(attendee.userId);

    const outRes = await mark(id, {
      checked_out_at: new Date().toISOString(),
      checkout_lat: VENUE.lat,
      checkout_lng: VENUE.lng,
    });
    expect(outRes.error).toBeNull();
    expect(outRes.data?.checked_out_at).toBeTruthy();
    expect(outRes.data?.checked_out_by).toBe(attendee.userId);
  });

  it("refuses to overwrite a timestamp that is already set", async () => {
    const id = await joined(10 * MIN);
    expect((await mark(id, atVenue())).error).toBeNull();
    const again = await mark(id, atVenue());
    expect(classifyAttendanceError(again.error?.message ?? "")).toBe("already");
  });

  it("keeps the join fields immutable", async () => {
    const id = await joined(10 * MIN);
    const other = await createGathering(admin, fx, { host_id: host.userId, seats: 4 });

    const movedGathering = await mark(id, { gathering_id: other.id });
    expect(movedGathering.error?.message ?? "").toContain("ATTENDANCE_IMMUTABLE_FIELDS");

    const movedJoinedAt = await mark(id, { joined_at: new Date(0).toISOString() });
    expect(movedJoinedAt.error?.message ?? "").toContain("ATTENDANCE_IMMUTABLE_FIELDS");

    const movedUser = await mark(id, { user_id: host.userId });
    expect(movedUser.error?.message ?? "").toContain("ATTENDANCE_IMMUTABLE_FIELDS");
  });

  it("stops an attendee from marking someone else", async () => {
    const id = await joined(10 * MIN);
    const add = await admin.from("gathering_attendees").insert({ gathering_id: id, user_id: host.userId });
    expect(add.error).toBeNull();

    const res = await attendee.client
      .from("gathering_attendees")
      .update(atVenue())
      .eq("gathering_id", id)
      .eq("user_id", host.userId)
      .select("user_id");
    // RLS may filter the row out entirely; otherwise the trigger raises.
    if (res.error) expect(res.error.message).toMatch(/ATTENDANCE_FORBIDDEN|row-level/);
    else expect(res.data).toHaveLength(0);
  });

  it("lets the host mark an attendee without a proximity check", async () => {
    const id = await joined(10 * MIN);
    const { data, error } = await host.client
      .from("gathering_attendees")
      .update({ checked_in_at: new Date().toISOString() })
      .eq("gathering_id", id)
      .eq("user_id", attendee.userId)
      .select("checked_in_at, checked_in_by")
      .maybeSingle();
    expect(error).toBeNull();
    expect(data?.checked_in_at).toBeTruthy();
    expect(data?.checked_in_by).toBe(host.userId);
  });
});
