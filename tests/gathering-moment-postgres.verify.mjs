// Synthetic fixtures only, in the marked loopback cluster used by IG-003.
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
const runtime = resolve(process.argv[2]);
const require = createRequire(resolve(runtime, "package.json"));
const { Client } = require("pg");
const config = { host: "127.0.0.1", port: 55439, user: "postgres", database: "ig001_disposable" };
const db = new Client(config);
const ids = JSON.parse(await readFile(resolve(runtime, "ig003-fixtures.json"), "utf8"));
let checks = 0;
function check(label, value, expected) {
  assert.deepEqual(value, expected, label);
  console.log(`PASS ${++checks}: ${label}`);
}
async function actor(id, sql, params = [], role = "authenticated") {
  const connection = new Client(config);
  await connection.connect();
  try {
    await connection.query(`BEGIN; SET LOCAL ROLE ${role}`);
    await connection.query("SELECT set_config('request.jwt.claims',$1,true)", [
      JSON.stringify({ sub: id, role }),
    ]);
    const result = await connection.query(sql, params);
    await connection.query("COMMIT");
    return result.rows;
  } catch (error) {
    await connection.query("ROLLBACK");
    throw error;
  } finally {
    await connection.end();
  }
}
const context = (user, id) =>
  actor(user, "SELECT * FROM public.get_gathering_moment_context($1)", [id]);
await db.connect();
try {
  check(
    "disposable marker",
    (await db.query("SELECT purpose FROM ig001_test.marker")).rows[0].purpose,
    "disposable owner verification only",
  );
  const sql = await readFile(
    new URL("../supabase/migrations/20260924120000_gathering_moment_context.sql", import.meta.url),
    "utf8",
  );
  if (
    !(await db.query("SELECT to_regprocedure('public.get_gathering_moment_context(uuid)') AS fn"))
      .rows[0].fn
  )
    await db.query(sql);
  const installed = (
    await db.query(
      "SELECT prosrc,prosecdef FROM pg_proc WHERE oid='public.get_gathering_moment_context(uuid)'::regprocedure",
    )
  ).rows[0];
  check("installed function equals migration", installed.prosrc.trim(), sql.split("$$")[1].trim());
  check("RPC uses caller permissions/RLS", installed.prosecdef, false);
  const events = {};
  for (const [name, age, end, status] of [
    ["ended", "-2 days", "-47 hours", "approved"],
    ["future", "2 days", "49 hours", "approved"],
    ["cancelled", "-2 days", "-47 hours", "cancelled"],
    ["fallbackEnded", "-3 hours", null, "approved"],
    ["fallbackLive", "-1 hour", null, "approved"],
  ]) {
    events[name] = (
      await db.query(
        "INSERT INTO public.gatherings(host_id,subject,starts_at,ends_at,seats,origin,status,venue_name,neighborhood,city) VALUES($1,$2,now()+$3::interval,CASE WHEN $4::text IS NULL THEN NULL ELSE now()+$4::interval END,5,'user_proposed',$5,'Test place','Test area','Test city') RETURNING id,subject,starts_at",
        [ids.owner, `[test-IG004] ${name}`, age, end, status],
      )
    ).rows[0];
  }
  await db.query(
    "INSERT INTO public.gathering_attendees(gathering_id,user_id,checked_in_at) VALUES($1,$2,now()-interval '2 days'),($1,$3,NULL)",
    [events.ended.id, ids.viewer, ids.outsider],
  );
  const prefill = await context(ids.owner, events.ended.id);
  check("host eligible without attendee record", prefill.length, 1);
  check("prefilled title/date/place, no people or coordinates", prefill[0], {
    id: events.ended.id,
    title: events.ended.subject,
    happened_at: events.ended.starts_at,
    place: "Test place · Test city",
  });
  check("checked-in attendee eligible", (await context(ids.viewer, events.ended.id)).length, 1);
  check("joined but unchecked attendee denied", await context(ids.outsider, events.ended.id), []);
  check("nonparticipant denied", await context(ids.viewer, events.fallbackEnded.id), []);
  for (const name of ["future", "cancelled", "fallbackLive"])
    check(`${name} has no prompt`, await context(ids.owner, events[name].id), []);
  check(
    "missing end uses two-hour rule",
    (await context(ids.owner, events.fallbackEnded.id)).length,
    1,
  );
  for (const kind of ["unverified", "waitlisted", "venue"])
    check(`${kind} no context`, await context(ids[kind], events.ended.id), []);
  await assert.rejects(
    () =>
      actor(
        ids.owner,
        "SELECT * FROM public.get_gathering_moment_context($1)",
        [events.ended.id],
        "anon",
      ),
    /permission denied/,
  );
  check("anonymous execution denied", true, true);
  for (const [blocker, blocked] of [
    [ids.owner, ids.viewer],
    [ids.viewer, ids.owner],
  ]) {
    await db.query("INSERT INTO public.user_blocks(blocker_id,blocked_id) VALUES($1,$2)", [
      blocker,
      blocked,
    ]);
    try {
      check(
        "blocked pair receives no live context",
        await context(ids.viewer, events.ended.id),
        [],
      );
    } finally {
      await db.query("DELETE FROM public.user_blocks WHERE blocker_id=$1 AND blocked_id=$2", [
        blocker,
        blocked,
      ]);
    }
  }
  // Save and rating remain independent; neither consumes or replaces the other.
  const rows = await actor(
    ids.viewer,
    "INSERT INTO public.life_moments(user_id,gathering_id,title,happened_at) VALUES($1,$2,$3,now()) RETURNING id,note,photo_path,visibility",
    [ids.viewer, events.ended.id, prefill[0].title],
  );
  check(
    "core-only save defaults private; photo/note optional",
    [rows[0].note, rows[0].photo_path, rows[0].visibility],
    [null, null, "private"],
  );
  check(
    "rating still works after saving a moment",
    (
      await actor(
        ids.viewer,
        "INSERT INTO public.gathering_ratings(gathering_id,rater_id,score) VALUES($1,$2,5) RETURNING score",
        [events.ended.id, ids.viewer],
      )
    )[0].score,
    5,
  );
  check(
    "sharing existing moment works",
    (
      await actor(
        ids.viewer,
        "UPDATE public.life_moments SET visibility='profile' WHERE id=$1 RETURNING visibility",
        [rows[0].id],
      )
    )[0].visibility,
    "profile",
  );
  // Fresh fixtures for real HTTP tests; checked-in attendee's existing row is deliberate.
  await writeFile(
    resolve(runtime, "ig004-fixtures.json"),
    JSON.stringify({ ...ids, events, existingMoment: rows[0].id }, null, 2),
  );
  console.log(`IG004 native checks passed: ${checks}`);
} finally {
  await db.end();
}
