// Disposable PostgreSQL only. Install @electric-sql/pglite outside the app, then:
// PGLITE_MODULE=<absolute package entry> node tests/db/owner-control.local.mjs
// Does not read .env, contact Supabase, or use real accounts.
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

if (!process.env.PGLITE_MODULE)
  throw new Error("Set PGLITE_MODULE to a disposable PGlite installation");
const { PGlite } = await import(pathToFileURL(process.env.PGLITE_MODULE).href);
const db = new PGlite();
let checks = 0;
const owner = "00000000-0000-4000-8000-000000000001";
const admin = "00000000-0000-4000-8000-000000000002";
const member = "00000000-0000-4000-8000-000000000003";
const venue = "00000000-0000-4000-8000-000000000004";
async function asUser(id, sql) {
  await db.exec(
    `SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '${id}', false)`,
  );
  try {
    return await db.query(sql);
  } finally {
    await db.exec("RESET ROLE");
  }
}
async function denied(id, sql) {
  await assert.rejects(asUser(id, sql));
  checks++;
}
async function allowed(id, expected) {
  const result = await asUser(
    id,
    "SELECT public.has_platform_permission('platform_operations') AS allowed",
  );
  assert.equal(result.rows[0].allowed, expected);
  checks++;
}
try {
  // Minimal pre-migration fixture with real PostgreSQL roles, grants and RLS.
  // It is deliberately NOT a full historical Supabase migration replay.
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE SCHEMA private;
    GRANT USAGE ON SCHEMA auth, private TO authenticated, service_role;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE TYPE public.app_role AS ENUM ('admin', 'business_owner', 'user', 'venue', 'owner');
    CREATE TABLE public.user_roles(id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id uuid REFERENCES auth.users(id), role public.app_role, UNIQUE(user_id, role));
    ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
    GRANT SELECT ON public.user_roles TO authenticated;
    CREATE POLICY self_roles ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
    CREATE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
      RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS
      $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;
    CREATE FUNCTION public.is_owner(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS
      $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'owner') $$;
    INSERT INTO auth.users VALUES ('${owner}'), ('${admin}'), ('${member}'), ('${venue}');
    INSERT INTO public.user_roles(user_id,role) VALUES ('${owner}','owner'), ('${admin}','admin'), ('${member}','user'), ('${venue}','venue');
    CREATE TABLE public.operation_fixture (id integer PRIMARY KEY, value text);
    INSERT INTO public.operation_fixture VALUES (1,'unchanged');
    ALTER TABLE public.operation_fixture ENABLE ROW LEVEL SECURITY;
    GRANT SELECT, UPDATE ON public.operation_fixture TO authenticated;
    CREATE POLICY staff_operation ON public.operation_fixture FOR ALL TO authenticated
      USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
  `);
  await db.exec(
    await readFile(
      new URL("../../supabase/migrations/20260911120000_owner_control_center.sql", import.meta.url),
      "utf8",
    ),
  );
  await allowed(owner, true);
  await allowed(admin, true);
  await allowed(member, false);
  await allowed(venue, false);
  for (const user of [admin, member, venue]) {
    await denied(user, "SELECT * FROM public.list_admin_access()");
    await denied(user, `SELECT public.manage_admin_access('${member}', 'grant')`);
    await denied(user, "SELECT public.claim_initial_owner()");
    await denied(user, `INSERT INTO public.user_roles(user_id,role) VALUES ('${user}', 'owner')`);
    await denied(
      user,
      `INSERT INTO public.admin_permissions VALUES ('${user}', 'platform_operations')`,
    );
  }
  const list = await asUser(owner, "SELECT * FROM public.list_admin_access()");
  assert.equal(list.rows.length, 1);
  checks++;
  assert.equal((await asUser(owner, "SELECT * FROM public.operation_fixture")).rows.length, 1);
  checks++;
  await asUser(owner, `SELECT public.manage_admin_access('${admin}', 'restrict')`);
  await allowed(admin, false);
  assert.equal((await asUser(admin, "SELECT * FROM public.operation_fixture")).rows.length, 0);
  checks++;
  assert.equal(
    (await asUser(admin, "UPDATE public.operation_fixture SET value='bypass' RETURNING *")).rows
      .length,
    0,
  );
  checks++;
  await denied(admin, `SELECT public.manage_admin_access('${admin}', 'restore')`);
  await denied(owner, `SELECT public.manage_admin_access('${admin}', 'grant')`);
  await asUser(owner, `SELECT public.manage_admin_access('${admin}', 'restore')`);
  await allowed(admin, true);
  for (const action of ["grant", "restrict", "restore", "remove"]) {
    await denied(owner, `SELECT public.manage_admin_access('${owner}', '${action}')`);
  }
  await denied(owner, `SELECT public.manage_admin_access('${member}', 'owner')`);
  await denied(owner, `SELECT public.manage_admin_access('${member}', NULL)`);
  await denied(owner, "SELECT public.manage_admin_access(NULL, 'grant')");
  await asUser(owner, `SELECT public.manage_admin_access('${member}', 'grant')`);
  await allowed(member, true);
  await asUser(owner, `SELECT public.manage_admin_access('${member}', 'remove')`);
  await allowed(member, false);
  assert.equal((await asUser(owner, "SELECT * FROM public.admin_access_audit")).rows.length, 4);
  checks++;
  assert.equal((await asUser(admin, "SELECT * FROM public.admin_access_audit")).rows.length, 0);
  checks++;
  assert.equal(
    (await asUser(owner, "SELECT public.has_platform_permission('unknown') AS allowed")).rows[0]
      .allowed,
    false,
  );
  checks++;
  await db.exec("SET ROLE anon");
  await assert.rejects(db.query("SELECT public.list_admin_access()"));
  checks++;
  await db.exec("RESET ROLE");
  // Even a zero-Owner installation cannot be claimed by an Admin.
  await db.exec(`DELETE FROM public.user_roles WHERE role='owner'`);
  await denied(admin, "SELECT public.claim_initial_owner()");
  console.log(`${checks} disposable PostgreSQL authorization checks passed`);
} finally {
  await db.close();
}
