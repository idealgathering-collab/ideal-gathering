// Invoked by the full migration replay harness, never uses a hosted database.
import { readFile, writeFile } from 'node:fs/promises';
export async function checkGuestInvitations({ db, asUser, host, guest, other, outsider, admin, check, deny }) {
  const event='62000000-0000-4000-8000-000000000001';
  const hash='a'.repeat(64), hash2='b'.repeat(64);
  const manage=(uid,action,extra='')=>asUser(uid,`SELECT public.manage_guest_invitation('${event}','${action}'${extra}) AS result`);
  const use=(h,adult=true,response=null,name=null,role='service_role')=>asUser(null,`SELECT public.use_guest_invitation('${h}',${adult===null?'NULL':adult},${response?`'${response}'`:'NULL'},${name?`'${name}'`:'NULL'}) AS result`,role);
  await asUser(host,`INSERT INTO public.gatherings(id,host_id,subject,starts_at,seats,venue_name,neighborhood,visibility)
    VALUES('${event}','${host}','Guest tea',now()+interval '2 days',2,'Private home','','private')`);
  await deny(manage(outsider,'list'),/Forbidden/);
  await deny(manage(guest,'create',`,'${hash}','Guest',3`),/Forbidden/);
  await deny(manage(host,'create',`,'bad','Guest',3`),/Invalid invitation/);
  await deny(manage(host,'create',`,'${hash}','Guest',99`),/Invalid invitation/);
  await deny(manage(host,'create',`,'${hash}','',3`),/Invalid invitation/);
  const first=(await manage(host,'create',`,'${hash}','Host label',7`))[0].result;
  check(typeof first.id,'string');
  check(new Date(first.expires_at).getTime(),new Date((await db.query(`SELECT starts_at FROM public.gatherings WHERE id='${event}'`)).rows[0].starts_at).getTime());
  const second=(await manage(host,'create',`,'${hash2}','Second guest',1`))[0].result;
  check((await manage(host,'list'))[0].result.length,2);
  check('token_hash' in (await manage(host,'list'))[0].result[0],false);
  check((await use(hash))[0].result,null); // Proposed: no details even with valid bearer.
  await asUser(admin,`UPDATE public.gatherings SET status='approved' WHERE id='${event}'`);
  check((await use(hash,false))[0].result,null);
  check((await use(hash,null))[0].result,null);
  check((await use('c'.repeat(64)))[0].result,null);
  check((await use('invalid'))[0].result,null);
  await deny(use(hash,true,null,null,'anon'),/permission denied/);
  await deny(use(hash,true,null,null,'authenticated'),/permission denied/);
  await deny(asUser(null,`SELECT * FROM private.gathering_guest_invitations`,'anon'),/permission denied/);
  await deny(asUser(host,`SELECT * FROM private.gathering_guest_invitations`),/permission denied/);
  await deny(asUser(null,`SELECT * FROM private.gathering_guest_invitations`,'service_role'),/permission denied/);
  check(await asUser(null,`SELECT id FROM public.gatherings WHERE id='${event}'`,'anon'),[]);
  check(await asUser(outsider,`SELECT id FROM public.gatherings WHERE id='${event}'`),[]);
  const details=(await use(hash))[0].result;
  check(Object.keys(details).sort(),['subject','starts_at','venue_name','address','description','response','guest_name','expires_at'].sort());
  check(details.response,'invited');
  await deny(use(hash,true,'going',''),/Invalid response/);
  await deny(use(hash,true,'invalid','Guest'),/Invalid response/);
  check((await use(hash,true,'going','Guest One'))[0].result.response,'going');
  check((await use(hash,true,'going','Guest One'))[0].result.response,'going');
  check((await asUser(host,`SELECT public.private_gathering_seat_counts(ARRAY['${event}']::uuid[]) AS counts`))[0].counts,{[event]:2});
  check((await asUser(outsider,`SELECT public.private_gathering_seat_counts(ARRAY['${event}']::uuid[]) AS counts`))[0].counts,{});
  await deny(asUser(null,`SELECT public.private_gathering_seat_counts(ARRAY['${event}']::uuid[])`,'anon'),/permission denied/);
  check((await db.query(`SELECT count(*)::int n FROM public.gathering_attendees WHERE gathering_id='${event}'`)).rows[0].n,1);
  check((await db.query(`SELECT count(*)::int n FROM auth.users`)).rows[0].n,9); // No guest auth user created.
  await deny(use(hash2,true,'going','Guest Two'),/GATHERING_FULL/);
  check((await use(hash2))[0].result.response,'invited');
  await asUser(host,`SELECT public.invite_gathering_member('${event}','member2@example.test')`);
  await deny(asUser(guest,`SELECT public.respond_gathering_invitation('${event}','going')`),/GATHERING_FULL/);
  check((await use(hash,true,'maybe','Guest One'))[0].result.response,'maybe');
  await asUser(guest,`SELECT public.respond_gathering_invitation('${event}','going')`);
  await deny(use(hash,true,'going','Guest One'),/GATHERING_FULL/);
  check((await use(hash))[0].result.response,'maybe');
  await asUser(guest,`SELECT public.respond_gathering_invitation('${event}','declined')`);
  await use(hash,true,'going','Guest One');
  await deny(manage(outsider,'revoke',`,NULL,NULL,NULL,'${first.id}'`),/Forbidden/);
  await manage(host,'revoke',`,NULL,NULL,NULL,'${first.id}'`);
  check((await use(hash))[0].result,null);
  check((await use(hash,true,'going','Again'))[0].result,null);
  await use(hash2,true,'going','Guest Two');
  await db.exec(`UPDATE private.gathering_guest_invitations SET expires_at=now()-interval '1 minute',created_at=now()-interval '2 days' WHERE id='${second.id}'`);
  check((await use(hash2))[0].result,null);
  await asUser(guest,`SELECT public.respond_gathering_invitation('${event}','going')`); // Expired guest seat released.
  await asUser(guest,`SELECT public.respond_gathering_invitation('${event}','declined')`);
  const thirdHash='d'.repeat(64);
  const third=(await manage(host,'create',`,'${thirdHash}','Third',1`))[0].result;
  await use(thirdHash,true,'going','Guest Three');
  await asUser(admin,`UPDATE public.gatherings SET seats=3 WHERE id='${event}'`);
  await asUser(guest,`SELECT public.respond_gathering_invitation('${event}','going')`);
  await deny(asUser(admin,`UPDATE public.gatherings SET seats=2 WHERE id='${event}'`),/GATHERING_FULL/);
  await asUser(admin,`UPDATE public.gatherings SET status='cancelled' WHERE id='${event}'`);
  check((await use(thirdHash))[0].result,null);
  await asUser(admin,`UPDATE public.gatherings SET status='approved' WHERE id='${event}'`);
  await db.exec(`UPDATE public.profiles SET date_of_birth=NULL WHERE id='${host}'`);
  check((await use(thirdHash))[0].result,null);
  await db.exec(`UPDATE public.profiles SET date_of_birth='1990-01-01' WHERE id='${host}'`);
  await asUser(host,`UPDATE public.gatherings SET starts_at=now()-interval '1 minute' WHERE id='${event}'`);
  check((await use(thirdHash))[0].result,null);
  await deny(manage(host,'create',`,'${'e'.repeat(64)}','Late',1`),/PRIVATE_CLOSED/);
  await asUser(host,`UPDATE public.gatherings SET starts_at=now()+interval '2 days' WHERE id='${event}'`);
  // Persisted throttles count errors and use database locks/upserts across workers.
  const rateHash='f'.repeat(64);
  for(let n=0;n<30;n++) check((await asUser(null,`SELECT public.guest_invitation_limit('${rateHash}') AS allowed`,'service_role'))[0].allowed,true);
  check((await asUser(null,`SELECT public.guest_invitation_limit('${rateHash}') AS allowed`,'service_role'))[0].allowed,false);
  await deny(asUser(guest,`SELECT public.guest_invitation_limit('${rateHash}')`),/permission denied/);
  await db.exec(`UPDATE private.guest_request_limits SET window_start=now()-interval '11 minutes'`);
  check((await asUser(null,`SELECT public.guest_invitation_limit('${rateHash}') AS allowed`,'service_role'))[0].allowed,true);
  await db.exec(`UPDATE private.guest_request_limits SET hits=300 WHERE bucket='global'`);
  check((await asUser(null,`SELECT public.guest_invitation_limit('${'0'.repeat(64)}') AS allowed`,'service_role'))[0].allowed,false);
  check((await db.query(`SELECT count(*)::int n FROM private.guest_request_limits WHERE bucket='token:${'0'.repeat(64)}'`)).rows[0].n,0);
  await db.exec(`TRUNCATE private.guest_request_limits`);
  for(let n=0;n<60;n++) await asUser(null,`SELECT public.guest_invitation_limit('${n.toString(16).padStart(64,'0')}','${rateHash}')`,'service_role');
  check((await asUser(null,`SELECT public.guest_invitation_limit('${'1'.repeat(64)}','${rateHash}') AS allowed`,'service_role'))[0].allowed,false);
  // Host quota cannot be evaded by revoking invitations.
  await db.exec(`UPDATE private.gathering_guest_invitations SET created_at=now()-interval '2 hours' WHERE gathering_id='${event}'`);
  for(let n=0;n<30;n++) await manage(host,'create',`,'${(n+100).toString(16).padStart(64,'0')}','Quota',1`);
  await manage(host,'revoke',`,NULL,NULL,NULL,'${third.id}'`);
  await deny(manage(host,'create',`,'${'9'.repeat(64)}','Over quota',1`),/GUEST_RATE_LIMIT/);
  check((await db.query(`SELECT relrowsecurity FROM pg_class WHERE oid='private.gathering_guest_invitations'::regclass`)).rows[0].relrowsecurity,true);
  for(const role of ['anon','authenticated']) {
    for(const sig of ['public.use_guest_invitation(text,boolean,text,text)','private.use_guest_invitation(text,boolean,text,text)','public.guest_invitation_limit(text,text)']) {
      check((await db.query(`SELECT has_function_privilege('${role}','${sig}','EXECUTE') AS allowed`)).rows[0].allowed,false);
    }
  }
  await asUser(host,`DELETE FROM public.gatherings WHERE id='${event}'`);
  check((await db.query(`SELECT count(*)::int n FROM private.gathering_guest_invitations WHERE gathering_id='${event}'`)).rows[0].n,0);
  // Generate/verify new public RPC types from the actually replayed pg_catalog.
  const rows=(await db.query(`SELECT p.proname,p.proargnames,p.pronargdefaults,p.proargtypes::oid[]::text AS argtypes,
    pg_catalog.format_type(p.prorettype,NULL) AS result_type
    FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace
    WHERE ns.nspname='public' AND p.proname IN ('manage_guest_invitation','use_guest_invitation','guest_invitation_limit','private_gathering_seat_counts') ORDER BY p.proname`)).rows;
  let fragment='';
  for(const row of rows) {
    const oidList=row.argtypes.replace(/^.*\{/,'').replace(/\}$/,'').split(',');
    const fields=[];
    for(let n=0;n<row.proargnames.length;n++) {
      const type=(await db.query(`SELECT format_type($1::oid,NULL) AS t`,[oidList[n]])).rows[0].t;
      fields.push(`          ${row.proargnames[n]}${n>=row.proargnames.length-row.pronargdefaults?'?':''}: ${type==='boolean'?'boolean':type==='integer'?'number':type==='uuid[]'?'string[]':'string'}`);
    }
    fragment+=`      ${row.proname}: {\n        Args: {\n${fields.join('\n')}\n        }\n        Returns: ${row.result_type==='jsonb'?'Json':'boolean'}\n      }\n`;
  }
  if(process.env.HAVATO_GUEST_TYPES_OUTPUT) await writeFile(process.env.HAVATO_GUEST_TYPES_OUTPUT,fragment);
  else {
    const types=await readFile(new URL('../src/integrations/supabase/types.ts',import.meta.url),'utf8');
    check(types.includes(fragment),true);
  }
}
