// Local-only PostgreSQL + PostgREST integration; never reads hosted credentials.
// node tests/owner-postgres.verify.mjs <absolute verification runtime directory>
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const runtime = resolve(process.argv[2]);
const { default: pg } = await import(
  pathToFileURL(resolve(runtime, "node_modules/pg/lib/index.js")).href
);
const config = { host: "127.0.0.1", port: 55439, user: "postgres", database: "ig001_disposable" };
const db = new pg.Client(config);
const secret = await readFile(resolve(runtime, "test-jwt-secret"), "utf8");
const ids = Object.fromEntries(
  ["user", "venue", "adminA", "adminB", "revoked", "spoof"].map((k) => [k, randomUUID()]),
);
let passed = 0;
function check(label, actual, expected) {
  assert.deepEqual(actual, expected, label);
  console.log(`PASS ${++passed}: ${label}`);
}
function token(id, extra = {}, signingSecret = secret) {
  const parts = [
    { alg: "HS256", typ: "JWT" },
    { role: "authenticated", sub: id, exp: Math.floor(Date.now() / 1000) + 3600, ...extra },
  ].map((x) => Buffer.from(JSON.stringify(x)).toString("base64url"));
  return `${parts.join(".")}.${createHmac("sha256", signingSecret).update(parts.join(".")).digest("base64url")}`;
}
async function request(id, path, method = "POST", body = {}, bearer = id ? token(id) : null) {
  const response = await fetch(`http://127.0.0.1:55440/${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
    },
    ...(method === "GET" ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}
async function claim(id) {
  return request(id, "rpc/claim_initial_owner");
}
async function session(id) {
  const client = new pg.Client(config);
  await client.connect();
  await client.query("BEGIN; SET LOCAL ROLE authenticated");
  await client.query("SELECT set_config('request.jwt.claims', $1, true)", [
    JSON.stringify({ sub: id, role: "authenticated" }),
  ]);
  return client;
}
await db.connect();
try {
  check(
    "disposable database marker",
    (await db.query("SELECT purpose FROM ig001_test.marker")).rows[0].purpose,
    "disposable owner verification only",
  );
  check(
    "starts without any owner",
    (await db.query("SELECT count(*)::int AS n FROM public.user_roles WHERE role='owner'")).rows[0]
      .n,
    0,
  );
  for (const [name, id] of Object.entries(ids)) {
    await db.query(
      "INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data) VALUES ($1,$2,now(),$3)",
      [
        id,
        `ig001-${name}-${id}@example.invalid`,
        JSON.stringify({
          account_type: name === "venue" ? "venue" : name === "spoof" ? "owner" : "user",
          display_name: `[test-IG001] ${name}`,
        }),
      ],
    );
  }
  await db.query(
    "INSERT INTO public.user_roles(user_id,role) VALUES ($1,'admin'),($2,'admin'),($3,'admin')",
    [ids.adminA, ids.adminB, ids.revoked],
  );
  await db.query("DELETE FROM public.user_roles WHERE user_id=$1 AND role='admin'", [ids.revoked]);
  check(
    "spoofed signup cannot create owner",
    (await db.query("SELECT role FROM public.user_roles WHERE user_id=$1", [ids.spoof])).rows.map(
      (r) => r.role,
    ),
    ["user"],
  );
  for (const name of ["user", "venue", "revoked", "spoof"]) {
    const result = await claim(ids[name]);
    check(`${name} claim denied by database`, result.body.message, "Forbidden");
    assert.notEqual(result.status, 200);
  }
  check("anonymous bootstrap execute denied", (await claim(null)).status, 401);
  check(
    "invalid JWT signature denied",
    (
      await request(
        ids.adminA,
        "rpc/claim_initial_owner",
        "POST",
        {},
        token(ids.adminA, {}, "not-the-test-secret"),
      )
    ).status,
    401,
  );
  const spoofed = await request(
    ids.user,
    "rpc/claim_initial_owner",
    "POST",
    {},
    token(ids.user, { app_role: "admin", user_metadata: { role: "owner" } }),
  );
  check("JWT metadata does not grant admin", spoofed.body.message, "Forbidden");

  // Verify a real lock wait, not merely two promises that happen to run in order.
  for (let round = 0; round < 10; round++) {
    const firstId = round % 2 ? ids.adminB : ids.adminA;
    const secondId = round % 2 ? ids.adminA : ids.adminB;
    const first = await session(firstId);
    const second = await session(secondId);
    try {
      const firstPid = (await first.query("SELECT pg_backend_pid() AS pid")).rows[0].pid;
      const secondPid = (await second.query("SELECT pg_backend_pid() AS pid")).rows[0].pid;
      assert.notEqual(firstPid, secondPid);
      assert.equal(
        (await first.query("SELECT public.claim_initial_owner() AS claimed")).rows[0].claimed,
        true,
      );
      const pending = second.query("SELECT public.claim_initial_owner() AS claimed");
      let waiting = false;
      for (let poll = 0; poll < 100; poll++) {
        const locks = await db.query(
          "SELECT 1 FROM pg_locks WHERE pid=$1 AND relation='public.user_roles'::regclass AND NOT granted",
          [secondPid],
        );
        if (locks.rowCount) {
          waiting = true;
          break;
        }
        await new Promise((r) => setTimeout(r, 10));
      }
      assert.ok(waiting, "second independent backend must wait on the role-table lock");
      await first.query("COMMIT");
      assert.equal((await pending).rows[0].claimed, false);
      await second.query("COMMIT");
      check(
        `concurrent round ${round + 1}: distinct backends, observed lock wait, exactly one owner`,
        (await db.query("SELECT user_id FROM public.user_roles WHERE role='owner'")).rows.map(
          (r) => r.user_id,
        ),
        [firstId],
      );
    } finally {
      await first.query("ROLLBACK").catch(() => {});
      await second.query("ROLLBACK").catch(() => {});
      await first.end();
      await second.end();
    }
    // Only removes this run's synthetic owner fixture, never arbitrary owners.
    await db.query("DELETE FROM public.user_roles WHERE user_id=ANY($1::uuid[]) AND role='owner'", [
      [ids.adminA, ids.adminB],
    ]);
  }

  check("eligible admin HTTP RPC claims successfully", await claim(ids.adminA), {
    status: 200,
    body: true,
  });
  check("same owner repeat is idempotent", await claim(ids.adminA), { status: 200, body: true });
  check("second admin HTTP RPC cannot become owner", await claim(ids.adminB), {
    status: 200,
    body: false,
  });
  check(
    "owner RPC recognizes owner",
    (await request(ids.adminA, "rpc/is_owner", "POST", { _user_id: ids.adminA })).body,
    true,
  );
  check(
    "owner RPC rejects nonowner",
    (await request(ids.adminB, "rpc/is_owner", "POST", { _user_id: ids.adminB })).body,
    false,
  );
  check(
    "owner retains user and admin roles",
    (await request(ids.adminA, "user_roles?select=role&order=role", "GET")).body.map((r) => r.role),
    ["admin", "user", "owner"],
  );
  check(
    "nonowner cannot read owner's role row",
    (await request(ids.user, `user_roles?user_id=eq.${ids.adminA}`, "GET")).body,
    [],
  );
  check(
    "direct owner self-grant denied",
    (await request(ids.user, "user_roles", "POST", { user_id: ids.user, role: "owner" })).status,
    403,
  );
  check(
    "public has_role RPC stays absent",
    (await request(ids.user, "rpc/has_role", "POST", { _user_id: ids.user, _role: "admin" }))
      .status,
    404,
  );

  // Existing admin operations use actual committed RLS/triggers through HTTP.
  for (const [name, id] of [
    ["owner retaining admin", ids.adminA],
    ["ordinary admin", ids.adminB],
  ]) {
    const code = `IG001-${randomUUID()}`.toUpperCase();
    const invite = await request(id, "invitations", "POST", {
      code,
      created_by: id,
      note: "[test-IG001]",
    });
    check(`${name}: invitation create`, invite.status, 201);
    check(
      `${name}: invitation revoke`,
      (await request(id, `invitations?id=eq.${invite.body[0].id}`, "PATCH", { status: "revoked" }))
        .body[0].status,
      "revoked",
    );
    check(
      `${name}: beta configuration update`,
      (await request(id, "app_config?id=eq.true", "PATCH", { beta_launched: true })).body[0]
        .beta_launched,
      true,
    );
    const report = await db.query(
      "INSERT INTO public.reports(reporter_id,target_type,target_id,reason) VALUES ($1,'user',$2,'[test-IG001]') RETURNING id",
      [ids.user, ids.venue],
    );
    check(
      `${name}: moderation resolve`,
      (
        await request(id, `reports?id=eq.${report.rows[0].id}`, "PATCH", {
          status: "resolved",
          resolved_by: id,
        })
      ).body[0].status,
      "resolved",
    );
  }
  check(
    "normal user cannot create invitation",
    (await request(ids.user, "invitations", "POST", { code: "IG001-DENIED" })).status,
    403,
  );
  check(
    "normal user cannot update beta config",
    (await request(ids.user, "app_config?id=eq.true", "PATCH", { beta_launched: false })).body,
    [],
  );
  await writeFile(resolve(runtime, "fixtures.json"), JSON.stringify(ids));
  console.log(
    `PASS: ${passed} native PostgreSQL/PostgREST checks; fixtures retained only in disposable local database for handler tests.`,
  );
} finally {
  await db.end();
}
