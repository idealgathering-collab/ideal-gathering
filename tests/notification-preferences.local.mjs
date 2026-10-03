// Actual migration on disposable PostgreSQL only; no hosted credentials.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const db = new PGlite();
const a = "11111111-1111-4111-8111-111111111111", b = "22222222-2222-4222-8222-222222222222";
let checks = 0;
const check = (actual, expected) => { assert.deepEqual(actual, expected); checks++; };
const denied = async (promise, pattern) => { await assert.rejects(promise, pattern); checks++; };
const asUser = (id, sql) => db.transaction(async tx => {
  await tx.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [id ?? ""]);
  await tx.exec("SET LOCAL ROLE authenticated");
  return tx.query(sql);
});
try {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    GRANT USAGE ON SCHEMA auth TO authenticated;
    INSERT INTO auth.users VALUES ('${a}'), ('${b}');`);
  await db.exec(await readFile(new URL("../supabase/migrations/20261003150000_havato_notification_preferences.sql", import.meta.url), "utf8"));
  check((await asUser(a, "SELECT * FROM public.notification_preferences")).rows, []);
  await asUser(a, `INSERT INTO public.notification_preferences(user_id) VALUES('${a}')`); checks++;
  const row = (await asUser(a, "SELECT * FROM public.notification_preferences")).rows[0];
  check(row, { user_id: a, enabled: true, gathering_reminders: true, gathering_updates: true, chat_messages: true, account_venue_status: true, language: "fa" });
  check((await asUser(b, "SELECT * FROM public.notification_preferences")).rows, []);
  await denied(asUser(b, `INSERT INTO public.notification_preferences(user_id) VALUES('${a}') ON CONFLICT(user_id) DO UPDATE SET enabled=false`), /row-level security/);
  await denied(asUser(null, `INSERT INTO public.notification_preferences(user_id) VALUES('${b}')`), /row-level security/);
  await denied(asUser(b, `INSERT INTO public.notification_preferences(user_id) VALUES('${a}')`), /row-level security/);
  check((await asUser(b, `UPDATE public.notification_preferences SET enabled=false WHERE user_id='${a}' RETURNING *`)).rows, []);
  await denied(asUser(a, `UPDATE public.notification_preferences SET user_id='${b}'`), /row-level security/);
  for (const field of ["enabled", "gathering_reminders", "gathering_updates", "chat_messages", "account_venue_status"]) {
    await asUser(a, `UPDATE public.notification_preferences SET ${field}=false`);
    check((await asUser(a, `SELECT ${field} FROM public.notification_preferences`)).rows[0][field], false);
    await denied(asUser(a, `UPDATE public.notification_preferences SET ${field}=null`), /not-null/);
  }
  await asUser(a, `INSERT INTO public.notification_preferences(user_id,language) VALUES('${a}','en') ON CONFLICT(user_id) DO UPDATE SET language=excluded.language`);
  check((await asUser(a, "SELECT enabled,language FROM public.notification_preferences")).rows, [{ enabled: false, language: "en" }]);
  await denied(asUser(a, "UPDATE public.notification_preferences SET language='ru'"), /check constraint/);
  await denied(asUser(a, "DELETE FROM public.notification_preferences"), /permission denied/);
  check((await db.query("SELECT has_table_privilege('anon','public.notification_preferences','SELECT') AS allowed")).rows[0].allowed, false);
  check((await db.query("SELECT has_table_privilege('service_role','public.notification_preferences','SELECT') AS allowed")).rows[0].allowed, true);
  check((await db.query("SELECT has_table_privilege('service_role','public.notification_preferences','UPDATE') AS allowed")).rows[0].allowed, false);
  await db.exec(`DELETE FROM auth.users WHERE id='${a}'`);
  check((await db.query("SELECT * FROM public.notification_preferences")).rows, []);
  // Schema-derived fragment, same bounded type check used in Phase 1.
  const columns = (await db.query("SELECT column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='notification_preferences' ORDER BY ordinal_position")).rows;
  const fields = kind => columns.map(c => {
    const optional = kind === "Update" || (kind === "Insert" && c.column_default);
    return `          ${c.column_name}${optional ? "?" : ""}: ${c.data_type === "boolean" ? "boolean" : "string"}\n`;
  }).join("");
  const table = `      notification_preferences: {\n${["Row","Insert","Update"].map(k => `        ${k}: {\n${fields(k)}        }\n`).join("")}        Relationships: []\n      }\n`;
  const types = (await readFile(new URL("../src/integrations/supabase/types.ts", import.meta.url), "utf8")).replaceAll("\r\n", "\n");
  check(types.includes(table), true);
  console.log(`${checks} notification preference SQL checks passed`);
} finally { await db.close(); }
