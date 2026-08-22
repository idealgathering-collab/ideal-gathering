import { adminClient, dbTestsEnabled, TEST_TAG_PREFIX } from "./harness";

/**
 * Sweeps rows left behind by a crashed run. Only touches rows whose visible
 * label starts with the `[test-` prefix AND that are older than one hour, so a
 * currently running suite is never affected.
 */
export async function teardown() {
  if (!dbTestsEnabled) return;
  const admin = adminClient();
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const like = `${TEST_TAG_PREFIX}%`;

  const { data: stale } = await admin
    .from("gatherings")
    .select("id")
    .like("subject", like)
    .lt("created_at", cutoff);
  const ids = (stale ?? []).map((r) => r.id);
  if (ids.length > 0) {
    await admin.from("gathering_ratings").delete().in("gathering_id", ids);
    await admin.from("gathering_attendees").delete().in("gathering_id", ids);
    await admin.from("gathering_messages").delete().in("gathering_id", ids);
    await admin.from("gatherings").delete().in("id", ids);
  }
  await admin.from("saved_locations").delete().like("label", like).lt("created_at", cutoff);
  await admin.from("venue_tables").delete().like("label", like).lt("created_at", cutoff);
  await admin.from("businesses").delete().like("name", like).lt("created_at", cutoff);
}

export function setup() {
  /* nothing to prepare; teardown() runs after the suite */
}
