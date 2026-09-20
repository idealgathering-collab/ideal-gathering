// Only the marked loopback disposable cluster; never reads hosted credentials.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
const runtime = resolve(process.argv[2]);
const require = createRequire(resolve(runtime, "package.json"));
const { Client } = require("pg");
const config = { host: "127.0.0.1", port: 55439, user: "postgres", database: "ig001_disposable" };
const db = new Client(config);
let checks = 0;
function check(label, actual, expected) {
  assert.deepEqual(actual, expected, label);
  console.log(`PASS ${++checks}: ${label}`);
}
async function actor(id, sql, params = [], role = "authenticated") {
  const client = new Client(config);
  await client.connect();
  try {
    await client.query(`BEGIN; SET LOCAL ROLE ${role}`);
    await client.query("SELECT set_config('request.jwt.claims',$1,true)", [
      JSON.stringify({ sub: id, role }),
    ]);
    const result = await client.query(sql, params);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}
async function denied(label, run, pattern) {
  await assert.rejects(run, pattern);
  check(label, true, true);
}
const ids = Object.fromEntries(
  ["owner", "viewer", "outsider", "unverified", "waitlisted", "venue"].map((k) => [
    k,
    randomUUID(),
  ]),
);
async function create(id, gathering = null, visibility = "private") {
  return (
    await actor(
      id,
      "INSERT INTO public.life_moments(user_id,gathering_id,title,note,happened_at,visibility) VALUES($1,$2,'[test-IG003] Memory','private note',now()-interval '1 day',$3) RETURNING *",
      [id, gathering, visibility],
    )
  ).rows[0];
}
await db.connect();
try {
  check(
    "disposable marker",
    (await db.query("SELECT purpose FROM ig001_test.marker")).rows[0].purpose,
    "disposable owner verification only",
  );
  // Platform scaffold only: the prior IG-001 cluster did not need storage.buckets.
  await db.query(
    "CREATE TABLE IF NOT EXISTS storage.buckets(id text PRIMARY KEY,name text NOT NULL,public boolean DEFAULT false,file_size_limit bigint,allowed_mime_types text[])",
  );
  if (!(await db.query("SELECT to_regclass('public.life_moments') AS name")).rows[0].name) {
    await db.query(
      await readFile(
        new URL(
          "../supabase/migrations/20260919210000_life_moments_foundation.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    console.log("APPLIED IG-003 additive migration");
  }
  await db.query(
    "GRANT USAGE ON SCHEMA storage TO anon,authenticated,service_role; GRANT SELECT,INSERT,UPDATE,DELETE ON storage.objects TO anon,authenticated,service_role",
  );
  for (const [kind, id] of Object.entries(ids)) {
    await db.query(
      "INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data) VALUES($1,$2,$3,$4)",
      [
        id,
        `ig003-${id}@example.invalid`,
        kind === "unverified" ? null : new Date(),
        JSON.stringify({
          display_name: `[test-IG003] ${kind}`,
          account_type: kind === "venue" ? "venue" : "user",
        }),
      ],
    );
    if (kind !== "waitlisted")
      await db.query("UPDATE public.profiles SET onboarded_at=now() WHERE id=$1", [id]);
  }
  await db.query("UPDATE public.app_config SET beta_launched=true");
  const gathering = (
    await db.query(
      "INSERT INTO public.gatherings(host_id,subject,starts_at,ends_at,seats,origin,status,venue_name,neighborhood,city,lat,lng) VALUES($1,'[test-IG003] Original event',now()-interval '2 days',now()-interval '47 hours',5,'user_proposed','approved','private venue','private area','private city',40,44) RETURNING id,starts_at",
      [ids.owner],
    )
  ).rows[0];
  ids.gathering = gathering.id;
  await db.query(
    "INSERT INTO public.gathering_attendees(gathering_id,user_id,checked_in_at) VALUES($1,$2,now()-interval '2 days')",
    [gathering.id, ids.viewer],
  );
  const future = (
    await db.query(
      "INSERT INTO public.gatherings(host_id,subject,starts_at,seats,origin,status,venue_name,neighborhood) VALUES($1,'[test-IG003] Future',now()+interval '2 days',5,'user_proposed','approved','test','test') RETURNING id",
      [ids.owner],
    )
  ).rows[0].id;
  const cancelled = (
    await db.query(
      "INSERT INTO public.gatherings(host_id,subject,starts_at,seats,origin,status,venue_name,neighborhood) VALUES($1,'[test-IG003] Cancelled',now()-interval '2 days',5,'user_proposed','cancelled','test','test') RETURNING id",
      [ids.owner],
    )
  ).rows[0].id;
  const moment = await create(ids.owner);
  ids.privateMoment = moment.id;
  check("manual private create", [moment.user_id, moment.visibility], [ids.owner, "private"]);
  check(
    "own raw private read includes note",
    (await actor(ids.owner, "SELECT note FROM public.life_moments WHERE id=$1", [moment.id])).rows,
    [{ note: "private note" }],
  );
  check(
    "other raw private read empty",
    (await actor(ids.viewer, "SELECT * FROM public.life_moments WHERE id=$1", [moment.id])).rows,
    [],
  );
  check(
    "own update",
    (
      await actor(
        ids.owner,
        "UPDATE public.life_moments SET title='Changed' WHERE id=$1 RETURNING title",
        [moment.id],
      )
    ).rows,
    [{ title: "Changed" }],
  );
  check(
    "other update no rows",
    (
      await actor(
        ids.viewer,
        "UPDATE public.life_moments SET visibility='profile',note='attack',photo_path=NULL WHERE id=$1 RETURNING id",
        [moment.id],
      )
    ).rows,
    [],
  );
  check(
    "other delete no rows",
    (
      await actor(ids.viewer, "DELETE FROM public.life_moments WHERE id=$1 RETURNING id", [
        moment.id,
      ])
    ).rows,
    [],
  );
  await denied(
    "cannot forge owner",
    () =>
      actor(
        ids.viewer,
        "INSERT INTO public.life_moments(user_id,title,happened_at) VALUES($1,'Forged',now())",
        [ids.owner],
      ),
    /Forbidden/,
  );
  for (const field of ["user_id", "gathering_id", "created_at"])
    await denied(
      `immutable ${field} grant`,
      () =>
        actor(ids.owner, `UPDATE public.life_moments SET ${field}=${field} WHERE id=$1`, [
          moment.id,
        ]),
      /permission denied/,
    );
  await denied(
    "anon raw denied",
    () => actor(null, "SELECT * FROM public.life_moments", [], "anon"),
    /permission denied/,
  );
  await denied(
    "anon projection denied",
    () => actor(null, "SELECT * FROM public.list_visible_life_moments($1)", [ids.owner], "anon"),
    /permission denied/,
  );
  for (const kind of ["unverified", "waitlisted", "venue"]) {
    await denied(`${kind} create denied`, () => create(ids[kind]), /Forbidden/);
    await denied(
      `${kind} shared read denied`,
      () => actor(ids[kind], "SELECT * FROM public.list_visible_life_moments($1)", [ids.owner]),
      /Forbidden/,
    );
  }
  const shared = await create(ids.owner, null, "profile");
  ids.sharedMoment = shared.id;
  check(
    "raw shared row still owner only",
    (await actor(ids.viewer, "SELECT * FROM public.life_moments WHERE id=$1", [shared.id])).rows,
    [],
  );
  const visible = (
    await actor(ids.viewer, "SELECT * FROM public.list_visible_life_moments($1)", [ids.owner])
  ).rows;
  check(
    "safe shared projection excludes private moment",
    visible.map((r) => r.id),
    [shared.id],
  );
  check(
    "projection fields only",
    Object.keys(visible[0]).sort(),
    ["id", "user_id", "title", "photo_path", "happened_at"].sort(),
  );
  await actor(ids.viewer, "INSERT INTO public.user_blocks(blocker_id,blocked_id) VALUES($1,$2)", [
    ids.viewer,
    ids.owner,
  ]);
  check(
    "viewer block hides shared",
    (await actor(ids.viewer, "SELECT * FROM public.list_visible_life_moments($1)", [ids.owner]))
      .rows,
    [],
  );
  await actor(ids.viewer, "DELETE FROM public.user_blocks WHERE blocker_id=$1 AND blocked_id=$2", [
    ids.viewer,
    ids.owner,
  ]);
  await actor(ids.owner, "INSERT INTO public.user_blocks(blocker_id,blocked_id) VALUES($1,$2)", [
    ids.owner,
    ids.viewer,
  ]);
  check(
    "owner block hides shared",
    (await actor(ids.viewer, "SELECT * FROM public.list_visible_life_moments($1)", [ids.owner]))
      .rows,
    [],
  );
  await actor(ids.owner, "DELETE FROM public.user_blocks WHERE blocker_id=$1 AND blocked_id=$2", [
    ids.owner,
    ids.viewer,
  ]);
  await denied("invalid FK rejected", () => create(ids.owner, randomUUID()), /Invalid gathering/);
  await denied(
    "nonparticipant cannot claim",
    () => create(ids.outsider, gathering.id),
    /Invalid gathering/,
  );
  await denied("future event rejected", () => create(ids.owner, future), /Invalid gathering/);
  await denied("cancelled event rejected", () => create(ids.owner, cancelled), /Invalid gathering/);
  const linked = await create(ids.owner, gathering.id);
  check("host moment snapshots gathering date", linked.happened_at, gathering.starts_at);
  await denied(
    "linked date immutable",
    () =>
      actor(ids.owner, "UPDATE public.life_moments SET happened_at=now() WHERE id=$1", [linked.id]),
    /Immutable gathering date/,
  );
  const results = await Promise.allSettled([
    create(ids.viewer, gathering.id),
    create(ids.viewer, gathering.id),
  ]);
  check("separate connections exactly one linked insert", results.map((r) => r.status).sort(), [
    "fulfilled",
    "rejected",
  ]);
  check(
    "duplicate failure unique constraint",
    results.find((r) => r.status === "rejected").reason.code,
    "23505",
  );
  await create(ids.owner);
  check("multiple manual moments allowed", true, true);
  await db.query(
    "UPDATE public.gatherings SET subject='[test-IG003] renamed',starts_at=starts_at-interval '1 day' WHERE id=$1",
    [gathering.id],
  );
  check(
    "event edits do not rewrite moment",
    (
      await actor(ids.owner, "SELECT title,happened_at FROM public.life_moments WHERE id=$1", [
        linked.id,
      ])
    ).rows,
    [{ title: linked.title, happened_at: linked.happened_at }],
  );
  // Use another linked event to verify deletion without destroying API fixtures.
  const deleteEvent = (
    await db.query(
      "INSERT INTO public.gatherings(host_id,subject,starts_at,seats,origin,status,venue_name,neighborhood) VALUES($1,'[test-IG003] delete',now()-interval '2 days',5,'user_proposed','approved','test','test') RETURNING id",
      [ids.owner],
    )
  ).rows[0].id;
  const survivor = await create(ids.owner, deleteEvent);
  await actor(ids.owner, "DELETE FROM public.gatherings WHERE id=$1", [deleteEvent]);
  check(
    "gathering deletion preserves personal record",
    (
      await actor(
        ids.owner,
        "SELECT gathering_id,title,happened_at FROM public.life_moments WHERE id=$1",
        [survivor.id],
      )
    ).rows,
    [{ gathering_id: null, title: survivor.title, happened_at: survivor.happened_at }],
  );
  await denied(
    "visibility constrained",
    () =>
      actor(ids.owner, "UPDATE public.life_moments SET visibility='public' WHERE id=$1", [
        moment.id,
      ]),
    /check constraint/,
  );
  await denied(
    "blank title constrained",
    () => actor(ids.owner, "UPDATE public.life_moments SET title=' ' WHERE id=$1", [moment.id]),
    /check constraint/,
  );
  await denied(
    "long private note constrained",
    () =>
      actor(ids.owner, "UPDATE public.life_moments SET note=repeat('x',2001) WHERE id=$1", [
        moment.id,
      ]),
    /check constraint/,
  );
  await denied(
    "future manual date rejected",
    () =>
      actor(
        ids.owner,
        "UPDATE public.life_moments SET happened_at=now()+interval '1 day' WHERE id=$1",
        [moment.id],
      ),
    /check constraint/,
  );
  await denied(
    "cross-owner photo reference rejected",
    () =>
      actor(ids.owner, "UPDATE public.life_moments SET photo_path=$2 WHERE id=$1", [
        moment.id,
        `${ids.viewer}/${moment.id}/${randomUUID()}.jpg`,
      ]),
    /check constraint/,
  );
  const path = `${ids.owner}/${shared.id}/${randomUUID()}.jpg`;
  ids.photoPath = path;
  check(
    "private bounded image bucket",
    (
      await db.query(
        "SELECT public,file_size_limit,allowed_mime_types FROM storage.buckets WHERE id='life-moment-media'",
      )
    ).rows,
    [
      {
        public: false,
        file_size_limit: "5242880",
        allowed_mime_types: ["image/jpeg", "image/png", "image/webp"],
      },
    ],
  );
  // Deliberately broad policy proves restrictive policies protect only this bucket.
  await db.query(
    'CREATE POLICY "IG003 test broad storage" ON storage.objects FOR ALL TO authenticated,anon USING(true) WITH CHECK(true)',
  );
  try {
    await actor(
      ids.owner,
      "INSERT INTO storage.objects(bucket_id,name) VALUES('life-moment-media',$1)",
      [path],
    );
    await actor(ids.owner, "UPDATE public.life_moments SET photo_path=$2 WHERE id=$1", [
      shared.id,
      path,
    ]);
    check(
      "viewer cannot directly read or mint media URLs",
      (await actor(ids.viewer, "SELECT name FROM storage.objects WHERE name=$1", [path])).rows,
      [],
    );
    await denied(
      "other upload rejected",
      () =>
        actor(
          ids.viewer,
          "INSERT INTO storage.objects(bucket_id,name) VALUES('life-moment-media',$1)",
          [`${ids.owner}/${shared.id}/${randomUUID()}.jpg`],
        ),
      /row-level security/,
    );
    check(
      "other media delete denied",
      (await actor(ids.viewer, "DELETE FROM storage.objects WHERE name=$1 RETURNING name", [path]))
        .rows,
      [],
    );
    check(
      "no image overwrite",
      (
        await actor(
          ids.owner,
          "UPDATE storage.objects SET name=name WHERE name=$1 RETURNING name",
          [path],
        )
      ).rows,
      [],
    );
    check(
      "anon media hidden",
      (await actor(null, "SELECT name FROM storage.objects WHERE name=$1", [path], "anon")).rows,
      [],
    );
    await actor(ids.owner, "UPDATE public.life_moments SET visibility='private' WHERE id=$1", [
      shared.id,
    ]);
    check(
      "hiding revokes shared metadata",
      (await actor(ids.viewer, "SELECT * FROM public.list_visible_life_moments($1)", [ids.owner]))
        .rows,
      [],
    );
    check(
      "hiding revokes new media reads",
      (await actor(ids.viewer, "SELECT name FROM storage.objects WHERE name=$1", [path])).rows,
      [],
    );
    check(
      "owner private media still readable",
      (await actor(ids.owner, "SELECT name FROM storage.objects WHERE name=$1", [path])).rows,
      [{ name: path }],
    );
    await actor(ids.owner, "UPDATE public.life_moments SET visibility='profile' WHERE id=$1", [
      shared.id,
    ]);
  } finally {
    await db.query('DROP POLICY "IG003 test broad storage" ON storage.objects');
  }
  const deleted = await create(ids.owner);
  check(
    "owner deletes own moment",
    (
      await actor(ids.owner, "DELETE FROM public.life_moments WHERE id=$1 RETURNING id", [
        deleted.id,
      ])
    ).rows,
    [{ id: deleted.id }],
  );
  // Existing gathering, check-in and avatar policies remain operational.
  const activeEvent = (
    await db.query(
      "INSERT INTO public.gatherings(host_id,subject,starts_at,ends_at,seats,origin,status,venue_name,neighborhood) VALUES($1,'[test-IG003] Active',now()-interval '1 hour',now()+interval '1 hour',5,'user_proposed','approved','test','test') RETURNING id",
      [ids.owner],
    )
  ).rows[0].id;
  await actor(
    ids.viewer,
    "INSERT INTO public.gathering_attendees(gathering_id,user_id) VALUES($1,$2)",
    [activeEvent, ids.viewer],
  );
  check(
    "existing gathering join",
    (
      await actor(
        ids.viewer,
        "SELECT user_id FROM public.gathering_attendees WHERE gathering_id=$1",
        [activeEvent],
      )
    ).rows,
    [{ user_id: ids.viewer }],
  );
  await denied(
    "joined but unchecked event in progress rejected",
    () => create(ids.viewer, activeEvent),
    /Invalid gathering/,
  );
  await actor(
    ids.viewer,
    "UPDATE public.gathering_attendees SET checked_in_at=now() WHERE gathering_id=$1 AND user_id=$2",
    [activeEvent, ids.viewer],
  );
  check(
    "existing self check-in",
    (
      await actor(
        ids.viewer,
        "SELECT checked_in_at IS NOT NULL AS present FROM public.gathering_attendees WHERE gathering_id=$1 AND user_id=$2",
        [activeEvent, ids.viewer],
      )
    ).rows,
    [{ present: true }],
  );
  await actor(
    ids.viewer,
    "UPDATE public.gathering_attendees SET checked_out_at=now() WHERE gathering_id=$1 AND user_id=$2",
    [activeEvent, ids.viewer],
  );
  check(
    "existing self check-out",
    (
      await actor(
        ids.viewer,
        "SELECT checked_out_at IS NOT NULL AS present FROM public.gathering_attendees WHERE gathering_id=$1 AND user_id=$2",
        [activeEvent, ids.viewer],
      )
    ).rows,
    [{ present: true }],
  );
  const avatar = `${ids.owner}/ig003-${randomUUID()}.jpg`;
  await actor(ids.owner, "INSERT INTO storage.objects(bucket_id,name) VALUES('avatars',$1)", [
    avatar,
  ]);
  check(
    "existing avatar visibility unchanged",
    (await actor(ids.viewer, "SELECT name FROM storage.objects WHERE name=$1", [avatar])).rows,
    [{ name: avatar }],
  );
  await actor(ids.owner, "DELETE FROM storage.objects WHERE name=$1", [avatar]);
  await db.query("UPDATE public.app_config SET beta_launched=false");
  try {
    await denied("beta gate prevents new moments", () => create(ids.owner), /Forbidden/);
    await actor(ids.owner, "UPDATE public.life_moments SET visibility='private' WHERE id=$1", [
      shared.id,
    ]);
    check(
      "owner can hide after beta gate closes",
      (
        await actor(ids.owner, "SELECT visibility FROM public.life_moments WHERE id=$1", [
          shared.id,
        ])
      ).rows,
      [{ visibility: "private" }],
    );
  } finally {
    await db.query("UPDATE public.app_config SET beta_launched=true");
  }
  await actor(ids.owner, "UPDATE public.life_moments SET visibility='profile' WHERE id=$1", [
    shared.id,
  ]);
  await db.query("INSERT INTO public.gathering_attendees(gathering_id,user_id) VALUES($1,$2)", [
    gathering.id,
    ids.outsider,
  ]);
  await denied(
    "unchecked participant cannot claim a completed event",
    () => create(ids.outsider, gathering.id),
    /Invalid gathering/,
  );
  ids.apiGathering = (
    await db.query(
      "INSERT INTO public.gatherings(host_id,subject,starts_at,seats,origin,status,venue_name,neighborhood) VALUES($1,'[test-IG003] API source',now()-interval '3 days',5,'user_proposed','approved','test','test') RETURNING id",
      [ids.owner],
    )
  ).rows[0].id;
  const business = (
    await db.query(
      "INSERT INTO public.businesses(owner_id,name,description,address,city,cover_url,lat,lng,mobile,phone,street_number) VALUES($1,'[test-IG003] Venue','test','test','test','test',0,0,'test','test','1') RETURNING id",
      [ids.venue],
    )
  ).rows[0].id;
  check(
    "venue still reads own business",
    (await actor(ids.venue, "SELECT id FROM public.businesses WHERE id=$1", [business])).rows,
    [{ id: business }],
  );
  check(
    "venue still edits own description",
    (
      await actor(
        ids.venue,
        "UPDATE public.businesses SET description='[test-IG003] Edited' WHERE id=$1 RETURNING description",
        [business],
      )
    ).rows,
    [{ description: "[test-IG003] Edited" }],
  );
  await actor(
    ids.venue,
    "INSERT INTO public.venue_tables(business_id,label,capacity) VALUES($1,'[test-IG003] Table',4)",
    [business],
  );
  check(
    "venue table workflow remains usable",
    (
      await actor(ids.venue, "SELECT capacity FROM public.venue_tables WHERE business_id=$1", [
        business,
      ])
    ).rows,
    [{ capacity: 4 }],
  );
  await writeFile(resolve(runtime, "ig003-fixtures.json"), JSON.stringify(ids));
  console.log(`PASS: ${checks} IG-003 native checks. Synthetic fixtures retained.`);
} finally {
  await db.end();
}
