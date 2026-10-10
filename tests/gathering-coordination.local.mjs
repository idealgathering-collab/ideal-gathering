import { readFile, writeFile } from "node:fs/promises";

export async function checkCoordination({
  db,
  asUser,
  host,
  guest,
  other,
  outsider,
  admin,
  check,
  deny,
}) {
  const event = "63000000-0000-4000-8000-000000000001",
    foreign = "63000000-0000-4000-8000-000000000002";
  const hash = "c".repeat(64),
    hash2 = "d".repeat(64);
  const member = `member:${guest}`,
    hostKey = `member:${host}`;
  const call = async (uid, action = "list", data = {}, id = event) =>
    (
      await asUser(
        uid,
        `SELECT public.gathering_coordination('${id}','${action}','${JSON.stringify(data).replaceAll("'", "''")}'::jsonb) AS value`,
      )
    )[0].value;
  const guestCall = async (data = {}, h = hash, adult = true) =>
    (
      await asUser(
        null,
        `SELECT public.guest_coordination('${h}',${adult},'${JSON.stringify(data)}'::jsonb) AS value`,
        "service_role",
      )
    )[0].value;
  await db.exec("TRUNCATE private.guest_request_limits");
  for (const id of [event, foreign]) {
    await asUser(
      host,
      `INSERT INTO public.gatherings(id,host_id,subject,starts_at,seats,venue_name,neighborhood,visibility) VALUES('${id}','${host}','Coordination fixture',now()+interval '2 days',4,'Home','','private')`,
    );
    await asUser(admin, `UPDATE public.gatherings SET status='approved' WHERE id='${id}'`);
  }
  await asUser(host, `SELECT public.invite_gathering_member('${event}','member2@example.test')`);
  await asUser(host, `SELECT public.invite_gathering_member('${event}','member3@example.test')`);
  await deny(call(outsider), /UNAVAILABLE/);
  await deny(call(guest), /UNAVAILABLE/); // Invited/Maybe do not grant room permissions.
  await asUser(guest, `SELECT public.respond_gathering_invitation('${event}','going')`);
  await asUser(other, `SELECT public.respond_gathering_invitation('${event}','going')`);
  await db.exec(`UPDATE profiles SET date_of_birth=NULL WHERE id='${guest}'`);
  await deny(call(guest), /UNAVAILABLE/);
  await db.exec(
    `ALTER TABLE profiles DISABLE TRIGGER USER; UPDATE profiles SET date_of_birth=current_date-interval '17 years' WHERE id='${guest}'; ALTER TABLE profiles ENABLE TRIGGER USER`,
  );
  await deny(call(guest), /UNAVAILABLE/);
  await db.exec(`UPDATE profiles SET date_of_birth='1990-01-01' WHERE id='${guest}'`);
  for (const role of ["anon", "authenticated", "service_role"]) {
    for (const table of ["gathering_responsibilities", "gathering_notes", "gathering_expenses"]) {
      check(
        (
          await db.query(
            `SELECT relrowsecurity FROM pg_class WHERE oid='private.${table}'::regclass`,
          )
        ).rows[0].relrowsecurity,
        true,
      );
      for (const operation of ["SELECT", "INSERT", "UPDATE", "DELETE"])
        check(
          (
            await db.query(
              `SELECT has_table_privilege('${role}','private.${table}','${operation}') AS allowed`,
            )
          ).rows[0].allowed,
          false,
        );
    }
  }
  for (const role of ["anon", "authenticated"])
    await deny(
      asUser(null, `SELECT public.guest_coordination('${hash}',true)`, role),
      /permission denied/,
    );
  await deny(
    asUser(null, `SELECT public.gathering_coordination('${event}')`, "anon"),
    /permission denied/,
  );
  await deny(
    asUser(null, `SELECT public.gathering_coordination('${event}')`, "service_role"),
    /permission denied/,
  );
  const item = (
    await asUser(
      host,
      `INSERT INTO gathering_checklist_items(gathering_id,label) VALUES('${event}','Bring tea') RETURNING id`,
    )
  )[0].id;
  const secret = (
    await asUser(
      host,
      `INSERT INTO gathering_checklist_items(gathering_id,label) VALUES('${event}','Private task') RETURNING id`,
    )
  )[0].id;
  const foreignItem = (
    await asUser(
      host,
      `INSERT INTO gathering_checklist_items(gathering_id,label) VALUES('${foreign}','Other event') RETURNING id`,
    )
  )[0].id;
  check((await call(guest)).items.length, 2);
  await call(guest, "task", { item, operation: "volunteer" });
  check((await call(host)).items.find((i) => i.id === item).assignee, member);
  await deny(call(other, "task", { item, operation: "volunteer" }), /TASK_TAKEN/);
  await deny(call(other, "task", { item, operation: "done", done: true }), /UNAVAILABLE/);
  await call(guest, "task", { item, operation: "done", done: true });
  check((await call(host)).items.find((i) => i.id === item).done, true);
  await call(guest, "task", { item, operation: "release" });
  check((await call(host)).items.find((i) => i.id === item).assignee, null);
  await deny(call(guest, "task", { item, operation: "assign", assignee: hostKey }), /UNAVAILABLE/);
  await deny(call(guest, "task", { item, operation: "share", guest_visible: true }), /UNAVAILABLE/);
  await deny(call(host, "task", { item: foreignItem, operation: "volunteer" }), /UNAVAILABLE/);
  await deny(
    call(host, "task", { item, operation: "assign", assignee: `member:${outsider}` }),
    /Invalid participant/,
  );
  await call(host, "task", { item, operation: "assign", assignee: member });
  check((await call(guest)).items.find((i) => i.id === item).assignee, member);
  // Personal checklist ticks remain independent of shared completion.
  await asUser(
    guest,
    `INSERT INTO gathering_checklist_checks(item_id,user_id) VALUES('${item}','${guest}')`,
  );
  check((await call(guest)).items.find((i) => i.id === item).done, false);
  await call(host, "save_note", { body: "Host only note" });
  await call(guest, "save_note", { body: "Member note", guest_visible: true });
  let state = await call(guest),
    note = state.notes.find((n) => n.body === "Member note");
  check(note.guest_visible, false);
  await deny(
    call(other, "save_note", { id: note.id, version: 1, body: "overwrite" }),
    /UNAVAILABLE/,
  );
  await deny(call(other, "delete_note", { id: note.id, version: 1 }), /UNAVAILABLE/);
  await call(guest, "save_note", { id: note.id, version: 1, body: "Edited note" });
  await deny(call(guest, "save_note", { id: note.id, version: 1, body: "stale edit" }), /CONFLICT/);
  await deny(call(host, "delete_note", { id: note.id, version: 1 }), /CONFLICT/);
  await call(host, "save_note", {
    id: note.id,
    version: 2,
    body: "Shared guest note",
    guest_visible: true,
  });
  await deny(call(host, "save_note", { body: " ".repeat(4) }), /Invalid note/);
  await deny(call(host, "save_note", { body: "x".repeat(2001) }), /Invalid note/);
  await deny(
    call(guest, "save_note", { id: note.id, version: 3, body: "wrong event" }, foreign),
    /UNAVAILABLE/,
  );
  // Three seats already taken; guest Going takes last seat, coordination adds none.
  await asUser(
    host,
    `SELECT public.manage_guest_invitation('${event}','create','${hash}','Guest one',3)`,
  );
  await asUser(
    null,
    `SELECT public.use_guest_invitation('${hash}',true,'going','Private Guest Name')`,
    "service_role",
  );
  const guestKey = (await call(host)).participants.find((p) => p.guest).key;
  check((await call(guest)).participants.find((p) => p.guest).label, "Guest");
  check((await call(host)).participants.find((p) => p.guest).label, "Private Guest Name");
  check(await guestCall({}, hash, false), null);
  check(await guestCall({}, "e".repeat(64)), null);
  check((await guestCall()).items, []);
  check((await guestCall()).notes, [{ body: "Shared guest note" }]);
  await deny(guestCall({ item: secret, operation: "volunteer" }), /UNAVAILABLE/);
  await call(host, "task", { item, operation: "share", guest_visible: true });
  check((await guestCall()).items[0].available, false);
  await deny(guestCall({ item, operation: "volunteer" }), /TASK_TAKEN/);
  await call(host, "task", { item, operation: "assign", assignee: guestKey });
  check((await guestCall()).items[0].mine, true);
  await guestCall({ item, operation: "done", done: true });
  check((await call(host)).items.find((i) => i.id === item).done, true);
  await guestCall({ item, operation: "release" });
  await guestCall({ item, operation: "volunteer" });
  await deny(guestCall({ item, operation: "assign", assignee: hostKey }), /UNAVAILABLE/);
  await deny(guestCall({ item: foreignItem, operation: "volunteer" }), /UNAVAILABLE/);
  const projection = JSON.stringify(await guestCall());
  for (const value of [
    guestKey,
    member,
    "Private Guest Name",
    "Host only note",
    "Private task",
    "expenses",
    "participants",
    "token_hash",
  ])
    check(projection.includes(value), false);
  const expense = {
    label: "Tea",
    amount: 100,
    currency: "IRT",
    payer: hostKey,
    participants: [hostKey, member, guestKey],
  };
  await deny(call(guest, "expense", expense), /UNAVAILABLE/);
  await deny(
    call(host, "expense", { ...expense, participants: [member, member] }),
    /Invalid participant/,
  );
  await deny(
    call(host, "expense", { ...expense, payer: `member:${outsider}` }),
    /Invalid participant/,
  );
  await deny(
    call(host, "expense", { ...expense, participants: [`member:${outsider}`] }),
    /Invalid participant/,
  );
  await deny(call(host, "expense", { ...expense, amount: 0 }), /Invalid expense/);
  await deny(call(host, "expense", { ...expense, amount: 100000000001 }), /Invalid expense/);
  await call(host, "expense", expense);
  state = await call(guest);
  const cost = state.expenses[0];
  check(
    cost.shares.reduce((sum, s) => sum + s.amount, 0),
    100,
  );
  check(cost.shares.map((s) => s.amount).sort(), [33, 33, 34]);
  check(cost.shares.find((s) => s.key === guestKey).label, "Guest");
  await deny(call(host, "expense", { ...expense, currency: "USD" }), /CURRENCY_MISMATCH/);
  await deny(call(guest, "delete_expense", { id: cost.id }), /UNAVAILABLE/);
  await deny(call(host, "delete_expense", { id: cost.id }, foreign), /UNAVAILABLE/);
  check(
    (
      await db.query(
        `SELECT (SELECT count(*) FROM gathering_attendees WHERE gathering_id='${event}')+private.active_guest_seats('${event}') AS n`,
      )
    ).rows[0].n,
    4,
  );
  await asUser(
    host,
    `SELECT public.manage_guest_invitation('${event}','create','${hash2}','Guest two',3)`,
  );
  await deny(
    asUser(
      null,
      `SELECT public.use_guest_invitation('${hash2}',true,'going','Second guest')`,
      "service_role",
    ),
    /GATHERING_FULL/,
  );
  check(await guestCall({}, hash2), null);
  // Role change/block/member leave revokes coordination, stale task can be reclaimed.
  await db.exec(`INSERT INTO user_blocks(blocker_id,blocked_id) VALUES('${guest}','${host}')`);
  await deny(call(guest), /UNAVAILABLE/);
  await db.exec("DELETE FROM user_blocks");
  await asUser(guest, `SELECT public.respond_gathering_invitation('${event}','maybe')`);
  await deny(call(guest), /UNAVAILABLE/);
  check(
    (await call(host)).expenses[0].shares.some((s) => s.key === member),
    true,
  ); // Historical shares retained.
  await asUser(guest, `SELECT public.respond_gathering_invitation('${event}','going')`);
  await asUser(host, `SELECT public.revoke_gathering_invitation('${event}','${guest}')`);
  await deny(call(guest), /UNAVAILABLE/);
  await asUser(host, `SELECT public.invite_gathering_member('${event}','member2@example.test')`);
  await asUser(guest, `SELECT public.respond_gathering_invitation('${event}','going')`);
  const guestId = guestKey.slice(6);
  await asUser(
    host,
    `SELECT public.manage_guest_invitation('${event}','revoke',NULL,NULL,NULL,'${guestId}')`,
  );
  check(await guestCall(), null);
  check((await call(host)).items.find((i) => i.id === item).active, false);
  await call(other, "task", { item, operation: "volunteer" });
  check((await call(host)).items.find((i) => i.id === item).assignee, `member:${other}`);
  // Expiry/decline/host eligibility/status close guest access.
  await asUser(
    null,
    `SELECT public.use_guest_invitation('${hash2}',true,'going','Second guest')`,
    "service_role",
  );
  await asUser(
    null,
    `SELECT public.use_guest_invitation('${hash2}',true,'maybe','Second guest')`,
    "service_role",
  );
  check(await guestCall({}, hash2), null);
  await asUser(
    null,
    `SELECT public.use_guest_invitation('${hash2}',true,'going','Second guest')`,
    "service_role",
  );
  await db.exec(
    `UPDATE private.gathering_guest_invitations SET expires_at=clock_timestamp()+interval '100 milliseconds' WHERE token_hash='${hash2}'`,
  );
  await new Promise((resolve) => setTimeout(resolve, 130));
  check(await guestCall({}, hash2), null);
  await db.exec(`UPDATE public.profiles SET date_of_birth=NULL WHERE id='${host}'`);
  await deny(call(host), /UNAVAILABLE/);
  await deny(call(other), /UNAVAILABLE/);
  await db.exec(`UPDATE profiles SET date_of_birth='1990-01-01' WHERE id='${host}'`);
  await asUser(admin, `UPDATE gatherings SET status='cancelled' WHERE id='${event}'`);
  await deny(call(other), /UNAVAILABLE/);
  await asUser(admin, `UPDATE gatherings SET status='approved' WHERE id='${event}'`);
  await asUser(host, `DELETE FROM gathering_checklist_items WHERE id='${item}'`);
  check(
    (
      await db.query(
        `SELECT count(*)::int n FROM private.gathering_responsibilities WHERE item_id='${item}'`,
      )
    ).rows[0].n,
    0,
  );
  await call(host, "delete_expense", { id: cost.id });
  check((await call(host)).expenses, []);
  await call(host, "expense", { ...expense, currency: "USD", participants: [hostKey] });
  check((await call(host)).expenses[0].shares[0].amount, 100);
  await asUser(host, `DELETE FROM gatherings WHERE id='${event}'`);
  await asUser(host, `DELETE FROM gatherings WHERE id='${foreign}'`);
  for (const table of ["gathering_notes", "gathering_expenses"])
    check(
      (await db.query(`SELECT count(*)::int n FROM private.${table} WHERE gathering_id='${event}'`))
        .rows[0].n,
      0,
    );
  const types = await readFile(
    new URL("../src/integrations/supabase/types.ts", import.meta.url),
    "utf8",
  );
  let fragment = "";
  for (const name of ["gathering_coordination", "guest_coordination"]) {
    const row = (
      await db.query(
        `SELECT proargnames,pronargdefaults,proargtypes::oid[]::text AS argtypes,format_type(prorettype,NULL) AS result FROM pg_proc WHERE oid='public.${name}'::regproc`,
      )
    ).rows[0];
    const oids = row.argtypes.replace(/^.*\{/, "").replace(/\}$/, "").split(",");
    const fields = [];
    for (let n = 0; n < row.proargnames.length; n++) {
      const type = (await db.query("SELECT format_type($1::oid,NULL) AS t", [oids[n]])).rows[0].t;
      fields.push(
        `${row.proargnames[n]}${n >= row.proargnames.length - row.pronargdefaults ? "?" : ""}: ${type === "jsonb" ? "Json" : type === "boolean" ? "boolean" : "string"}`,
      );
    }
    fragment += `      ${name}: {\n        Args: { ${fields.join("; ")} }\n        Returns: ${row.result === "jsonb" ? "Json" : row.result}\n      }\n`;
  }
  if (process.env.HAVATO_COORDINATION_TYPES_OUTPUT)
    await writeFile(process.env.HAVATO_COORDINATION_TYPES_OUTPUT, fragment);
  else check(types.includes(fragment), true);
}
