// Executes the actual migration in disposable PostgreSQL; never reads hosted credentials.
// node tests/push-subscriptions.local.mjs <absolute pglite/dist/index.js> [--write-types]
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const db = new PGlite();
const a = "11111111-1111-4111-8111-111111111111",
  b = "22222222-2222-4222-8222-222222222222";
let checks = 0;
const p256dh = "B" + "A".repeat(86),
  auth = "A".repeat(22);
const asUser = (id, sql, values = []) =>
  db.transaction(async (tx) => {
    await tx.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [id ?? ""]);
    await tx.exec("SET LOCAL ROLE authenticated");
    return tx.query(sql, values);
  });
const insert = (
  owner,
  endpoint,
) => `INSERT INTO public.push_subscriptions(endpoint,user_id,p256dh,auth,application_server_key)
  VALUES ('https://push.example.invalid/${endpoint}', '${owner}', '${p256dh}', '${auth}', '${p256dh}')`;
try {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
    $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    GRANT USAGE ON SCHEMA auth TO authenticated;
    INSERT INTO auth.users VALUES ('${a}'), ('${b}');`);
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/20261003090000_havato_push_subscriptions.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await asUser(a, insert(a, "a1"));
  checks++;
  await asUser(a, insert(a, "a2"));
  checks++;
  assert.equal((await asUser(a, "SELECT * FROM public.push_subscriptions")).rows.length, 2);
  checks++;
  assert.equal((await asUser(b, "SELECT * FROM public.push_subscriptions")).rows.length, 0);
  checks++;
  await assert.rejects(asUser(b, insert(a, "forged")), /row-level security/);
  checks++;
  await assert.rejects(asUser(null, insert(a, "anonymous-claim")), /row-level security/);
  checks++;
  const before = (await asUser(a, "SELECT created_at FROM public.push_subscriptions LIMIT 1"))
    .rows[0].created_at;
  await asUser(a, insert(a, "a1") + " ON CONFLICT(endpoint) DO UPDATE SET auth = EXCLUDED.auth");
  checks++;
  assert.equal((await asUser(a, "SELECT * FROM public.push_subscriptions")).rows.length, 2);
  checks++;
  assert.equal(
    (
      await asUser(a, "SELECT created_at FROM public.push_subscriptions LIMIT 1")
    ).rows[0].created_at.getTime(),
    before.getTime(),
  );
  checks++;
  await assert.rejects(
    asUser(b, insert(b, "a1") + " ON CONFLICT(endpoint) DO UPDATE SET user_id=EXCLUDED.user_id"),
    /row-level security/,
  );
  checks++;
  await assert.rejects(
    asUser(a, "UPDATE public.push_subscriptions SET user_id=$1", [b]),
    /row-level security/,
  );
  checks++;
  assert.equal(
    (await asUser(b, "DELETE FROM public.push_subscriptions RETURNING *")).rows.length,
    0,
  );
  checks++;
  assert.equal(
    (await asUser(b, "UPDATE public.push_subscriptions SET auth=$1 RETURNING *", [auth])).rows
      .length,
    0,
  );
  checks++;
  await assert.rejects(
    db.transaction(async (tx) => {
      await tx.exec("SET LOCAL ROLE anon");
      await tx.exec("SELECT * FROM public.push_subscriptions");
    }),
    /permission denied/,
  );
  checks++;
  await assert.rejects(
    asUser(a, insert(a, "invalid").replace("https://", "http://")),
    /check constraint/,
  );
  checks++;
  await assert.rejects(asUser(a, insert(a, "invalid").replace(auth, "short")), /check constraint/);
  checks++;
  assert.equal(
    (
      await asUser(
        a,
        "DELETE FROM public.push_subscriptions WHERE endpoint LIKE '%/a1' RETURNING *",
      )
    ).rows.length,
    1,
  );
  checks++;
  await db.exec(`SET ROLE service_role`);
  assert.equal((await db.query("SELECT * FROM public.push_subscriptions")).rows.length, 1);
  checks++;
  await db.exec("RESET ROLE");
  await db.exec(`DELETE FROM auth.users WHERE id='${a}'`);
  assert.equal((await db.query("SELECT * FROM public.push_subscriptions")).rows.length, 0);
  checks++;

  const columns = (
    await db.query(`SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns WHERE table_schema='public' AND table_name='push_subscriptions'
    ORDER BY column_name`)
  ).rows;
  const fields = (kind) =>
    columns
      .map((c) => {
        const optional =
          kind === "Update" || (kind === "Insert" && (c.column_default || c.is_nullable === "YES"));
        return `          ${c.column_name}${optional ? "?" : ""}: string${c.is_nullable === "YES" ? " | null" : ""}\n`;
      })
      .join("");
  const table = `      push_subscriptions: {\n${["Row", "Insert", "Update"].map((k) => `        ${k}: {\n${fields(k)}        }\n`).join("")}        Relationships: []\n      }\n`;
  const target = new URL("../src/integrations/supabase/types.ts", import.meta.url);
  const existing = (await readFile(target, "utf8")).replaceAll("\r\n", "\n");
  if (process.argv.includes("--write-types")) {
    assert.ok(
      !existing.includes("      push_subscriptions:"),
      "Type entry already exists; verify instead",
    );
    await writeFile(target, existing.replace("    Tables: {\n", "    Tables: {\n" + table));
  } else
    assert.ok(
      existing.includes(table),
      "Generated subscription types differ from the verified schema",
    );
  checks++;
  console.log(`PASS: ${checks} migration/RLS/constraint/type checks (disposable PostgreSQL only)`);
} finally {
  await db.close();
}
