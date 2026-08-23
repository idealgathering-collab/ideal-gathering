import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  adminClient,
  createBusiness,
  createGathering,
  createSavedLocation,
  createTable,
  dbTestsEnabled,
  isoIn,
  newFixture,
  signInAdmin,
  signInAttendee,
  signInHost,
  signInVenue,
  tag,
  teardown,
  type Fixture,
} from "./harness";

const d = dbTestsEnabled ? describe : describe.skip;
const HOUR = 60 * 60 * 1000;

d("approval state machines", () => {
  let admin: SupabaseClient;
  let host: { client: SupabaseClient; userId: string };
  let attendee: { client: SupabaseClient; userId: string };
  let adminUser: { client: SupabaseClient; userId: string };
  let venue: { client: SupabaseClient; userId: string };
  const fx: Fixture = newFixture();

  beforeAll(async () => {
    admin = adminClient();
    host = await signInHost();
    attendee = await signInAttendee();
    adminUser = await signInAdmin(admin);
    venue = await signInVenue(admin);
  });

  afterAll(async () => {
    try {
      await teardown(admin, fx);
    } finally {
      await Promise.all(
        [host, attendee, adminUser, venue].map((a) => a?.client.auth.signOut().catch(() => undefined)),
      );
    }
  });

  describe("gatherings", () => {
    it("keeps status changes away from the host and allows them for an admin", async () => {
      const g = await createGathering(admin, fx, {
        host_id: host.userId,
        status: "proposed",
        origin: "user_proposed",
      });

      const selfApprove = await host.client.from("gatherings").update({ status: "approved" }).eq("id", g.id);
      expect(selfApprove.error?.message ?? "").toMatch(/Only admins can change gathering status/i);

      const approved = await adminUser.client
        .from("gatherings")
        .update({ status: "approved" })
        .eq("id", g.id)
        .select("status")
        .maybeSingle();
      expect(approved.error).toBeNull();
      expect(approved.data?.status).toBe("approved");

      const rejected = await adminUser.client
        .from("gatherings")
        .update({ status: "rejected" })
        .eq("id", g.id)
        .select("status")
        .maybeSingle();
      expect(rejected.error).toBeNull();
      expect(rejected.data?.status).toBe("rejected");
    });

    it("lets the host edit non-status fields of their own gathering", async () => {
      const g = await createGathering(admin, fx, { host_id: host.userId, status: "proposed" });
      const { error } = await host.client
        .from("gatherings")
        .update({ subject: tag("Renamed gathering") })
        .eq("id", g.id);
      expect(error).toBeNull();
    });
  });

  describe("businesses", () => {
    it("blocks owner self-approval and allows admin approval", async () => {
      const fx2 = newFixture();
      try {
        const bizId = await createBusiness(admin, venue.userId, fx2);
        const toPending = await admin.from("businesses").update({ status: "pending" }).eq("id", bizId);
        expect(toPending.error).toBeNull();

        const selfApprove = await venue.client.from("businesses").update({ status: "approved" }).eq("id", bizId);
        expect(selfApprove.error?.message ?? "").toMatch(/Only admins can change business status/i);

        const rename = await venue.client
          .from("businesses")
          .update({ description_extra: tag("owner edit") })
          .eq("id", bizId);
        expect(rename.error).toBeNull();

        const approved = await adminUser.client
          .from("businesses")
          .update({ status: "approved" })
          .eq("id", bizId)
          .select("id")
          .maybeSingle();
        expect(approved.error).toBeNull();
      } finally {
        await teardown(admin, fx2);
      }
    });
  });

  describe("saved locations", () => {
    it("submits as pending, blocks self-approval, and lets an admin approve or reject", async () => {
      const created = await createSavedLocation(attendee.client, attendee.userId, fx);
      expect(created.status).toBe("pending");

      const selfApprove = await attendee.client
        .from("saved_locations")
        .update({ status: "approved" })
        .eq("id", created.id);
      expect(selfApprove.error?.message ?? "").toMatch(/Only admins can change saved location status/i);

      const approved = await adminUser.client
        .from("saved_locations")
        .update({ status: "approved" })
        .eq("id", created.id)
        .select("status")
        .maybeSingle();
      expect(approved.error).toBeNull();
      expect(approved.data?.status).toBe("approved");

      // Only approved locations show up in the picker query used by create-gathering.
      const picker = await attendee.client
        .from("saved_locations")
        .select("id")
        .eq("user_id", attendee.userId)
        .eq("status", "approved");
      expect((picker.data ?? []).map((r) => r.id)).toContain(created.id);

      const rejected = await adminUser.client
        .from("saved_locations")
        .update({ status: "rejected", reject_reason: tag("not a public place") })
        .eq("id", created.id)
        .select("status, reject_reason")
        .maybeSingle();
      expect(rejected.error).toBeNull();
      expect(rejected.data?.status).toBe("rejected");

      const pickerAfter = await attendee.client
        .from("saved_locations")
        .select("id")
        .eq("user_id", attendee.userId)
        .eq("status", "approved");
      expect((pickerAfter.data ?? []).map((r) => r.id)).not.toContain(created.id);
    });

    it("keeps one user's saved locations invisible to another user", async () => {
      const mine = await createSavedLocation(attendee.client, attendee.userId, fx, { label: tag("Private spot") });
      const seen = await host.client.from("saved_locations").select("id").eq("id", mine.id);
      expect(seen.data ?? []).toHaveLength(0);
    });
  });

  describe("venue tables", () => {
    it("rejects duplicate labels and locks a table with an active gathering", async () => {
      const fx2 = newFixture();
      try {
        await createBusiness(admin, venue.userId, fx2);
        const tableId = await createTable(admin, fx2.businessId!, fx2, 4);

        const dup = await admin
          .from("venue_tables")
          .insert({ business_id: fx2.businessId, label: tag("T1").toUpperCase(), capacity: 4 })
          .select("id")
          .maybeSingle();
        expect(dup.error).not.toBeNull();
        if (dup.data?.id) await admin.from("venue_tables").delete().eq("id", dup.data.id);

        await createGathering(admin, fx2, {
          host_id: host.userId,
          business_id: fx2.businessId,
          table_id: tableId,
          seats: 4,
          starts_at: isoIn(24 * HOUR),
        });

        const del = await admin.from("venue_tables").delete().eq("id", tableId);
        expect(del.error?.message ?? "").toContain("TABLE_LOCKED");

        const shrink = await admin.from("venue_tables").update({ capacity: 2 }).eq("id", tableId);
        expect(shrink.error?.message ?? "").toContain("TABLE_CAPACITY_LOCKED");
      } finally {
        await teardown(admin, fx2);
      }
    });
  });
});
