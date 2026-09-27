// Synthetic fixtures only, confined to the previously marked local database.
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
    const result = await c.query(sql, params);
    await c.query("COMMIT");
    return result;
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    await c.end();
  }
}
const ids = Object.fromEntries(
  [
    "venue",
    "otherVenue",
    "pending",
    "rejected",
    "unverified",
    "consumer",
    "a",
    "b",
    "c",
    "admin",
  ].map((k) => [k, randomUUID()]),
);
const summary = async (id, business = null, upcoming = 0, completed = 0) =>
  (
    await actor(id, "SELECT public.get_venue_dashboard($1,$2,$3) AS value", [
      business,
      upcoming,
      completed,
    ])
  ).rows[0].value;
async function denied(
  label,
  fn,
  pattern = /Dashboard unavailable|permission denied|row-level security/,
) {
  await assert.rejects(fn, pattern);
  check(label, true, true);
}
await db.connect();
try {
  check(
    "disposable marker",
    (await db.query("SELECT purpose FROM ig001_test.marker")).rows[0].purpose,
    "disposable owner verification only",
  );
  if (
    !(
      await db.query(
        "SELECT to_regprocedure('public.get_venue_dashboard(uuid,integer,integer)') AS name",
      )
    ).rows[0].name
  )
    await db.query(
      await readFile(
        new URL("../supabase/migrations/20260926210000_venue_value_layer.sql", import.meta.url),
        "utf8",
      ),
    );
  if (
    !(await db.query("SELECT to_regprocedure('public.lock_attendance_gathering()') AS name"))
      .rows[0].name
  )
    await db.query(
      await readFile(
        new URL(
          "../supabase/migrations/20260926213000_serialize_attendance_attribution.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
  if (
    !(
      await db.query(
        "SELECT 1 FROM pg_constraint WHERE conrelid='public.gatherings'::regclass AND conname='gatherings_venue_activation_seats_check'",
      )
    ).rowCount
  )
    await db.query(
      await readFile(
        new URL(
          "../supabase/migrations/20260927080000_venue_activation_small_groups.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
  for (const [kind, id] of Object.entries(ids)) {
    const venue = ["venue", "otherVenue", "pending", "rejected", "unverified"].includes(kind);
    await db.query(
      "INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data) VALUES($1,$2,$3,$4)",
      [
        id,
        `ig008-${id}@example.invalid`,
        kind === "unverified" ? null : new Date(),
        JSON.stringify({
          display_name: `[test-IG008] ${kind}`,
          account_type: venue ? "venue" : "user",
        }),
      ],
    );
    await db.query("UPDATE public.profiles SET onboarded_at=now() WHERE id=$1", [id]);
  }
  await db.query("INSERT INTO public.user_roles(user_id,role) VALUES($1,'admin')", [ids.admin]);
  await db.query("UPDATE public.app_config SET beta_launched=true");
  const businesses = {};
  for (const kind of ["venue", "otherVenue", "pending", "rejected", "unverified"]) {
    const b = (
      await actor(
        ids[kind],
        `INSERT INTO public.businesses(owner_id,name,description,address,city,lat,lng,cover_url,phone,mobile,status)
      VALUES($1,'[test-IG008] Cafe','Synthetic venue description','Test street','Test city',40,44,'https://example.invalid/cover','12345','12345','pending') RETURNING id`,
        [ids[kind]],
      )
    ).rows[0];
    businesses[kind] = b.id;
    if (kind !== "pending")
      await actor(ids.admin, "UPDATE public.businesses SET status=$2 WHERE id=$1", [
        b.id,
        kind === "rejected" ? "rejected" : "approved",
      ]);
  }
  check(
    "registration defaults pending",
    (
      await actor(ids.pending, "SELECT status FROM public.businesses WHERE id=$1", [
        businesses.pending,
      ])
    ).rows[0].status,
    "pending",
  );
  const table = (
    await actor(
      ids.venue,
      "INSERT INTO public.venue_tables(business_id,label,capacity) VALUES($1,'A',8) RETURNING id",
      [businesses.venue],
    )
  ).rows[0].id;
  await actor(ids.venue, "UPDATE public.venue_tables SET label='B',capacity=10 WHERE id=$1", [
    table,
  ]);
  check(
    "table edit",
    (await actor(ids.venue, "SELECT label,capacity FROM public.venue_tables WHERE id=$1", [table]))
      .rows[0],
    { label: "B", capacity: 10 },
  );
  const menu = (
    await actor(
      ids.venue,
      "INSERT INTO public.menu_items(business_id,name,price) VALUES($1,'Synthetic tea',2) RETURNING id",
      [businesses.venue],
    )
  ).rows[0].id;
  await actor(ids.venue, "UPDATE public.menu_items SET price=3 WHERE id=$1", [menu]);
  check(
    "menu edit",
    Number(
      (await actor(ids.venue, "SELECT price FROM public.menu_items WHERE id=$1", [menu])).rows[0]
        .price,
    ),
    3,
  );
  await actor(ids.venue, "DELETE FROM public.menu_items WHERE id=$1", [menu]);
  check(
    "menu removal",
    (await db.query("SELECT id FROM public.menu_items WHERE id=$1", [menu])).rowCount,
    0,
  );
  await actor(
    ids.venue,
    "UPDATE public.businesses SET description='Updated synthetic venue description' WHERE id=$1",
    [businesses.venue],
  );
  check(
    "profile save",
    (
      await actor(ids.venue, "SELECT description FROM public.businesses WHERE id=$1", [
        businesses.venue,
      ])
    ).rows[0].description,
    "Updated synthetic venue description",
  );
  for (const kind of ["pending", "rejected", "unverified"]) {
    await denied(kind + " analytics denied", () => summary(ids[kind]));
    await denied(kind + " table write denied", () =>
      actor(
        ids[kind],
        "INSERT INTO public.venue_tables(business_id,label,capacity) VALUES($1,'Denied',4)",
        [businesses[kind]],
      ),
    );
    await denied(kind + " menu write denied", () =>
      actor(ids[kind], "INSERT INTO public.menu_items(business_id,name) VALUES($1,'Denied')", [
        businesses[kind],
      ]),
    );
  }
  await denied("cross venue denied", () => summary(ids.otherVenue, businesses.venue));
  await denied("consumer denied", () => summary(ids.consumer, businesses.venue));
  await denied("anonymous denied", () =>
    actor(ids.venue, "SELECT public.get_venue_dashboard($1)", [businesses.venue], "anon"),
  );
  await denied("negative page denied", () => summary(ids.venue, null, -1));
  const blank = await summary(ids.otherVenue);
  check(
    "empty venue",
    [
      blank.visits,
      blank.unique_visitors,
      blank.new_visitors,
      blank.returning_visitors,
      blank.completed_count,
      blank.average_attendance,
      blank.categories,
    ],
    [0, 0, 0, 0, 0, null, null],
  );
  await db.query("UPDATE public.app_config SET beta_launched=false");
  await denied("closed beta denied", () => summary(ids.venue));
  await denied("closed beta table mutation denied", () =>
    actor(
      ids.venue,
      "INSERT INTO public.venue_tables(business_id,label,capacity) VALUES($1,'Denied',4)",
      [businesses.venue],
    ),
  );
  check("admin can inspect pending", (await summary(ids.admin, businesses.pending)).visits, 0);
  await db.query("UPDATE public.app_config SET beta_launched=true");
  const event = async (
    hours,
    status = "approved",
    business = businesses.venue,
    category = "coffee",
  ) =>
    (
      await db.query(
        "INSERT INTO public.gatherings(host_id,business_id,subject,starts_at,ends_at,seats,status,origin,gathering_type,venue_name,neighborhood) VALUES($1,$2,'[test-IG008] Gathering',now()-$3*interval '1 hour',now()-($3-2)*interval '1 hour',10,$4,'user_proposed',$5,'Synthetic venue','Synthetic area') RETURNING id",
        [ids.consumer, business, hours, status, category],
      )
    ).rows[0].id;
  const attend = async (g, user, hours, checked = true) =>
    db.query(
      "INSERT INTO public.gathering_attendees(gathering_id,user_id,checked_in_at,checked_in_by) VALUES($1,$2,CASE WHEN $4 THEN now()-$3*interval '1 hour' ELSE NULL END,CASE WHEN $4 THEN $2::uuid ELSE NULL END)",
      [g, user, hours, checked],
    );
  const old = await event(800);
  await attend(old, ids.a, 800);
  const one = await event(100);
  await attend(one, ids.a, 100);
  await attend(one, ids.b, 100);
  const two = await event(50, "approved", businesses.venue, "food");
  await attend(two, ids.b, 50);
  await attend(two, ids.c, 50);
  const ongoing = await event(0.5);
  await attend(ongoing, ids.a, 0.5);
  const future = await event(-10);
  await attend(future, ids.a, -10, false);
  const cancelled = await event(30);
  await attend(cancelled, ids.c, 30);
  await actor(ids.admin, "UPDATE public.gatherings SET status='cancelled' WHERE id=$1", [
    cancelled,
  ]);
  const rejected = await event(30, "rejected");
  await denied(
    "rejected gathering cannot gain attendance",
    () => attend(rejected, ids.c, 30),
    /GATHERING_CLOSED/,
  );
  const unrelated = await event(30, "approved", businesses.otherVenue);
  await attend(unrelated, ids.c, 30);
  await attend(two, ids.consumer, 50, false);
  const first = await summary(ids.venue);
  check(
    "real traffic counts",
    [first.visits, first.unique_visitors, first.new_visitors, first.returning_visitors],
    [5, 3, 2, 1],
  );
  check("completed and average", [first.completed_count, first.average_attendance], [2, 2]);
  check("upcoming includes ongoing", first.upcoming_count, 2);
  check(
    "activity lists exclude unrelated",
    first.completed.map((g) => g.id),
    [two, one],
  );
  check("no low-sample pattern", first.categories, null);
  check(
    "trend reconciles",
    first.periods.reduce((sum, p) => sum + p.visits, 0),
    5,
  );
  check(
    "venues do not get consumer route bypass",
    first.upcoming.every((g) => g.can_open === false),
    true,
  );
  for (const privateValue of [
    ids.a,
    ids.b,
    ids.c,
    "email",
    "checkin_lat",
    "checkin_lng",
    "note",
    "owner_id",
    "host_id",
  ])
    check("no private field or identity", JSON.stringify(first).includes(privateValue), false);
  for (const reverse of [false, true]) {
    const blocker = reverse ? ids.a : ids.venue,
      blocked = reverse ? ids.venue : ids.a;
    await db.query("INSERT INTO public.user_blocks(blocker_id,blocked_id) VALUES($1,$2)", [
      blocker,
      blocked,
    ]);
    check("both-way attendee block", (await summary(ids.venue)).visits, 3);
    await db.query("DELETE FROM public.user_blocks WHERE blocker_id=$1 AND blocked_id=$2", [
      blocker,
      blocked,
    ]);
  }
  await db.query("INSERT INTO public.user_blocks(blocker_id,blocked_id) VALUES($1,$2)", [
    ids.consumer,
    ids.venue,
  ]);
  check("blocked host removes gatherings", (await summary(ids.venue)).completed_count, 0);
  await db.query("DELETE FROM public.user_blocks WHERE blocker_id=$1 AND blocked_id=$2", [
    ids.consumer,
    ids.venue,
  ]);
  const forged = (
    await actor(
      ids.b,
      "INSERT INTO public.gathering_attendees(gathering_id,user_id,checked_in_at,checked_in_by) VALUES($1,$2,now(),$2) RETURNING checked_in_at",
      [ongoing, ids.b],
    )
  ).rows[0];
  check("join cannot forge attendance", forged.checked_in_at, null);
  await actor(
    ids.b,
    "UPDATE public.gathering_attendees SET checked_in_at=now()-interval '10 years',checkin_lat=40,checkin_lng=44 WHERE gathering_id=$1 AND user_id=$2",
    [ongoing, ids.b],
  );
  check(
    "valid self check-in stamped by server",
    (
      await db.query(
        "SELECT checked_in_at>now()-interval '1 minute' AS recent,checked_in_by=$2 AS actor FROM public.gathering_attendees WHERE gathering_id=$1 AND user_id=$2",
        [ongoing, ids.b],
      )
    ).rows[0],
    { recent: true, actor: true },
  );
  await denied(
    "attribution cannot move after attendance",
    () =>
      actor(ids.consumer, "UPDATE public.gatherings SET business_id=$2 WHERE id=$1", [
        two,
        businesses.otherVenue,
      ]),
    /ATTENDANCE_ATTRIBUTION_LOCKED/,
  );
  // Drop synthetic test check-in row so the aggregate fixture remains deterministic.
  await db.query("DELETE FROM public.gathering_attendees WHERE gathering_id=$1 AND user_id=$2", [
    ongoing,
    ids.b,
  ]);
  for (const hours of [10, 12, 14]) {
    const g = await event(hours);
    await attend(g, ids.b, hours);
    await attend(g, ids.c, hours);
  }
  check("sufficient real category sample", (await summary(ids.venue)).categories, [
    { category: "coffee", count: 4 },
    { category: "food", count: 1 },
  ]);
  for (let i = 0; i < 21; i++) await event(-24 - i * 3);
  const page0 = await summary(ids.venue),
    page1 = await summary(ids.venue, null, 1);
  check(
    "bounded list full count",
    [page0.upcoming_count, page0.upcoming.length, page1.upcoming.length],
    [23, 20, 3],
  );
  check(
    "pages do not overlap",
    page1.upcoming.some((g) => page0.upcoming.some((p) => p.id === g.id)),
    false,
  );
  const owner = JSON.parse(await readFile(resolve(runtime, "fixtures.json"), "utf8")).adminA;
  // Existing owner fixture may be adminB depending on serialized bootstrap winner.
  const actualOwner =
    (await db.query("SELECT user_id FROM public.user_roles WHERE role='owner' LIMIT 1")).rows[0]
      ?.user_id ?? owner;
  check("Owner preview aggregate", (await summary(actualOwner, businesses.venue)).visits, 11);
  check(
    "Owner preview no mutation via aggregate",
    (
      await db.query("SELECT count(*)::int AS n FROM public.menu_items WHERE business_id=$1", [
        businesses.venue,
      ])
    ).rows[0].n,
    0,
  );
  const free = (
    await actor(
      ids.venue,
      "INSERT INTO public.venue_tables(business_id,label,capacity) VALUES($1,'Remove',4) RETURNING id",
      [businesses.venue],
    )
  ).rows[0].id;
  await actor(ids.venue, "DELETE FROM public.venue_tables WHERE id=$1", [free]);
  check(
    "unused table removal",
    (await db.query("SELECT id FROM public.venue_tables WHERE id=$1", [free])).rowCount,
    0,
  );
  // Existing activation is reused, including table association and removal lock.
  for (const seats of [1, 6, 30]) {
    await denied(
      "venue activation rejects " + seats + " seats",
      () =>
        actor(
          ids.venue,
          "INSERT INTO public.gatherings(host_id,business_id,table_id,subject,starts_at,ends_at,seats,status,origin,venue_name,neighborhood) VALUES($1,$2,$3,'[test-IG008] Invalid capacity',now()+interval '5 days',now()+interval '5 days 2 hours',$4,'approved','venue_activated','','')",
          [ids.venue, businesses.venue, table, seats],
        ),
      /gatherings_venue_activation_seats_check/,
    );
  }
  const activation = (
    await actor(
      ids.venue,
      "INSERT INTO public.gatherings(host_id,business_id,table_id,subject,starts_at,ends_at,seats,status,origin,venue_name,neighborhood) VALUES($1,$2,$3,'[test-IG008] Venue activation',now()+interval '1 day',now()+interval '1 day 2 hours',4,'approved','venue_activated','','') RETURNING id",
      [ids.venue, businesses.venue, table],
    )
  ).rows[0].id;
  for (const seats of [2, 5]) {
    const result = await actor(
      ids.venue,
      "UPDATE public.gatherings SET seats=$2 WHERE id=$1 RETURNING seats",
      [activation, seats],
    );
    check("venue activation accepts boundary " + seats, result.rows[0].seats, seats);
  }
  await denied(
    "venue activation cannot expand above five",
    () => actor(ids.venue, "UPDATE public.gatherings SET seats=6 WHERE id=$1", [activation]),
    /gatherings_venue_activation_seats_check/,
  );
  check(
    "venue activation appears",
    (await summary(ids.venue)).upcoming.some((g) => g.id === activation && g.venue_hosted),
    true,
  );
  await denied(
    "active table remains protected",
    () => actor(ids.venue, "DELETE FROM public.venue_tables WHERE id=$1", [table]),
    /TABLE_LOCKED/,
  );
  await actor(ids.venue, "DELETE FROM public.gatherings WHERE id=$1", [activation]);
  // The new bound is origin-specific; consumer gathering rules are unchanged.
  const consumerLarge = await event(-200);
  await actor(ids.consumer, "UPDATE public.gatherings SET seats=6 WHERE id=$1", [consumerLarge]);
  check(
    "consumer capacity outside venue path unchanged",
    (await db.query("SELECT seats FROM public.gatherings WHERE id=$1", [consumerLarge])).rows[0]
      .seats,
    6,
  );
  await denied(
    "changing origin cannot bypass venue bound",
    () =>
      db.query("UPDATE public.gatherings SET origin='venue_activated',table_id=$2 WHERE id=$1", [
        consumerLarge,
        table,
      ]),
    /gatherings_venue_activation_seats_check/,
  );
  await db.query("DELETE FROM public.gatherings WHERE id=$1", [consumerLarge]);
  // Fixed transaction clock proves cutoff inclusion and disjoint bucket boundaries.
  await db.query("BEGIN");
  for (const hours of [720, 480, 240]) {
    const g = await event(hours, "approved", businesses.otherVenue);
    await attend(g, ids.a, hours);
  }
  await db.query("SET LOCAL ROLE authenticated");
  await db.query("SELECT set_config('request.jwt.claims',$1,true)", [
    JSON.stringify({ sub: ids.otherVenue, role: "authenticated" }),
  ]);
  const boundary = (await db.query("SELECT public.get_venue_dashboard() AS value")).rows[0].value;
  check(
    "exact cutoff and period boundaries",
    boundary.periods.map((p) => p.visits),
    [1, 1, 2],
  );
  await db.query("ROLLBACK");
  // An in-flight gathering edit locks attendance writes until its new venue/time is visible.
  const locking = new Client(config),
    checking = new Client(config);
  await locking.connect();
  await checking.connect();
  const race = await event(0.25);
  await attend(race, ids.b, 0, false);
  try {
    await locking.query("BEGIN");
    await locking.query(
      "UPDATE public.gatherings SET starts_at=now()+interval '2 days',ends_at=now()+interval '2 days 2 hours' WHERE id=$1",
      [race],
    );
    await checking.query("BEGIN; SET LOCAL ROLE authenticated");
    await checking.query("SELECT set_config('request.jwt.claims',$1,true)", [
      JSON.stringify({ sub: ids.b, role: "authenticated" }),
    ]);
    const pid = (await checking.query("SELECT pg_backend_pid() AS pid")).rows[0].pid;
    const pending = checking
      .query(
        "UPDATE public.gathering_attendees SET checked_in_at=now(),checkin_lat=40,checkin_lng=44 WHERE gathering_id=$1 AND user_id=$2",
        [race, ids.b],
      )
      .then(
        () => null,
        (e) => e,
      );
    let waiting = false;
    for (let i = 0; i < 40; i++) {
      waiting = (
        await db.query(
          "SELECT wait_event_type='Lock' AS waiting FROM pg_stat_activity WHERE pid=$1",
          [pid],
        )
      ).rows[0]?.waiting;
      if (waiting) break;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    check("attendance waits on attribution edit", waiting, true);
    await locking.query("COMMIT");
    const failure = await pending;
    check(
      "attendance validates committed new time",
      /CHECKIN_TOO_EARLY/.test(failure?.message ?? ""),
      true,
    );
    await checking.query("ROLLBACK");
  } finally {
    await locking.query("ROLLBACK");
    await checking.query("ROLLBACK");
    await locking.end();
    await checking.end();
    await db.query("DELETE FROM public.gatherings WHERE id=$1", [race]);
  }
  await writeFile(
    resolve(runtime, "ig008-fixtures.json"),
    JSON.stringify({ ...ids, businesses, table, owner: actualOwner, one, two, future, ongoing }),
  );
  console.log(`IG008 native checks passed: ${checks}`);
} finally {
  await db.end();
}
