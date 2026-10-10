// Full committed migration replay + synthetic local RLS/RPC checks; no hosted access.
import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const db = new PGlite();
const ids = Array.from({length: 7},(_,i)=>`00000000-0000-4000-8000-00000000000${i+1}`);
const [host, guest, other, outsider, minor, noDob, admin] = ids;
const event = '10000000-0000-4000-8000-000000000001';
let checks = 0;
const check = (a,b) => { assert.deepEqual(a,b); checks++; };
const deny = async (p, pattern) => { await assert.rejects(p,pattern); checks++; };
const asUser = (id,sql,role='authenticated') => db.transaction(async tx => {
  await tx.query("SELECT set_config('request.jwt.claim.sub',$1,true)",[id ?? '']);
  await tx.exec(`SET LOCAL ROLE ${role}`);
  return (await tx.query(sql)).rows;
});
try {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,raw_user_meta_data jsonb DEFAULT '{}',email_confirmed_at timestamptz,created_at timestamptz DEFAULT now());
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid $$;
    GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
    CREATE SCHEMA storage;
    CREATE TABLE storage.buckets(id text PRIMARY KEY,name text NOT NULL,public boolean DEFAULT false,file_size_limit bigint,allowed_mime_types text[]);
    CREATE TABLE storage.objects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),bucket_id text,name text,owner uuid);
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    CREATE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$ SELECT (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;
    CREATE PUBLICATION supabase_realtime;`);
  const dir = new URL('../supabase/migrations/', import.meta.url);
  const files = (await readdir(dir)).filter(f=>f.endsWith('.sql')).sort();
  for (const file of files) {
    if (file.startsWith('20260821001412')) await db.exec(`INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data) VALUES
      ('905b2033-45d6-4a92-8edb-f636d4c653fe','fixture-venue@example.test',now(),'{"account_type":"venue"}'),
      ('36a3c386-d417-4bdc-8770-ca0fc5b52097','fixture-admin@example.test',now(),'{}');
      INSERT INTO public.user_roles(user_id,role) VALUES ('36a3c386-d417-4bdc-8770-ca0fc5b52097','admin');`);
    try { await db.exec(await readFile(new URL(file,dir),'utf8')); }
    catch(error) { throw new Error(`${file}: ${error.message}`); }
  }
  console.log(`Applied ${files.length} committed migrations to disposable PostgreSQL`);
  for (let i=0;i<ids.length;i++) await db.query("INSERT INTO auth.users(id,email,email_confirmed_at) VALUES($1,$2,now())",[ids[i],`member${i+1}@example.test`]);
  await db.exec(`UPDATE public.app_config SET beta_launched=true;
    UPDATE public.profiles SET onboarded_at=now(),date_of_birth='1990-01-01' WHERE id IN (${ids.map(id=>`'${id}'`).join(',')});
    ALTER TABLE public.profiles DISABLE TRIGGER USER;
    UPDATE public.profiles SET date_of_birth=current_date-interval '17 years' WHERE id='${minor}';
    ALTER TABLE public.profiles ENABLE TRIGGER USER;
    UPDATE public.profiles SET date_of_birth=NULL WHERE id='${noDob}';
    INSERT INTO public.user_roles(user_id,role) VALUES ('${admin}','admin');`);
  const create = (uid,id=event) => asUser(uid,`INSERT INTO public.gatherings(id,host_id,subject,starts_at,seats,venue_name,neighborhood,visibility)
    VALUES('${id}','${uid}','Private birthday',now()+interval '2 days',2,'Home','','private') RETURNING id`);
  await deny(create(minor),/PRIVATE_ADULT_REQUIRED/);
  await deny(create(noDob),/PRIVATE_ADULT_REQUIRED/);
  check((await create(host))[0].id,event);
  check((await db.query(`SELECT count(*)::int AS n FROM gathering_attendees WHERE gathering_id='${event}'`)).rows[0].n,1);
  check(await asUser(outsider,`SELECT id FROM gatherings WHERE id='${event}'`),[]);
  check(await asUser(null,`SELECT id FROM gatherings WHERE id='${event}'`,'anon'),[]);
  await deny(asUser(host,`UPDATE gatherings SET visibility='public' WHERE id='${event}'`),/IMMUTABLE/);
  await deny(asUser(host,`UPDATE gatherings SET status='approved' WHERE id='${event}'`),/Only admins/);
  await asUser(host,`SELECT invite_gathering_member('${event}',' MEMBER2@example.test ')`); checks++;
  await asUser(host,`SELECT invite_gathering_member('${event}','member3@example.test')`); checks++;
  await deny(asUser(outsider,`SELECT invite_gathering_member('${event}','member2@example.test')`),/Forbidden/);
  await deny(asUser(host,`SELECT invite_gathering_member('${event}','member5@example.test')`),/UNAVAILABLE/);
  await deny(asUser(host,`SELECT invite_gathering_member('${event}','nobody@example.test')`),/UNAVAILABLE/);
  check(await asUser(guest,`SELECT id FROM gatherings WHERE id='${event}'`),[]);
  await asUser(admin,`UPDATE gatherings SET status='approved' WHERE id='${event}'`); checks++;
  check((await asUser(guest,`SELECT id FROM gatherings WHERE id='${event}'`))[0].id,event);
  check(await asUser(outsider,`SELECT id FROM gatherings WHERE id='${event}'`),[]);
  check(await asUser(null,`SELECT id FROM gatherings WHERE id='${event}'`,'anon'),[]);
  check((await asUser(guest,`SELECT recipient_id FROM gathering_invitations`)).length,1);
  check(await asUser(outsider,`SELECT * FROM gathering_invitations`),[]);
  await deny(asUser(guest,`UPDATE gathering_invitations SET response='going'`),/permission denied/);
  await deny(asUser(guest,`INSERT INTO gathering_attendees(gathering_id,user_id) VALUES('${event}','${guest}')`),/row-level security/);
  await deny(asUser(guest,`INSERT INTO gathering_messages(gathering_id,sender_id,body) VALUES('${event}','${guest}','pending')`),/row-level security/);
  await asUser(guest,`SELECT respond_gathering_invitation('${event}','going')`); checks++;
  await asUser(guest,`SELECT respond_gathering_invitation('${event}','going')`); checks++;
  check((await asUser(guest,`SELECT user_id FROM gathering_attendees WHERE gathering_id='${event}'`)).length,2);
  await deny(asUser(other,`SELECT respond_gathering_invitation('${event}','going')`),/GATHERING_FULL/);
  check((await asUser(other,`SELECT response FROM gathering_invitations WHERE gathering_id='${event}'`))[0].response,'invited');
  await deny(asUser(outsider,`SELECT respond_gathering_invitation('${event}','going')`),/Forbidden/);
  await asUser(guest,`INSERT INTO gathering_messages(gathering_id,sender_id,body) VALUES('${event}','${guest}','hello')`); checks++;
  await asUser(host,`INSERT INTO gathering_checklist_items(gathering_id,label) VALUES('${event}','Bring tea')`); checks++;
  check((await asUser(guest,`SELECT label FROM gathering_checklist_items`))[0].label,'Bring tea');
  check(await asUser(other,`SELECT body FROM gathering_messages`),[]);
  check(await asUser(other,`SELECT label FROM gathering_checklist_items`),[]);
  await asUser(guest,`SELECT respond_gathering_invitation('${event}','maybe')`); checks++;
  check((await db.query(`SELECT count(*)::int AS n FROM gathering_attendees WHERE gathering_id='${event}'`)).rows[0].n,1);
  await asUser(other,`SELECT respond_gathering_invitation('${event}','going')`); checks++;
  await asUser(host,`SELECT revoke_gathering_invitation('${event}','${other}')`); checks++;
  check(await asUser(other,`SELECT id FROM gatherings WHERE id='${event}'`),[]);
  check(await asUser(other,`SELECT body FROM gathering_messages`),[]);
  await deny(asUser(other,`SELECT respond_gathering_invitation('${event}','going')`),/Forbidden/);
  await deny(asUser(host,`DELETE FROM gathering_attendees WHERE gathering_id='${event}' AND user_id='${host}'`),/HOST_SEAT_REQUIRED/);
  await asUser(guest,`SELECT respond_gathering_invitation('${event}','going')`);
  await asUser(guest,`DELETE FROM gathering_attendees WHERE gathering_id='${event}' AND user_id='${guest}'`);
  check((await asUser(guest,`SELECT response FROM gathering_invitations WHERE gathering_id='${event}'`))[0].response,'declined');
  await db.exec(`INSERT INTO user_blocks(blocker_id,blocked_id) VALUES('${guest}','${host}')`);
  check(await asUser(guest,`SELECT id FROM gatherings WHERE id='${event}'`),[]);
  await deny(asUser(guest,`SELECT respond_gathering_invitation('${event}','going')`),/Forbidden/);
  await db.exec(`DELETE FROM user_blocks; UPDATE gatherings SET starts_at=now()-interval '4 hours' WHERE id='${event}'`);
  await deny(asUser(guest,`SELECT respond_gathering_invitation('${event}','going')`),/PRIVATE_CLOSED/);
  // Host is eligible for a memory; private enforcement survives source deletion.
  await deny(asUser(host,`INSERT INTO life_moments(user_id,gathering_id,title,happened_at,visibility) VALUES('${host}','${event}','Private birthday',now()-interval '4 hours','profile')`),/PRIVATE_MOMENT_REQUIRED/);
  const moment = (await asUser(host,`INSERT INTO life_moments(user_id,gathering_id,title,happened_at,visibility) VALUES('${host}','${event}','Private birthday',now()-interval '4 hours','private') RETURNING id`))[0].id; checks++;
  check((await asUser(host,`SELECT private_gathering FROM life_moments WHERE id='${moment}'`))[0].private_gathering,true);
  await asUser(host,`DELETE FROM gatherings WHERE id='${event}'`); checks++;
  await deny(asUser(host,`UPDATE life_moments SET visibility='profile' WHERE id='${moment}'`),/PRIVATE_MOMENT_REQUIRED/);
  check((await db.query(`SELECT count(*)::int AS n FROM gathering_invitations WHERE gathering_id='${event}'`)).rows[0].n,0);
  check((await db.query("SELECT has_table_privilege('anon','gathering_invitations','SELECT') AS allowed")).rows[0].allowed,false);
  check((await db.query("SELECT has_function_privilege('anon','public.respond_gathering_invitation(uuid,text)','EXECUTE') AS allowed")).rows[0].allowed,false);
  // Existing public creation/join remain usable with the default visibility.
  const pub = '30000000-0000-4000-8000-000000000001';
  await asUser(host,`INSERT INTO gatherings(id,host_id,subject,starts_at,seats,venue_name,neighborhood) VALUES('${pub}','${host}','Public tea',now()+interval '2 days',4,'Cafe','Center')`); checks++;
  await asUser(admin,`UPDATE gatherings SET status='approved' WHERE id='${pub}'`);
  check((await asUser(null,`SELECT visibility FROM gatherings WHERE id='${pub}'`,'anon'))[0].visibility,'public');
  await asUser(outsider,`INSERT INTO gathering_attendees(gathering_id,user_id) VALUES('${pub}','${outsider}')`); checks++;
  await deny(asUser(outsider,`INSERT INTO gathering_invitations(gathering_id,recipient_id) VALUES('${pub}','${guest}')`),/permission denied/);
  const adultEvent = '40000000-0000-4000-8000-000000000001';
  await db.exec(`UPDATE auth.users SET email_confirmed_at=NULL WHERE id='${outsider}'`);
  await deny(create(outsider,adultEvent),/ADULT_REQUIRED/);
  await db.exec(`UPDATE auth.users SET email_confirmed_at=now() WHERE id='${outsider}'; UPDATE app_config SET beta_launched=false`);
  await deny(create(outsider,adultEvent),/ADULT_REQUIRED/);
  await db.exec(`UPDATE app_config SET beta_launched=true`);
  const columns = (await db.query("SELECT table_name,column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' AND (table_name='gathering_invitations' OR column_name IN ('visibility','private_gathering')) ORDER BY table_name,ordinal_position")).rows;
  const types = await readFile(new URL('../src/integrations/supabase/types.ts',import.meta.url),'utf8');
  const invitationColumns = columns.filter(c=>c.table_name==='gathering_invitations');
  const fields = kind => invitationColumns.map(c=>{
    const optional = kind==='Update' || (kind==='Insert' && (c.column_default!==null || c.is_nullable==='YES'));
    return `          ${c.column_name}${optional?'?':''}: string${c.is_nullable==='YES'?' | null':''};`;
  });
  const invitationTypes = `      gathering_invitations: {\n${['Row','Insert','Update'].map(kind=>`        ${kind}: {\n${fields(kind).join('\n')}\n        };`).join('\n')}\n        Relationships: [{ foreignKeyName: "gathering_invitations_gathering_id_fkey"; columns: ["gathering_id"]; isOneToOne: false; referencedRelation: "gatherings"; referencedColumns: ["id"] }];\n      };\n`;
  const declared = types.slice(types.indexOf('      gathering_invitations: {'),types.indexOf('      gatherings: {'));
  for (const kind of ['Row','Insert','Update']) {
    const block = declared.match(new RegExp(`${kind}: \\{([^}]+)\\}`))[1];
    for(const field of fields(kind)) check(block.replace(/\s+/g,' ').includes(field.trim().replace(/;$/,'')),true);
  }
  for(const [table,column,type] of [['gatherings','visibility','string'],['life_moments','private_gathering','boolean']]) {
    const block=types.slice(types.indexOf(`      ${table}: {`));
    for(const kind of ['Row','Insert','Update']) {
      const declaration=block.match(new RegExp(`${kind}: \\{([^}]+)\\}`))[1];
      check(declaration.includes(`${column}${kind==='Row'?'':'?'}: ${type}`),true);
    }
  }
  if(process.argv[4]) await writeFile(process.argv[4],invitationTypes);
  if (process.argv[3]) await writeFile(process.argv[3],JSON.stringify(columns,null,2));
  const { checkGuestInvitations } = await import('./guest-invitations.local.mjs');
  await checkGuestInvitations({ db, asUser, host, guest, other, outsider, admin, check, deny });
  console.log(`${checks} Phase 6 PostgreSQL checks passed (member and external guest invitations)`);
} catch(error) { console.error(error.message); process.exitCode=1; }
finally { await db.close(); }
