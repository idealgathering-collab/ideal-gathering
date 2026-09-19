// Disposable PostgreSQL execution, no hosted credentials or production data.
// Install @electric-sql/pglite in an external scratch directory, then run:
// node tests/owner-bootstrap.local.mjs <absolute path to pglite/dist/index.js>
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const db = new PGlite();
const migration = (name) =>
  readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), "utf8");
const ids = Array.from({ length: 4 }, (_, i) => `00000000-0000-0000-0000-00000000000${i + 1}`);
let checks = 0;
async function asUser(id, sql) {
  return db.transaction(async (tx) => {
    await tx.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [id ?? ""]);
    await tx.exec("SET LOCAL ROLE authenticated");
    return (await tx.query(sql)).rows;
  });
}
async function claim(id) {
  return (await asUser(id, "SELECT public.claim_initial_owner() AS claimed"))[0].claimed;
}
try {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE SCHEMA auth; CREATE SCHEMA private;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    GRANT USAGE ON SCHEMA auth, private TO authenticated;
    CREATE TYPE public.app_role AS ENUM ('admin', 'business_owner', 'user', 'venue');
    CREATE TABLE public.user_roles (user_id uuid NOT NULL, role public.app_role NOT NULL, UNIQUE(user_id, role));
    ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
    CREATE POLICY own_roles ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
  `);
  // Execute the actual committed helper definition, not a JS imitation.
  const helpers = await migration("20260709131615_1314ef19-1325-472f-bc9a-86f1db3c6b31.sql");
  await db.exec(helpers.match(/CREATE OR REPLACE FUNCTION private\.has_role[\s\S]*?\$\$;/)[0]);
  await db.exec(await migration("20260818231624_a60d0ba5-f626-4ade-85e0-0991734a44c8.sql"));
  await db.exec(await migration("20260910233000_add_owner_role.sql"));
  await db.exec(await migration("20260910233100_add_owner_bootstrap.sql"));
  await db.query(
    "INSERT INTO public.user_roles VALUES ($1, 'user'), ($2, 'venue'), ($3, 'admin'), ($4, 'admin')",
    ids,
  );
  await assert.rejects(claim(ids[2]), /public.has_role/);
  checks++;
  const fix = await migration("20260919120000_fix_owner_bootstrap.sql");
  await db.exec(fix);
  await db.exec(fix); // Safe to reapply the corrective definition.
  for (const id of [null, ids[0], ids[1]]) {
    await assert.rejects(claim(id), /Forbidden/);
    checks++;
  }
  await assert.rejects(
    db.transaction(async (tx) => {
      await tx.exec("SET LOCAL ROLE anon");
      await tx.query("SELECT public.claim_initial_owner()");
    }),
    /permission denied/,
  );
  checks++;
  assert.equal(await claim(ids[2]), true);
  checks++;
  assert.equal(await claim(ids[2]), true);
  checks++;
  assert.equal(await claim(ids[3]), false);
  checks++;
  const roles = (
    await db.query("SELECT role FROM public.user_roles WHERE user_id = $1 ORDER BY role", [ids[2]])
  ).rows;
  assert.deepEqual(
    roles.map((r) => r.role),
    ["admin", "owner"],
  );
  checks++;
  assert.equal(
    (await db.query("SELECT count(*)::int AS n FROM public.user_roles WHERE role = 'owner'"))
      .rows[0].n,
    1,
  );
  checks++;
  assert.equal(
    (await asUser(ids[2], `SELECT private.has_role(auth.uid(), 'admin') AS allowed`))[0].allowed,
    true,
  );
  checks++;
  assert.equal(
    (await asUser(ids[3], `SELECT private.has_role(auth.uid(), 'admin') AS allowed`))[0].allowed,
    true,
  );
  checks++;
  await assert.rejects(
    asUser(ids[0], `INSERT INTO public.user_roles VALUES (auth.uid(), 'owner')`),
    /permission denied/,
  );
  checks++;
  assert.equal(
    (await asUser(ids[0], "SELECT * FROM public.user_roles WHERE role = 'owner'")).length,
    0,
  );
  checks++;
  console.log(
    `PASS: ${checks} PostgreSQL checks (helper regression, claims, grants, RLS, admin retention, reapplication).`,
  );
  console.log(
    "Fixture covers owner-role prerequisites only; not full migration replay, hosted auth, or multi-connection concurrency.",
  );
} finally {
  await db.close();
}
