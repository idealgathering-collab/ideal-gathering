// IG-006: marked loopback disposable database only, no hosted credentials.
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
async function actor(id, sql, params = [], role = "authenticated") {
  const c = new Client(config);
  await c.connect();
  try {
    await c.query(`BEGIN; SET LOCAL ROLE ${role}`);
    await c.query("SELECT set_config('request.jwt.claims',$1,true)", [
      JSON.stringify({ sub: id, role }),
    ]);
    return await c.query(sql, params);
  } finally {
    await c.query("ROLLBACK");
    await c.end();
  }
}
const ids = Object.fromEntries(
  ["owner", "viewer", "outsider", "unverified", "waitlisted", "venue"].map((k) => [
    k,
    randomUUID(),
  ]),
);
const profile = async (viewer, target) =>
  (await actor(viewer, "SELECT * FROM public.get_member_profile($1)", [target])).rows;
const moments = async (viewer, target) =>
  (await actor(viewer, "SELECT * FROM public.list_visible_life_moments($1,12)", [target])).rows;
await db.connect();
try {
  check(
    "disposable marker",
    (await db.query("SELECT purpose FROM ig001_test.marker")).rows[0].purpose,
    "disposable owner verification only",
  );
  await db.query(
    await readFile(
      new URL("../supabase/migrations/20260925120000_member_profile_privacy.sql", import.meta.url),
      "utf8",
    ),
  );
  for (const [kind, id] of Object.entries(ids)) {
    await db.query(
      "INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data) VALUES($1,$2,$3,$4)",
      [
        id,
        `ig006-${id}@example.invalid`,
        kind === "unverified" ? null : new Date(),
        JSON.stringify({
          display_name: `[test-IG006] ${kind}`,
          account_type: kind === "venue" ? "venue" : "user",
        }),
      ],
    );
    if (kind !== "waitlisted")
      await db.query("UPDATE public.profiles SET onboarded_at=now() WHERE id=$1", [id]);
  }
  await db.query("UPDATE public.app_config SET beta_launched=true");
  await db.query(
    "UPDATE public.profiles SET date_of_birth='1990-05-18',city='Member city',neighborhood='PRIVATE AREA',bio='Member introduction',interests=to_jsonb(ARRAY['Coffee']) WHERE id=$1",
    [ids.owner],
  );
  await db.query(
    "INSERT INTO public.user_gathering_preferences(user_id,intentions,social_energy,conversation_style,stranger_comfort,preferred_group_size) VALUES($1,to_jsonb(ARRAY['make_friends']),'calm','deep','warm_up',4)",
    [ids.owner],
  );
  ids.gathering = (
    await db.query(
      "INSERT INTO public.gatherings(host_id,subject,starts_at,seats,origin,status,venue_name,neighborhood) VALUES($1,'[test-IG006] Connection',now()+interval '2 days',5,'user_proposed','approved','PRIVATE VENUE','PRIVATE AREA') RETURNING id",
      [ids.owner],
    )
  ).rows[0].id;
  await db.query("INSERT INTO public.gathering_attendees(gathering_id,user_id) VALUES($1,$2)", [
    ids.gathering,
    ids.viewer,
  ]);
  for (const visibility of ["private", "profile"]) {
    await db.query(
      "INSERT INTO public.life_moments(user_id,title,note,happened_at,visibility) VALUES($1,$2,'PRIVATE NOTE',now()-interval '1 day',$3)",
      [ids.owner, visibility === "profile" ? "Shared memory" : "PRIVATE MEMORY", visibility],
    );
  }
  check("authorized upcoming participant", (await profile(ids.viewer, ids.owner)).length, 1);
  check("host views participant", (await profile(ids.owner, ids.viewer)).length, 1);
  const row = (await profile(ids.viewer, ids.owner))[0];
  check(
    "minimal safe projection",
    Object.keys(row).sort(),
    [
      "display_name",
      "avatar_url",
      "city",
      "bio",
      "interests",
      "intentions",
      "energy_level",
      "group_size",
      "talk_style",
      "new_people_pref",
    ].sort(),
  );
  check(
    "canonical style",
    [row.energy_level, row.group_size, row.talk_style, row.new_people_pref],
    ["calm", "small", "deep", "warm_up"],
  );
  check(
    "shared only",
    (await moments(ids.viewer, ids.owner)).map((m) => m.title),
    ["Shared memory"],
  );
  check(
    "no note or source gathering",
    Object.keys((await moments(ids.viewer, ids.owner))[0]).sort(),
    ["id", "user_id", "title", "photo_path", "happened_at"].sort(),
  );
  check("unrelated profile", await profile(ids.outsider, ids.owner), []);
  check("unrelated shared moments", await moments(ids.outsider, ids.owner), []);
  check("missing same as unrelated", await profile(ids.viewer, randomUUID()), []);
  for (const [a, b] of [
    [ids.viewer, ids.owner],
    [ids.owner, ids.viewer],
  ]) {
    await db.query("INSERT INTO public.user_blocks(blocker_id,blocked_id) VALUES($1,$2)", [a, b]);
    check("block direction hides profile", await profile(ids.viewer, ids.owner), []);
    check("block direction hides moments", await moments(ids.viewer, ids.owner), []);
    await db.query("DELETE FROM public.user_blocks WHERE blocker_id=$1 AND blocked_id=$2", [a, b]);
  }
  await db.query("UPDATE public.gatherings SET starts_at=now()-interval '1 day' WHERE id=$1", [
    ids.gathering,
  ]);
  check("past booking is not attendance", await profile(ids.viewer, ids.owner), []);
  check("past booking does not unlock moments", await moments(ids.viewer, ids.owner), []);
  await db.query(
    "UPDATE public.gathering_attendees SET checked_in_at=now()-interval '1 day' WHERE gathering_id=$1 AND user_id=$2",
    [ids.gathering, ids.viewer],
  );
  check("checked-in past relationship", (await profile(ids.viewer, ids.owner)).length, 1);
  await db.query("INSERT INTO public.user_roles(user_id,role) VALUES($1,'admin')", [ids.outsider]);
  await db.query("SELECT set_config('request.jwt.claims',$1,false)", [
    JSON.stringify({ sub: ids.outsider, role: "authenticated" }),
  ]);
  await db.query("UPDATE public.gatherings SET status='cancelled' WHERE id=$1", [ids.gathering]);
  check("cancelled connection unavailable", await profile(ids.viewer, ids.owner), []);
  const common = (
    await db.query(
      "INSERT INTO public.gatherings(host_id,subject,starts_at,seats,origin,status,venue_name,neighborhood) VALUES($1,'[test-IG006] Two participants',now()+interval '2 days',5,'user_proposed','approved','test','test') RETURNING id",
      [ids.outsider],
    )
  ).rows[0].id;
  await db.query(
    "INSERT INTO public.gathering_attendees(gathering_id,user_id) VALUES($1,$2),($1,$3)",
    [common, ids.owner, ids.viewer],
  );
  check("two participants authorize each other", (await profile(ids.viewer, ids.owner)).length, 1);
  for (const member of [ids.viewer, ids.owner]) {
    await db.query("INSERT INTO public.user_blocks(blocker_id,blocked_id) VALUES($1,$2)", [
      ids.outsider,
      member,
    ]);
    check("host block invalidates common context", await profile(ids.viewer, ids.owner), []);
    await db.query("DELETE FROM public.user_blocks WHERE blocker_id=$1 AND blocked_id=$2", [
      ids.outsider,
      member,
    ]);
  }
  await db.query("DELETE FROM public.gathering_attendees WHERE gathering_id=$1 AND user_id=$2", [
    common,
    ids.viewer,
  ]);
  check("leaving removes that relationship", await profile(ids.viewer, ids.owner), []);
  await db.query("DELETE FROM public.gatherings WHERE id=$1", [common]);
  await db.query("UPDATE public.gatherings SET status='approved' WHERE id=$1", [ids.gathering]);
  check("admin has no member-profile bypass", await profile(ids.outsider, ids.owner), []);
  await db.query("UPDATE auth.users SET email_confirmed_at=NULL WHERE id=$1", [ids.owner]);
  check("connected unverified target hidden", await profile(ids.viewer, ids.owner), []);
  check("connected unverified target moments hidden", await moments(ids.viewer, ids.owner), []);
  await db.query("UPDATE auth.users SET email_confirmed_at=now() WHERE id=$1", [ids.owner]);
  for (const kind of ["unverified", "waitlisted", "venue"]) {
    check(`${kind} viewer denied`, await profile(ids[kind], ids.owner), []);
    check(`${kind} target denied`, await profile(ids.owner, ids[kind]), []);
  }
  await assert.rejects(
    () => actor(ids.viewer, "SELECT * FROM public.get_member_profile($1)", [ids.owner], "anon"),
    /permission denied/,
  );
  check("anonymous execution denied", true, true);
  check(
    "owner raw private note retained",
    (await actor(ids.owner, "SELECT note FROM public.life_moments WHERE user_id=$1", [ids.owner]))
      .rows.length,
    2,
  );
  check(
    "other raw rows remain hidden",
    (await actor(ids.viewer, "SELECT * FROM public.life_moments WHERE user_id=$1", [ids.owner]))
      .rows,
    [],
  );
  // Existing IG-002 API fixtures now need an explicit eligible relationship.
  const legacy = JSON.parse(await readFile(resolve(runtime, "ig002-fixtures.json"), "utf8"));
  await db.query("UPDATE public.profiles SET onboarded_at=now() WHERE id=ANY($1::uuid[])", [
    [legacy.legacy, legacy.existing],
  ]);
  const g = (
    await db.query(
      "INSERT INTO public.gatherings(host_id,subject,starts_at,seats,origin,status,venue_name,neighborhood) VALUES($1,'[test-IG006] Canonical compatibility',now()+interval '2 days',5,'user_proposed','approved','test','test') RETURNING id",
      [legacy.legacy],
    )
  ).rows[0].id;
  await db.query("INSERT INTO public.gathering_attendees(gathering_id,user_id) VALUES($1,$2)", [
    g,
    legacy.existing,
  ]);
  await writeFile(resolve(runtime, "ig006-fixtures.json"), JSON.stringify(ids));
  console.log(`IG006 native checks passed: ${checks}`);
} finally {
  await db.end();
}
