// Only for a NEW disposable local cluster. No environment credentials are read.
// node tests/owner-postgres.setup.mjs <absolute pg module path>
import { readFile, readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const { default: pg } = await import(pathToFileURL(process.argv[2]).href);
const config = { host: "127.0.0.1", port: 55439, user: "postgres", database: "postgres" };
const admin = new pg.Client(config);
await admin.connect();
try {
  // Deliberately fails if this database already exists; never drops existing data.
  await admin.query("CREATE DATABASE ig001_disposable");
} finally {
  await admin.end();
}
const db = new pg.Client({ ...config, database: "ig001_disposable" });
await db.connect();
try {
  await db.query(`
    CREATE ROLE anon NOLOGIN;
    CREATE ROLE authenticated NOLOGIN;
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
    CREATE ROLE authenticator LOGIN NOINHERIT;
    GRANT anon, authenticated, service_role TO authenticator;
    GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (
      id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}',
      email_confirmed_at timestamptz, created_at timestamptz DEFAULT now()
    );
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid
    $$;
    GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
    CREATE SCHEMA storage;
    CREATE TABLE storage.objects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text, name text, owner uuid);
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    CREATE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
      SELECT (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1)-1]
    $$;
    CREATE PUBLICATION supabase_realtime;
    CREATE SCHEMA ig001_test;
    CREATE TABLE ig001_test.marker (purpose text NOT NULL);
    INSERT INTO ig001_test.marker VALUES ('disposable owner verification only');
  `);
  const dir = new URL("../supabase/migrations/", import.meta.url);
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    if (file.startsWith("20260821001412")) {
      // The historical smoke test assumes these two accounts already exist.
      // They are synthetic and created only in this newly created local database.
      await db.query(`
        INSERT INTO auth.users (id, email, email_confirmed_at, raw_user_meta_data) VALUES
        ('905b2033-45d6-4a92-8edb-f636d4c653fe', 'ig001-venue@example.invalid', now(), '{"account_type":"venue"}'),
        ('36a3c386-d417-4bdc-8770-ca0fc5b52097', 'ig001-admin@example.invalid', now(), '{}');
        INSERT INTO public.user_roles (user_id, role) VALUES ('36a3c386-d417-4bdc-8770-ca0fc5b52097', 'admin');
      `);
    }
    try {
      await db.query(await readFile(new URL(file, dir), "utf8"));
      console.log(`APPLIED ${file}`);
    } catch (error) {
      throw new Error(`Migration ${file}: ${error.message}`);
    }
  }
  console.log(`PASS: applied ${files.length} committed migrations to native PostgreSQL`);
} finally {
  await db.end();
}
