import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Integration harness for the hosted database.
 *
 * SAFETY RULES (see .lovable/plan.md):
 *  - Runs only when TEST_DB_ENABLED=1 and the test credentials are present.
 *  - Every row it creates is tagged with `[test-<runId>]` in a human-visible
 *    text column; nothing without that tag is ever written or deleted.
 *  - Teardown always runs in a `finally` block, children before parents.
 *  - The service-role client is used for setup/teardown only; assertions run
 *    through signed-in anon clients so RLS and triggers really apply.
 */

export const TEST_TAG_PREFIX = "[test-";

export const RUN_ID = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
export const RUN_TAG = `${TEST_TAG_PREFIX}${RUN_ID}]`;

export function tag(label: string) {
  return `${RUN_TAG} ${label}`;
}

export function env(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

export const dbTestsEnabled =
  env("TEST_DB_ENABLED") === "1" &&
  !!env("SUPABASE_URL") &&
  !!env("SUPABASE_SERVICE_ROLE_KEY") &&
  !!env("TEST_HOST_EMAIL") &&
  !!env("TEST_HOST_PASSWORD") &&
  !!env("TEST_ATTENDEE_EMAIL") &&
  !!env("TEST_ATTENDEE_PASSWORD");

export function adminClient(): SupabaseClient {
  return createClient(env("SUPABASE_URL")!, env("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function signIn(email: string, password: string) {
  const client = createClient(env("SUPABASE_URL")!, env("SUPABASE_PUBLISHABLE_KEY") ?? env("SUPABASE_ANON_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(`Test account sign-in failed for ${email}: ${error?.message}`);
  return { client, userId: data.user.id };
}

export async function signInHost() {
  return signIn(env("TEST_HOST_EMAIL")!, env("TEST_HOST_PASSWORD")!);
}

export async function signInAttendee() {
  return signIn(env("TEST_ATTENDEE_EMAIL")!, env("TEST_ATTENDEE_PASSWORD")!);
}

export function isoIn(ms: number) {
  return new Date(Date.now() + ms).toISOString();
}

/** Coordinates of a fictional test venue plus a point ~5 km away. */
export const VENUE = { lat: 41.0082, lng: 28.9784 };
export const FAR_AWAY = { lat: 41.0532, lng: 28.9784 };

export type Fixture = {
  businessId?: string;
  tableId?: string;
  gatheringIds: string[];
  savedLocationIds: string[];
};

export function newFixture(): Fixture {
  return { gatheringIds: [], savedLocationIds: [] };
}

/** Creates an approved business owned by the test host. */
export async function createBusiness(admin: SupabaseClient, ownerId: string, fx: Fixture, city = "Istanbul") {
  const { data, error } = await admin
    .from("businesses")
    .insert({
      owner_id: ownerId,
      name: tag("Cafe"),
      description: tag("integration test business"),
      description_extra: "",
      address: tag("Test Street"),
      street_number: "1",
      city,
      cover_url: "",
      phone: "",
      mobile: "",
      status: "approved",
      lat: VENUE.lat,
      lng: VENUE.lng,
    })
    .select("id")
    .single();
  if (error) throw error;
  fx.businessId = data.id;
  return data.id as string;
}

export async function createTable(admin: SupabaseClient, businessId: string, fx: Fixture, capacity = 4) {
  const { data, error } = await admin
    .from("venue_tables")
    .insert({ business_id: businessId, label: tag("T1"), capacity })
    .select("id")
    .single();
  if (error) throw error;
  fx.tableId = data.id;
  return data.id as string;
}

export async function createGathering(
  admin: SupabaseClient,
  fx: Fixture,
  values: Record<string, unknown>,
) {
  const { data, error } = await admin
    .from("gatherings")
    .insert({
      subject: tag("Gathering"),
      description: tag("integration test gathering"),
      venue_name: tag("Venue"),
      neighborhood: "Test",
      seats: 4,
      status: "approved",
      origin: "user_created",
      starts_at: isoIn(60 * 60 * 1000),
      lat: VENUE.lat,
      lng: VENUE.lng,
      ...values,
    })
    .select("id, city")
    .single();
  if (error) throw error;
  fx.gatheringIds.push(data.id);
  return data;
}

/** Deletes everything this run created, children first. Safe to call twice. */
export async function teardown(admin: SupabaseClient, fx: Fixture) {
  if (fx.gatheringIds.length > 0) {
    await admin.from("gathering_ratings").delete().in("gathering_id", fx.gatheringIds);
    await admin.from("gathering_attendees").delete().in("gathering_id", fx.gatheringIds);
    await admin.from("gathering_messages").delete().in("gathering_id", fx.gatheringIds);
    await admin.from("gatherings").delete().in("id", fx.gatheringIds);
  }
  if (fx.savedLocationIds.length > 0) {
    await admin.from("saved_locations").delete().in("id", fx.savedLocationIds);
  }
  if (fx.tableId) await admin.from("venue_tables").delete().eq("id", fx.tableId);
  if (fx.businessId) await admin.from("businesses").delete().eq("id", fx.businessId);
}

/** Postgres error message helper: true when the error names the given trigger code. */
export function raised(error: { message?: string } | null, code: string) {
  return !!error?.message?.includes(code);
}
