import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  adminClient,
  createBusiness,
  createGathering,
  createTable,
  dbTestsEnabled,
  FAR_AWAY,
  isoIn,
  newFixture,
  signInAdmin,
  signInAttendee,
  signInHost,
  tag,
  teardown,
  VENUE,
  type Fixture,
} from "./harness";

const d = dbTestsEnabled ? describe : describe.skip;

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

d("database triggers and RLS", () => {
  let admin: SupabaseClient;
  let host: { client: SupabaseClient; userId: string };
  let attendee: { client: SupabaseClient; userId: string };
  let adminUser: { client: SupabaseClient; userId: string };
  const fx: Fixture = newFixture();

  beforeAll(async () => {
    admin = adminClient();
    host = await signInHost();
    attendee = await signInAttendee();
    adminUser = await signInAdmin(admin);
    await createBusiness(admin, host.userId, fx);
    await createTable(admin, fx.businessId!, fx, 4);
  });

  afterAll(async () => {
    try {
      await teardown(admin, fx);
    } finally {
      await host?.client.auth.signOut();
      await attendee?.client.auth.signOut();
      await adminUser?.client.auth.signOut();
    }
  });

  describe("set_gathering_city", () => {
    it("copies the city from the business", async () => {
      const g = await createGathering(admin, fx, {
        host_id: host.userId,
        business_id: fx.businessId,
        city: "Wrong City",
      });
      expect(g.city).toBe("Istanbul");
    });

    it("normalises a blank city to null", async () => {
      const g = await createGathering(admin, fx, { host_id: host.userId, city: "   " });
      expect(g.city).toBeNull();
    });
  });

  describe("enforce_gathering_capacity", () => {
    it("rejects a join once every seat is taken", async () => {
      const g = await createGathering(admin, fx, { host_id: host.userId, seats: 1 });
      const first = await admin
        .from("gathering_attendees")
        .insert({ gathering_id: g.id, user_id: host.userId });
      expect(first.error).toBeNull();

      const { error } = await attendee.client
        .from("gathering_attendees")
        .insert({ gathering_id: g.id, user_id: attendee.userId });
      expect(error?.message).toContain("GATHERING_FULL");
    });

    it("rejects a join on a cancelled gathering", async () => {
      const g = await createGathering(admin, fx, { host_id: host.userId, status: "cancelled", seats: 4 });
      const { error } = await attendee.client
        .from("gathering_attendees")
        .insert({ gathering_id: g.id, user_id: attendee.userId });
      expect(error?.message).toContain("GATHERING_CLOSED");
    });
  });

  describe("guard_attendance_update", () => {
    async function gatheringWithAttendee(startsInMs: number) {
      const g = await createGathering(admin, fx, {
        host_id: host.userId,
        seats: 4,
        starts_at: isoIn(startsInMs),
        ends_at: isoIn(startsInMs + 2 * HOUR),
      });
      const { error } = await admin
        .from("gathering_attendees")
        .insert({ gathering_id: g.id, user_id: attendee.userId });
      if (error) throw error;
      return g.id as string;
    }

    it("blocks a self check-in more than 30 minutes before the start", async () => {
      const id = await gatheringWithAttendee(2 * HOUR);
      const { error } = await attendee.client
        .from("gathering_attendees")
        .update({ checked_in_at: new Date().toISOString(), checkin_lat: VENUE.lat, checkin_lng: VENUE.lng })
        .eq("gathering_id", id)
        .eq("user_id", attendee.userId);
      expect(error?.message).toContain("CHECKIN_TOO_EARLY");
    });

    it("blocks a check-in from more than 100 m away", async () => {
      const id = await gatheringWithAttendee(10 * MIN);
      const { error } = await attendee.client
        .from("gathering_attendees")
        .update({ checked_in_at: new Date().toISOString(), checkin_lat: FAR_AWAY.lat, checkin_lng: FAR_AWAY.lng })
        .eq("gathering_id", id)
        .eq("user_id", attendee.userId);
      expect(error?.message).toContain("CHECKIN_TOO_FAR");
    });

    it("requires coordinates when the gathering has a location", async () => {
      const id = await gatheringWithAttendee(10 * MIN);
      const { error } = await attendee.client
        .from("gathering_attendees")
        .update({ checked_in_at: new Date().toISOString() })
        .eq("gathering_id", id)
        .eq("user_id", attendee.userId);
      expect(error?.message).toContain("LOCATION_REQUIRED");
    });

    it("accepts an in-window check-in at the venue, then blocks a second one", async () => {
      const id = await gatheringWithAttendee(10 * MIN);
      const patch = {
        checked_in_at: new Date().toISOString(),
        checkin_lat: VENUE.lat,
        checkin_lng: VENUE.lng,
      };
      const ok = await attendee.client
        .from("gathering_attendees")
        .update(patch)
        .eq("gathering_id", id)
        .eq("user_id", attendee.userId)
        .select("checked_in_at")
        .maybeSingle();
      expect(ok.error).toBeNull();
      expect(ok.data?.checked_in_at).toBeTruthy();

      const again = await attendee.client
        .from("gathering_attendees")
        .update({ ...patch, checked_in_at: new Date().toISOString() })
        .eq("gathering_id", id)
        .eq("user_id", attendee.userId);
      expect(again.error?.message).toContain("ATTENDANCE_ALREADY_SET");
    });

    it("blocks a check-out without a check-in", async () => {
      const id = await gatheringWithAttendee(10 * MIN);
      const { error } = await attendee.client
        .from("gathering_attendees")
        .update({
          checked_out_at: new Date().toISOString(),
          checkout_lat: VENUE.lat,
          checkout_lng: VENUE.lng,
        })
        .eq("gathering_id", id)
        .eq("user_id", attendee.userId);
      expect(error?.message).toContain("NOT_CHECKED_IN");
    });

    it("lets the host mark an attendee without any proximity check", async () => {
      const id = await gatheringWithAttendee(10 * MIN);
      const { data, error } = await host.client
        .from("gathering_attendees")
        .update({ checked_in_at: new Date().toISOString() })
        .eq("gathering_id", id)
        .eq("user_id", attendee.userId)
        .select("checked_in_at")
        .maybeSingle();
      expect(error).toBeNull();
      expect(data?.checked_in_at).toBeTruthy();
    });

    it("stops an attendee from touching someone else's row", async () => {
      const id = await gatheringWithAttendee(10 * MIN);
      const { error } = await admin
        .from("gathering_attendees")
        .insert({ gathering_id: id, user_id: host.userId });
      expect(error).toBeNull();

      const res = await attendee.client
        .from("gathering_attendees")
        .update({ checked_in_at: new Date().toISOString(), checkin_lat: VENUE.lat, checkin_lng: VENUE.lng })
        .eq("gathering_id", id)
        .eq("user_id", host.userId)
        .select("user_id");
      // RLS may filter the row out entirely; otherwise the trigger raises.
      if (res.error) expect(res.error.message).toMatch(/ATTENDANCE_FORBIDDEN|row-level/);
      else expect(res.data).toHaveLength(0);
    });
  });

  describe("prevent_locked_table_change", () => {
    it("locks a table that has a future gathering, and releases it on cancel", async () => {
      const fx2 = newFixture();
      try {
        // Reuse the suite's business: only one business per owner is allowed.
        const tableId = await createTable(admin, fx.businessId!, fx2, 4, "T-lock");
        const g = await createGathering(admin, fx2, {
          host_id: host.userId,
          business_id: fx2.businessId,
          table_id: tableId,
          seats: 4,
          starts_at: isoIn(24 * HOUR),
        });

        const del = await admin.from("venue_tables").delete().eq("id", tableId);
        expect(del.error?.message).toContain("TABLE_LOCKED");

        const shrink = await admin.from("venue_tables").update({ capacity: 2 }).eq("id", tableId);
        expect(shrink.error?.message).toContain("TABLE_CAPACITY_LOCKED");

        const cancel = await adminUser.client.from("gatherings").update({ status: "cancelled" }).eq("id", g.id);
        expect(cancel.error).toBeNull();

        const shrinkAgain = await admin.from("venue_tables").update({ capacity: 2 }).eq("id", tableId);
        expect(shrinkAgain.error).toBeNull();
      } finally {
        await teardown(admin, fx2);
      }
    });
  });

  describe("prevent_saved_location_status_change_by_owner", () => {
    it("lets the owner edit the label but not self-approve", async () => {
      const { data, error } = await attendee.client
        .from("saved_locations")
        .insert({
          user_id: attendee.userId,
          label: tag("Home"),
          address: tag("Test Street"),
          street_number: "1",
          description: tag("integration test location"),
          city: "Istanbul",
        })
        .select("id, status")
        .single();
      expect(error).toBeNull();
      fx.savedLocationIds.push(data!.id);

      const rename = await attendee.client
        .from("saved_locations")
        .update({ label: tag("Home 2") })
        .eq("id", data!.id);
      expect(rename.error).toBeNull();

      const approve = await attendee.client
        .from("saved_locations")
        .update({ status: "approved" })
        .eq("id", data!.id);
      expect(approve.error?.message).toMatch(/Only admins can change saved location status/i);
    });
  });
});
