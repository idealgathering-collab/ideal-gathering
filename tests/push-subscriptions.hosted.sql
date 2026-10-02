-- Havato ntmnpmdjfrbporcvafei ONLY. Two synthetic fixtures; everything rolls back.
-- No email, passwords, existing account edits, real endpoints or push delivery.
BEGIN;
INSERT INTO auth.users(id,aud,role,email) VALUES
 ('ce18d862-539e-424b-afc0-2e6c45e4dca1','authenticated','authenticated','push-fixture-a@example.invalid'),
 ('ce18d862-539e-424b-afc0-2e6c45e4dca2','authenticated','authenticated','push-fixture-b@example.invalid');
SELECT set_config('request.jwt.claim.sub','ce18d862-539e-424b-afc0-2e6c45e4dca1',true);
SET LOCAL ROLE authenticated;
INSERT INTO public.push_subscriptions(endpoint,user_id,p256dh,auth,application_server_key) VALUES
 ('https://push.example.invalid/hosted-a1',auth.uid(),'B'||repeat('A',86),repeat('A',22),'B'||repeat('A',86)),
 ('https://push.example.invalid/hosted-a2',auth.uid(),'B'||repeat('A',86),repeat('A',22),'B'||repeat('A',86));
INSERT INTO public.push_subscriptions(endpoint,user_id,p256dh,auth,application_server_key) VALUES
 ('https://push.example.invalid/hosted-a1',auth.uid(),'B'||repeat('A',86),repeat('A',22),'B'||repeat('A',86))
 ON CONFLICT(endpoint) DO UPDATE SET auth=EXCLUDED.auth;
DO $$ BEGIN
 IF (SELECT count(*) FROM public.push_subscriptions WHERE endpoint LIKE 'https://push.example.invalid/hosted-%') <> 2 THEN
   RAISE EXCEPTION 'Own read/multi-device/upsert failed';
 END IF;
 BEGIN
   UPDATE public.push_subscriptions SET user_id='ce18d862-539e-424b-afc0-2e6c45e4dca2';
   RAISE EXCEPTION 'Ownership reassignment was allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','ce18d862-539e-424b-afc0-2e6c45e4dca2',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE changed integer; BEGIN
 IF EXISTS (SELECT FROM public.push_subscriptions WHERE endpoint LIKE 'https://push.example.invalid/hosted-%') THEN
   RAISE EXCEPTION 'Cross-user read allowed';
 END IF;
 BEGIN
   INSERT INTO public.push_subscriptions(endpoint,user_id,p256dh,auth,application_server_key) VALUES
   ('https://push.example.invalid/forged','ce18d862-539e-424b-afc0-2e6c45e4dca1','B'||repeat('A',86),repeat('A',22),'B'||repeat('A',86));
   RAISE EXCEPTION 'Forged insert allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
   INSERT INTO public.push_subscriptions(endpoint,user_id,p256dh,auth,application_server_key) VALUES
   ('https://push.example.invalid/hosted-a1',auth.uid(),'B'||repeat('A',86),repeat('A',22),'B'||repeat('A',86))
   ON CONFLICT(endpoint) DO UPDATE SET user_id=EXCLUDED.user_id;
   RAISE EXCEPTION 'Cross-user endpoint takeover allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 UPDATE public.push_subscriptions SET auth=repeat('B',22) WHERE endpoint LIKE 'https://push.example.invalid/hosted-%';
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed<>0 THEN RAISE EXCEPTION 'Cross-user update allowed'; END IF;
 DELETE FROM public.push_subscriptions WHERE endpoint LIKE 'https://push.example.invalid/hosted-%';
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed<>0 THEN RAISE EXCEPTION 'Cross-user deletion allowed'; END IF;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','ce18d862-539e-424b-afc0-2e6c45e4dca1',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE changed integer; BEGIN
 DELETE FROM public.push_subscriptions WHERE endpoint='https://push.example.invalid/hosted-a1';
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed<>1 THEN RAISE EXCEPTION 'Own unsubscribe deletion failed'; END IF;
END $$;
RESET ROLE;
ROLLBACK;
SELECT 'PASS: own read/insert/upsert/delete, multiple devices, denied cross-user read/insert/update/delete/reassignment/takeover; all fixtures rolled back' AS result;
