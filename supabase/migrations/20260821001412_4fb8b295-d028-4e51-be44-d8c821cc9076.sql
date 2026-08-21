DO $$
DECLARE
  v_uid uuid := '905b2033-45d6-4a92-8edb-f636d4c653fe';
  v_admin uuid := '36a3c386-d417-4bdc-8770-ca0fc5b52097';
  v_biz uuid;
  v_tbl uuid;
  v_gid uuid;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated', 'email', 'venue-test@example.com', 'email_confirmed_at', now())::text, true);
  SET LOCAL ROLE authenticated;

  INSERT INTO public.businesses (owner_id, name, city, address, description, cover_url, lat, lng, phone, mobile)
  VALUES (v_uid, 'ZZ Grant Smoke Test', 'Istanbul', 'Test street 1', 'smoke test', 'https://example.com/x.jpg', 41.0, 29.0, '+900000000', '+900000000')
  RETURNING id INTO v_biz;
  RAISE NOTICE 'insert businesses OK %', v_biz;

  UPDATE public.businesses SET description = 'edited' WHERE id = v_biz;
  RAISE NOTICE 'update businesses OK';

  INSERT INTO public.venue_tables (business_id, label, capacity)
  VALUES (v_biz, 'ZZ Test Table', 4) RETURNING id INTO v_tbl;
  RAISE NOTICE 'insert venue_tables OK %', v_tbl;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  UPDATE public.businesses SET status = 'approved' WHERE id = v_biz;
  RAISE NOTICE 'admin approve OK';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated', 'email', 'venue-test@example.com', 'email_confirmed_at', now())::text, true);
  INSERT INTO public.gatherings (business_id, table_id, host_id, subject, starts_at, seats, origin, status, venue_name, neighborhood, city)
  VALUES (v_biz, v_tbl, v_uid, 'ZZ Test Gathering', now() + interval '2 days', 4, 'venue_activated', 'approved', 'ZZ Grant Smoke Test', 'Kadikoy', 'Istanbul')
  RETURNING id INTO v_gid;
  RAISE NOTICE 'insert gatherings OK %', v_gid;

  RESET ROLE;
  DELETE FROM public.gatherings WHERE id = v_gid;
  DELETE FROM public.venue_tables WHERE id = v_tbl;
  DELETE FROM public.businesses WHERE id = v_biz;
END $$;