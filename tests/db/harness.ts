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

/**
 * The suite provisions its own accounts through the service-role Auth Admin
 * API, so only the project credentials are strictly required. TEST_*_EMAIL /
 * TEST_*_PASSWORD env vars still win when a project prefers fixed accounts.
 */
export const dbTestsEnabled =
  env("TEST_DB_ENABLED") === "1" &&
  !!env("SUPABASE_URL") &&
  !!env("SUPABASE_SERVICE_ROLE_KEY") &&
  (!!env("SUPABASE_PUBLISHABLE_KEY") || !!env("SUPABASE_ANON_KEY"));

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

export const PROVISIONED_HOST_EMAIL = env("TEST_HOST_EMAIL") ?? "ig-test-host@example.com";
export const PROVISIONED_HOST_PASSWORD = env("TEST_HOST_PASSWORD") ?? "ig-test-host-Pw!2026";
export const PROVISIONED_ATTENDEE_EMAIL = env("TEST_ATTENDEE_EMAIL") ?? "ig-test-attendee@example.com";
export const PROVISIONED_ATTENDEE_PASSWORD = env("TEST_ATTENDEE_PASSWORD") ?? "ig-test-attendee-Pw!2026";

export async function signInHost() {
  const admin = adminClient();
  await ensureAccount(admin, PROVISIONED_HOST_EMAIL, PROVISIONED_HOST_PASSWORD, "user");
  return signIn(PROVISIONED_HOST_EMAIL, PROVISIONED_HOST_PASSWORD);
}

export async function signInAttendee() {
  const admin = adminClient();
  await ensureAccount(admin, PROVISIONED_ATTENDEE_EMAIL, PROVISIONED_ATTENDEE_PASSWORD, "user");
  return signIn(PROVISIONED_ATTENDEE_EMAIL, PROVISIONED_ATTENDEE_PASSWORD);
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

/* ------------------------------------------------------------------ */
/* Provisioned test accounts (admin + venue)                           */
/* ------------------------------------------------------------------ */

/**
 * The admin and venue accounts are created by the suite itself through the
 * service-role Auth Admin API, so no one has to hand-craft them. Emails and
 * passwords can still be overridden with env vars when a project prefers
 * dedicated pre-existing accounts.
 */
export const PROVISIONED_ADMIN_EMAIL = env("TEST_ADMIN_EMAIL") ?? "ig-test-admin@example.com";
export const PROVISIONED_ADMIN_PASSWORD = env("TEST_ADMIN_PASSWORD") ?? "ig-test-admin-Pw!2026";
export const PROVISIONED_VENUE_EMAIL = env("TEST_VENUE_EMAIL") ?? "ig-test-venue@example.com";
export const PROVISIONED_VENUE_PASSWORD = env("TEST_VENUE_PASSWORD") ?? "ig-test-venue-Pw!2026";

async function findUserByEmail(admin: SupabaseClient, email: string) {
  // listUsers is paginated; the test tenant is small, but scan a few pages anyway.
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

/**
 * Creates (or reuses) a confirmed auth account. Returns its id.
 * `accountType` is passed as user metadata so `handle_new_user` assigns the role.
 */
export async function ensureAccount(
  admin: SupabaseClient,
  email: string,
  password: string,
  accountType: "user" | "venue" = "user",
) {
  const existing = await findUserByEmail(admin, email);
  if (existing) {
    // Keep the password in sync so a rotated default cannot break sign-in.
    await admin.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
    return existing.id;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { account_type: accountType, display_name: tag("account") },
  });
  if (error || !data.user) throw new Error(`Could not provision ${email}: ${error?.message}`);
  return data.user.id;
}

/** Ensures the account holds the given role (service role only). */
export async function grantRole(admin: SupabaseClient, userId: string, role: "admin" | "venue" | "user") {
  const { data } = await admin.from("user_roles").select("id").eq("user_id", userId).eq("role", role).maybeSingle();
  if (data) return;
  const { error } = await admin.from("user_roles").insert({ user_id: userId, role });
  if (error) throw error;
}

/** Signs in as the provisioned admin, creating the account on first run. */
export async function signInAdmin(admin: SupabaseClient) {
  const id = await ensureAccount(admin, PROVISIONED_ADMIN_EMAIL, PROVISIONED_ADMIN_PASSWORD, "user");
  await grantRole(admin, id, "admin");
  return signIn(PROVISIONED_ADMIN_EMAIL, PROVISIONED_ADMIN_PASSWORD);
}

/** Signs in as the provisioned venue owner, creating the account on first run. */
export async function signInVenue(admin: SupabaseClient) {
  const id = await ensureAccount(admin, PROVISIONED_VENUE_EMAIL, PROVISIONED_VENUE_PASSWORD, "venue");
  await grantRole(admin, id, "venue");
  return signIn(PROVISIONED_VENUE_EMAIL, PROVISIONED_VENUE_PASSWORD);
}

/** Creates a throwaway signup used by the role/auth tests. Caller must delete it. */
export async function createThrowawayUser(
  admin: SupabaseClient,
  accountType: string | undefined,
  disposables: string[],
) {
  const email = `ig-test-${RUN_ID}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: `Tmp-${RUN_ID}-Pw!`,
    email_confirm: true,
    user_metadata: accountType === undefined ? { display_name: tag("temp") } : { account_type: accountType },
  });
  if (error || !data.user) throw new Error(`Could not create throwaway user: ${error?.message}`);
  disposables.push(data.user.id);
  return { id: data.user.id, email };
}

export async function deleteUsers(admin: SupabaseClient, ids: string[]) {
  for (const id of ids) {
    await admin.from("user_roles").delete().eq("user_id", id);
    await admin.auth.admin.deleteUser(id).catch(() => undefined);
  }
}

/* ------------------------------------------------------------------ */
/* Extra fixture helpers                                               */
/* ------------------------------------------------------------------ */

/** Inserts a saved location as its owner (so RLS + the pending default apply). */
export async function createSavedLocation(
  client: SupabaseClient,
  userId: string,
  fx: Fixture,
  values: Record<string, unknown> = {},
) {
  const { data, error } = await client
    .from("saved_locations")
    .insert({
      user_id: userId,
      label: tag("Home"),
      address: tag("Test Street"),
      street_number: "1",
      description: tag("integration test location"),
      city: "Istanbul",
      lat: VENUE.lat,
      lng: VENUE.lng,
      ...values,
    })
    .select("id, status")
    .single();
  if (error) throw error;
  fx.savedLocationIds.push(data.id);
  return data as { id: string; status: string };
}

/** Blocks `blockedId` as `blockerId` through the blocker's own client. */
export async function block(client: SupabaseClient, blockerId: string, blockedId: string) {
  const { error } = await client.from("user_blocks").insert({ blocker_id: blockerId, blocked_id: blockedId });
  if (error) throw error;
}

export async function unblockAll(admin: SupabaseClient, userIds: string[]) {
  if (userIds.length === 0) return;
  await admin.from("user_blocks").delete().in("blocker_id", userIds);
  await admin.from("user_blocks").delete().in("blocked_id", userIds);
}

export async function sendMessage(client: SupabaseClient, gatheringId: string, senderId: string, body: string) {
  return client
    .from("gathering_messages")
    .insert({ gathering_id: gatheringId, sender_id: senderId, body: tag(body) })
    .select("id")
    .maybeSingle();
}
