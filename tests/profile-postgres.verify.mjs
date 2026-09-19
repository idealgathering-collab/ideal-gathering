// Use only the loopback disposable cluster created by owner-postgres.setup.mjs.
// No hosted/environment credentials. Run: node tests/profile-postgres.verify.mjs <runtime>
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createRequire } from "node:module";

const runtime = resolve(process.argv[2]);
const require = createRequire(resolve(runtime, "package.json"));
const { Client } = require("pg");
const db = new Client({
  host: "127.0.0.1",
  port: 55439,
  user: "postgres",
  database: "ig001_disposable",
});
const ids = Object.fromEntries(
  ["legacy", "existing", "unknown", "fresh"].map((k) => [k, randomUUID()]),
);
const migration = await readFile(
  new URL(
    "../supabase/migrations/20260919150000_profile_preference_ownership.sql",
    import.meta.url,
  ),
  "utf8",
);
let checks = 0;
function check(name, actual, expected) {
  assert.deepEqual(actual, expected, name);
  console.log(`PASS ${++checks}: ${name}`);
}
async function asUser(id, sql, params = [], role = "authenticated") {
  await db.query("SAVEPOINT actor");
  try {
    await db.query(`SET LOCAL ROLE ${role}`);
    await db.query("SELECT set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ sub: id, role }),
    ]);
    const result = await db.query(sql, params);
    await db.query("RESET ROLE; RELEASE SAVEPOINT actor");
    return result;
  } catch (error) {
    await db.query("ROLLBACK TO SAVEPOINT actor; RELEASE SAVEPOINT actor");
    throw error;
  }
}
async function save(id, profile, preferences) {
  return asUser(id, "SELECT public.save_my_profile_data($1::jsonb,$2::jsonb) AS saved", [
    JSON.stringify(profile),
    JSON.stringify(preferences),
  ]);
}
async function profile(id) {
  return (await db.query("SELECT * FROM public.profiles WHERE id=$1", [id])).rows[0];
}
async function prefs(id) {
  return (await db.query("SELECT * FROM public.user_gathering_preferences WHERE user_id=$1", [id]))
    .rows[0];
}

await db.connect();
try {
  check(
    "disposable database marker",
    (await db.query("SELECT purpose FROM ig001_test.marker")).rows[0].purpose,
    "disposable owner verification only",
  );
  await db.query("BEGIN");
  for (const key of ["legacy", "existing", "unknown"]) {
    await db.query(
      "INSERT INTO auth.users(id,email,raw_user_meta_data,email_confirmed_at) VALUES ($1,$2,$3,now())",
      [
        ids[key],
        `ig002-${key}-${ids[key]}@example.invalid`,
        JSON.stringify({ display_name: `[test-IG002] ${key}` }),
      ],
    );
  }
  await db.query(
    "UPDATE public.profiles SET intentions=ARRAY['get_out','legacy-custom'], energy_level='calm', talk_style='listener', new_people_pref='love', group_size='small', bio='original', date_of_birth='1990-05-12', nationality='AM', gender='female' WHERE id=$1",
    [ids.legacy],
  );
  await db.query(
    "UPDATE public.profiles SET intentions=ARRAY['stale'], energy_level='lively', group_size='unmapped-old-value' WHERE id=$1",
    [ids.unknown],
  );
  const legacyBefore = await profile(ids.legacy);
  const tableExisted =
    (await db.query("SELECT to_regclass('public.user_gathering_preferences') AS name")).rows[0]
      .name !== null;
  await db.query(migration);
  check(
    tableExisted ? "existing-shaped table migration succeeds" : "missing preference table created",
    (await prefs(ids.legacy)).intentions,
    ["get_out", "legacy-custom"],
  );
  check(
    "legacy text preserved without semantic guessing",
    [
      (await prefs(ids.legacy)).social_energy,
      (await prefs(ids.legacy)).conversation_style,
      (await prefs(ids.legacy)).stranger_comfort,
    ],
    ["calm", "listener", "love"],
  );
  check("established group bucket backfilled", (await prefs(ids.legacy)).preferred_group_size, 4);
  check("legacy profile untouched by backfill", await profile(ids.legacy), legacyBefore);
  check(
    "unknown legacy group retained in profile",
    (await profile(ids.unknown)).group_size,
    "unmapped-old-value",
  );
  check(
    "unknown group does not invent numeric preference",
    (await prefs(ids.unknown)).preferred_group_size,
    null,
  );

  await db.query(
    "UPDATE public.user_gathering_preferences SET intentions='[]', social_energy=NULL, preferred_group_size=NULL, conversation_style='deep', gathering_types='[\"coffee\"]' WHERE user_id=$1",
    [ids.unknown],
  );
  const canonicalBefore = await prefs(ids.unknown);
  await db.query(migration);
  check(
    "repeat backfill preserves every existing canonical value and timestamp",
    await prefs(ids.unknown),
    canonicalBefore,
  );
  await db.query(
    'CREATE POLICY "IG002 test broad access" ON public.user_gathering_preferences FOR SELECT TO authenticated USING (true)',
  );
  check(
    "restrictive policy defeats an older broad read policy",
    (
      await asUser(ids.legacy, "SELECT * FROM public.user_gathering_preferences WHERE user_id=$1", [
        ids.unknown,
      ])
    ).rowCount,
    0,
  );
  await db.query('DROP POLICY "IG002 test broad access" ON public.user_gathering_preferences');
  await assert.rejects(
    asUser(null, "SELECT * FROM public.user_gathering_preferences", [], "anon"),
    /permission denied/,
  );
  checks++;
  console.log(`PASS ${checks}: anonymous preferences denied`);
  check(
    "own preference read works",
    (
      await asUser(ids.legacy, "SELECT * FROM public.user_gathering_preferences WHERE user_id=$1", [
        ids.legacy,
      ])
    ).rowCount,
    1,
  );
  await assert.rejects(
    asUser(ids.legacy, "INSERT INTO public.user_gathering_preferences(user_id) VALUES ($1)", [
      ids.fresh,
    ]),
    /row-level security/,
  );
  checks++;
  console.log(`PASS ${checks}: cross-account insert denied`);
  check(
    "cross-account update hidden",
    (
      await asUser(
        ids.legacy,
        "UPDATE public.user_gathering_preferences SET intentions='[]' WHERE user_id=$1",
        [ids.unknown],
      )
    ).rowCount,
    0,
  );
  await assert.rejects(
    asUser(ids.legacy, "DELETE FROM public.user_gathering_preferences WHERE user_id=$1", [
      ids.legacy,
    ]),
    /permission denied/,
  );
  checks++;
  console.log(`PASS ${checks}: destructive client delete denied`);
  await assert.rejects(save(ids.legacy, { id: ids.unknown }, {}), /Invalid profile field/);
  checks++;
  console.log(`PASS ${checks}: RPC cannot target another profile`);
  await assert.rejects(save(ids.legacy, { access_status: "active" }, {}), /Invalid profile field/);
  checks++;
  console.log(`PASS ${checks}: RPC cannot change access controls`);
  await assert.rejects(save(ids.legacy, { intentions: [] }, {}), /Invalid profile field/);
  checks++;
  console.log(`PASS ${checks}: RPC rejects legacy duplicate writes`);
  await assert.rejects(save(ids.legacy, {}, { user_id: ids.unknown }), /Invalid preference field/);
  checks++;
  console.log(`PASS ${checks}: RPC cannot target another preference row`);
  await assert.rejects(save(null, {}, {}), /Forbidden/);
  checks++;
  console.log(`PASS ${checks}: missing identity denied`);

  check(
    "profile save and preference save commit together",
    (
      await save(
        ids.legacy,
        { bio: "edited", social_links: { website: "https://example.invalid" } },
        { intentions: ["make_friends"], gathering_types: ["coffee"] },
      )
    ).rows[0].saved,
    true,
  );
  check(
    "profile edits preserve hidden onboarding choices",
    [(await prefs(ids.legacy)).social_energy, (await prefs(ids.legacy)).conversation_style],
    ["calm", "listener"],
  );
  const identity = await profile(ids.legacy);
  await save(
    ids.legacy,
    {
      trait_spark: 80,
      trait_curiosity: 60,
      trait_warmth: 70,
      trait_depth: 90,
      onboarded_at: new Date().toISOString(),
    },
    { social_energy: "lively", intentions: [] },
  );
  check(
    "onboarding edits preserve identity",
    [
      (await profile(ids.legacy)).bio,
      (await profile(ids.legacy)).date_of_birth,
      (await profile(ids.legacy)).nationality,
    ],
    [identity.bio, identity.date_of_birth, identity.nationality],
  );
  check("explicit empty intentions persist", (await prefs(ids.legacy)).intentions, []);
  check("onboarding keeps profile's gathering types", (await prefs(ids.legacy)).gathering_types, [
    "coffee",
  ]);
  check(
    "legacy copies remain archival only",
    [(await profile(ids.legacy)).intentions, (await profile(ids.legacy)).energy_level],
    [["get_out", "legacy-custom"], "calm"],
  );
  // Force a preference-side write failure after the profile update statement.
  await db.query(
    "ALTER TABLE public.user_gathering_preferences ADD CONSTRAINT ig002_test_failure CHECK (spontaneity IS DISTINCT FROM 'fail')",
  );
  const beforeFailure = await profile(ids.legacy);
  await assert.rejects(
    save(
      ids.legacy,
      { bio: "must roll back", onboarded_at: "2030-01-01" },
      { spontaneity: "fail" },
    ),
    /ig002_test_failure/,
  );
  check(
    "preference failure rolls back identity and onboarding marker",
    await profile(ids.legacy),
    beforeFailure,
  );
  await db.query(
    "ALTER TABLE public.user_gathering_preferences DROP CONSTRAINT ig002_test_failure",
  );
  await save(ids.legacy, {}, { preferred_group_size: null, social_energy: null });
  check(
    "explicit null stays canonical",
    [(await prefs(ids.legacy)).preferred_group_size, (await prefs(ids.legacy)).social_energy],
    [null, null],
  );
  await db.query(
    "INSERT INTO auth.users(id,email,raw_user_meta_data,email_confirmed_at) VALUES ($1,$2,'{}',now())",
    [ids.fresh, `ig002-fresh-${ids.fresh}@example.invalid`],
  );
  await save(ids.fresh, { onboarded_at: new Date().toISOString() }, {});
  check("skipped preferences create no fabricated answers", await prefs(ids.fresh), undefined);
  await save(ids.fresh, {}, { intentions: ["learn_something"] });
  check(
    "new user's partial insert gets safe empty defaults",
    (await prefs(ids.fresh)).gathering_types,
    [],
  );
  // Leave meaningful canonical data for loader/matching tests, distinct from legacy.
  await save(
    ids.legacy,
    {},
    {
      intentions: ["make_friends"],
      social_energy: "lively",
      conversation_style: "deep",
      stranger_comfort: "warm_up",
      preferred_group_size: 5,
    },
  );
  await db.query("COMMIT");
  await db.query("NOTIFY pgrst, 'reload schema'");
  await writeFile(resolve(runtime, "ig002-fixtures.json"), JSON.stringify(ids));
  console.log(
    `PASS: ${checks} native IG-002 database checks. Synthetic fixtures retained for application integration tests.`,
  );
} catch (error) {
  await db.query("ROLLBACK");
  throw error;
} finally {
  await db.end();
}
