// Only the previously marked loopback disposable cluster. Synthetic data only.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
const runtime = resolve(process.argv[2]);
const { Client } = createRequire(resolve(runtime, "package.json"))("pg");
const config = { host: "127.0.0.1", port: 55439, user: "postgres", database: "ig001_disposable" };
const db = new Client(config);
let checks = 0;
function check(label, actual, expected) {
  assert.deepEqual(actual, expected, label);
  console.log(`PASS ${++checks}: ${label}`);
}
async function actor(
  id,
  sql = "SELECT public.get_my_life_summary() AS summary",
  params = [],
  role = "authenticated",
) {
  const c = new Client(config);
  await c.connect();
  try {
    await c.query(`BEGIN; SET LOCAL ROLE ${role}`);
    await c.query("SELECT set_config('request.jwt.claims',$1,true)", [
      JSON.stringify({ sub: id, role }),
    ]);
    return (await c.query(sql, params)).rows;
  } finally {
    await c.query("ROLLBACK");
    await c.end();
  }
}
const ids = Object.fromEntries(
  ["owner", "viewer", "empty", "unverified", "waitlisted", "venue"].map((k) => [k, randomUUID()]),
);
const summary = async (id) => (await actor(id))[0].summary;
await db.connect();
try {
  check(
    "disposable marker",
    (await db.query("SELECT purpose FROM ig001_test.marker")).rows[0].purpose,
    "disposable owner verification only",
  );
  if (
    !(await db.query("SELECT to_regprocedure('public.get_my_life_summary()') AS name")).rows[0].name
  )
    await db.query(
      await readFile(
        new URL("../supabase/migrations/20260926160000_own_life_summary.sql", import.meta.url),
        "utf8",
      ),
    );
  check(
    "invoker preserves caller RLS",
    (
      await db.query(
        "SELECT prosecdef FROM pg_proc WHERE oid='public.get_my_life_summary()'::regprocedure",
      )
    ).rows[0].prosecdef,
    false,
  );
  for (const [kind, id] of Object.entries(ids)) {
    await db.query(
      "INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data) VALUES($1,$2,$3,$4)",
      [
        id,
        `ig007-${id}@example.invalid`,
        kind === "unverified" ? null : new Date(),
        JSON.stringify({
          display_name: `[test-IG007] ${kind}`,
          account_type: kind === "venue" ? "venue" : "user",
        }),
      ],
    );
    if (kind !== "waitlisted")
      await db.query("UPDATE public.profiles SET onboarded_at=now() WHERE id=$1", [id]);
  }
  await db.query("UPDATE public.app_config SET beta_launched=true");
  const event = async (host, hours, type = "coffee", status = "approved", duration = 1) =>
    (
      await db.query(
        "INSERT INTO public.gatherings(host_id,subject,starts_at,ends_at,seats,origin,status,venue_name,neighborhood,gathering_type) VALUES($1,'[test-IG007] PRIVATE SUBJECT',now()-$2*interval '1 hour',now()-($2-$3)*interval '1 hour',5,'user_proposed',$4,'PRIVATE PLACE','PRIVATE AREA',$5) RETURNING id",
        [host, hours, duration, status, type],
      )
    ).rows[0].id;
  const join = async (g, id, checked = true) =>
    db.query(
      "INSERT INTO public.gathering_attendees(gathering_id,user_id,checked_in_at) VALUES($1,$2,$3)",
      [g, id, checked ? new Date() : null],
    );
  const hosted = await event(ids.owner, 600);
  await join(hosted, ids.owner); // host + attendee still once
  const joined = await event(ids.viewer, 300, "food");
  await join(joined, ids.owner);
  const unknown = await event(ids.owner, 24, "unknown-private-category");
  await event(ids.owner, 800);
  await event(ids.owner, 10, "coffee", "cancelled");
  await event(ids.owner, 10, "coffee", "proposed");
  await event(ids.owner, -24);
  await event(ids.owner, 1, "coffee", "approved", 3);
  const unchecked = await event(ids.viewer, 24);
  await join(unchecked, ids.owner, false);
  await event(ids.viewer, 48); // unrelated
  for (const visibility of ["private", "profile"])
    await db.query(
      "INSERT INTO public.life_moments(user_id,title,note,happened_at,visibility) VALUES($1,'[test-IG007] PRIVATE TITLE','PRIVATE NOTE','2020-01-01',$2)",
      [ids.owner, visibility],
    );
  // Backdate only this synthetic row; trigger restored before committing local fixture setup.
  await db.query("BEGIN; ALTER TABLE public.life_moments DISABLE TRIGGER guard_life_moment");
  await db.query(
    "INSERT INTO public.life_moments(user_id,title,happened_at,created_at) VALUES($1,'Old saved moment','2020-01-01',now()-interval '800 hours')",
    [ids.owner],
  );
  await db.query("ALTER TABLE public.life_moments ENABLE TRIGGER guard_life_moment; COMMIT");
  const first = await summary(ids.owner);
  check("eligible gatherings exactly once", first.gatherings, 3);
  check("saved date includes old memories and private moments", first.moments, 2);
  check("canonical categories deterministic and unknown grouped", first.categories, [
    { category: "coffee", count: 1 },
    { category: "food", count: 1 },
    { category: "other", count: 1 },
  ]);
  check(
    "three disjoint chronological buckets",
    first.periods.map((p) => p.gatherings),
    [1, 1, 1],
  );
  check(
    "rolling window exactly 720 hours",
    Date.parse(first.period_end) - Date.parse(first.period_start),
    720 * 3600000,
  );
  check(
    "only aggregate keys",
    Object.keys(first).sort(),
    ["period_start", "period_end", "gatherings", "moments", "categories", "periods"].sort(),
  );
  for (const secret of ["PRIVATE", ids.owner, ids.viewer, hosted, joined, unknown])
    check("no identity/source/free text leak", JSON.stringify(first).includes(secret), false);
  for (const [a, b] of [
    [ids.owner, ids.viewer],
    [ids.viewer, ids.owner],
  ]) {
    await db.query("INSERT INTO public.user_blocks(blocker_id,blocked_id) VALUES($1,$2)", [a, b]);
    check(
      "both block directions exclude hosted relationship",
      (await summary(ids.owner)).gatherings,
      2,
    );
    await db.query("DELETE FROM public.user_blocks WHERE blocker_id=$1 AND blocked_id=$2", [a, b]);
  }
  const empty = await summary(ids.empty);
  check(
    "empty owner safe counts",
    [empty.gatherings, empty.moments, empty.categories, empty.periods.map((p) => p.gatherings)],
    [0, 0, [], [0, 0, 0]],
  );
  check("other caller receives own moments only", (await summary(ids.viewer)).moments, 0);
  await assert.rejects(
    () => actor(ids.viewer, "SELECT public.get_my_life_summary($1::uuid)", [ids.owner]),
    /does not exist/,
  );
  check("no target-user overload", true, true);
  for (const kind of ["unverified", "waitlisted", "venue"]) {
    await assert.rejects(() => summary(ids[kind]), /Summary unavailable/);
    check(`${kind} rejected`, true, true);
  }
  await assert.rejects(() => actor(ids.owner, undefined, [], "anon"), /permission denied/);
  check("anonymous rejected", true, true);
  // Prove counts are not limited by the own timeline's 100-row cap.
  await db.query(
    "INSERT INTO public.life_moments(user_id,title,happened_at) SELECT $1,'[test-IG007] many','2020-01-01'::timestamptz FROM generate_series(1,101)",
    [ids.owner],
  );
  check("period count exceeds timeline cap", (await summary(ids.owner)).moments, 103);
  // Exact cutoff/bucket boundaries share one transaction clock.
  await db.query("BEGIN");
  await event(ids.empty, 720);
  await event(ids.empty, 480);
  await event(ids.empty, 240);
  await db.query("SET LOCAL ROLE authenticated");
  await db.query("SELECT set_config('request.jwt.claims',$1,true)", [
    JSON.stringify({ sub: ids.empty, role: "authenticated" }),
  ]);
  const boundary = (await db.query("SELECT public.get_my_life_summary() AS summary")).rows[0]
    .summary;
  check(
    "exact cutoff included and boundaries not doubled",
    boundary.periods.map((p) => p.gatherings),
    [1, 1, 1],
  );
  await db.query("ROLLBACK");
  for (let i = 0; i < 25; i++) await event(ids.owner, 12);
  check("gathering count exceeds bounded history", (await summary(ids.owner)).gatherings, 28);
  await writeFile(resolve(runtime, "ig007-fixtures.json"), JSON.stringify(ids));
  console.log(`IG007 native checks passed: ${checks}`);
} finally {
  await db.end();
}
