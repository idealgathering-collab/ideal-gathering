BEGIN;

-- A narrowly scoped definer aggregate avoids granting venues raw attendee access.
CREATE FUNCTION private.can_manage_venue(_business uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT private.has_role(auth.uid(), 'admin'::public.app_role)
    OR (private.is_venue(auth.uid()) AND private.is_email_verified(auth.uid())
      AND public.is_beta_launched()
      AND EXISTS (SELECT 1 FROM public.businesses b
        WHERE b.id = _business AND b.owner_id = auth.uid() AND b.status = 'approved'))
$$;
REVOKE ALL ON FUNCTION private.can_manage_venue(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.can_manage_venue(uuid) TO authenticated;

-- Existing permissive ownership policies remain; these enforce access on writes.
CREATE POLICY venue_tables_access_insert ON public.venue_tables AS RESTRICTIVE
  FOR INSERT TO authenticated WITH CHECK (private.can_manage_venue(business_id));
CREATE POLICY venue_tables_access_update ON public.venue_tables AS RESTRICTIVE
  FOR UPDATE TO authenticated USING (private.can_manage_venue(business_id))
  WITH CHECK (private.can_manage_venue(business_id));
CREATE POLICY venue_tables_access_delete ON public.venue_tables AS RESTRICTIVE
  FOR DELETE TO authenticated USING (private.can_manage_venue(business_id));
CREATE POLICY menu_access_insert ON public.menu_items AS RESTRICTIVE
  FOR INSERT TO authenticated WITH CHECK (private.can_manage_venue(business_id));
CREATE POLICY menu_access_update ON public.menu_items AS RESTRICTIVE
  FOR UPDATE TO authenticated USING (private.can_manage_venue(business_id))
  WITH CHECK (private.can_manage_venue(business_id));
CREATE POLICY menu_access_delete ON public.menu_items AS RESTRICTIVE
  FOR DELETE TO authenticated USING (private.can_manage_venue(business_id));
CREATE POLICY venue_activation_access ON public.gatherings AS RESTRICTIVE
  FOR INSERT TO authenticated WITH CHECK (
    origin <> 'venue_activated' OR private.can_manage_venue(business_id));

-- Join is not attendance. Preserve existing check-in validation on UPDATE.
CREATE FUNCTION public.guard_attendance_evidence()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL OR private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.checked_in_at := NULL; NEW.checked_in_by := NULL;
    NEW.checked_out_at := NULL; NEW.checked_out_by := NULL;
    NEW.checkin_lat := NULL; NEW.checkin_lng := NULL;
    NEW.checkout_lat := NULL; NEW.checkout_lng := NULL;
  ELSE
    IF NEW.checked_in_at IS DISTINCT FROM OLD.checked_in_at THEN
      NEW.checked_in_at := CASE WHEN NEW.checked_in_at IS NULL THEN NULL ELSE now() END;
      NEW.checked_in_by := CASE WHEN NEW.checked_in_at IS NULL THEN NULL ELSE auth.uid() END;
    ELSE NEW.checked_in_by := OLD.checked_in_by;
    END IF;
    IF NEW.checked_out_at IS DISTINCT FROM OLD.checked_out_at THEN
      NEW.checked_out_at := CASE WHEN NEW.checked_out_at IS NULL THEN NULL ELSE now() END;
      NEW.checked_out_by := CASE WHEN NEW.checked_out_at IS NULL THEN NULL ELSE auth.uid() END;
    ELSE NEW.checked_out_by := OLD.checked_out_by;
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_attendance_evidence() FROM PUBLIC, anon, authenticated;
-- Alphabetically after gathering_attendees_attendance_guard: validate, then stamp.
CREATE TRIGGER z_attendance_evidence BEFORE INSERT OR UPDATE ON public.gathering_attendees
  FOR EACH ROW EXECUTE FUNCTION public.guard_attendance_evidence();

-- Do not let host edits retrospectively move confirmed traffic to another venue.
CREATE FUNCTION public.guard_gathering_attribution()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NOT NULL
    AND NOT private.has_role(auth.uid(), 'admin'::public.app_role)
    AND (NEW.business_id IS DISTINCT FROM OLD.business_id
      OR NEW.host_id IS DISTINCT FROM OLD.host_id
      OR NEW.starts_at IS DISTINCT FROM OLD.starts_at
      OR NEW.ends_at IS DISTINCT FROM OLD.ends_at)
    AND EXISTS (SELECT 1 FROM public.gathering_attendees a
      WHERE a.gathering_id = OLD.id AND a.checked_in_at IS NOT NULL) THEN
    RAISE EXCEPTION 'ATTENDANCE_ATTRIBUTION_LOCKED';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_gathering_attribution() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER gathering_attribution_guard BEFORE UPDATE ON public.gatherings
  FOR EACH ROW EXECUTE FUNCTION public.guard_gathering_attribution();

CREATE FUNCTION public.get_venue_dashboard(
  _business_id uuid DEFAULT NULL, _upcoming_page integer DEFAULT 0, _completed_page integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  venue public.businesses%ROWTYPE;
  staff boolean := private.has_role(auth.uid(), 'admin'::public.app_role)
    OR private.has_role(auth.uid(), 'owner'::public.app_role);
  cutoff timestamptz := now() - interval '720 hours';
  horizon timestamptz := now() + interval '2160 hours';
  result jsonb;
BEGIN
  IF auth.uid() IS NULL OR _upcoming_page IS NULL OR _completed_page IS NULL
    OR _upcoming_page NOT BETWEEN 0 AND 10000 OR _completed_page NOT BETWEEN 0 AND 10000 THEN
    RAISE EXCEPTION 'Dashboard unavailable';
  END IF;
  SELECT * INTO venue FROM public.businesses b
    WHERE b.id = _business_id OR (_business_id IS NULL AND b.owner_id = auth.uid());
  IF venue.id IS NULL OR (NOT staff AND (
    venue.owner_id <> auth.uid() OR NOT private.is_venue(auth.uid())
    OR NOT private.is_email_verified(auth.uid())
    OR NOT public.is_beta_launched() OR venue.status <> 'approved')) THEN
    RAISE EXCEPTION 'Dashboard unavailable';
  END IF;

  WITH eligible AS MATERIALIZED (
    SELECT g.id, g.subject, g.starts_at, coalesce(g.ends_at,g.starts_at+interval '2 hours') AS ends_at,
      g.seats, g.host_id, g.origin,
      CASE WHEN g.gathering_type IN
        ('coffee','food','city','outdoors','games','creative','arts','learning','books','tech','spontaneous')
        THEN g.gathering_type ELSE 'other' END AS category
    FROM public.gatherings g
    WHERE g.business_id = venue.id AND g.status = 'approved'
      AND NOT private.is_blocked_pair(venue.owner_id,g.host_id)
      AND NOT private.is_blocked_pair(auth.uid(),g.host_id)
  ), attendees AS MATERIALIZED (
    SELECT a.gathering_id, a.user_id, a.checked_in_at
    FROM public.gathering_attendees a JOIN eligible g ON g.id = a.gathering_id
    WHERE NOT private.is_blocked_pair(venue.owner_id,a.user_id)
      AND NOT private.is_blocked_pair(g.host_id,a.user_id)
      AND NOT private.is_blocked_pair(auth.uid(),a.user_id)
  ), visits AS MATERIALIZED (
    SELECT a.* FROM attendees a JOIN eligible g ON g.id = a.gathering_id
    WHERE a.checked_in_at IS NOT NULL AND a.checked_in_at <= now()
      AND a.checked_in_at >= g.starts_at - interval '30 minutes'
      AND a.checked_in_at <= g.ends_at + interval '24 hours'
      AND g.starts_at <= now()
  ), period_visits AS MATERIALIZED (
    SELECT * FROM visits WHERE checked_in_at >= cutoff
  ), first_visits AS (
    SELECT user_id, min(checked_in_at) AS first_at FROM visits GROUP BY user_id
  ), completed AS MATERIALIZED (
    SELECT * FROM eligible WHERE ends_at >= cutoff AND ends_at <= now()
  ), upcoming AS MATERIALIZED (
    SELECT * FROM eligible WHERE ends_at > now() AND starts_at < horizon
  ), categories AS (
    SELECT category, count(*) AS total FROM completed GROUP BY category
  ), periods AS (
    SELECT i, cutoff + i * interval '240 hours' AS start_at,
      cutoff + (i+1) * interval '240 hours' AS end_at FROM generate_series(0,2) i
  )
  SELECT jsonb_build_object(
    'period_start',cutoff,'period_end',now(),'upcoming_until',horizon,
    'upcoming_count',(SELECT count(*) FROM upcoming),
    'completed_count',(SELECT count(*) FROM completed),
    'visits',(SELECT count(*) FROM period_visits),
    'unique_visitors',(SELECT count(DISTINCT user_id) FROM period_visits),
    'new_visitors',(SELECT count(*) FROM first_visits f WHERE f.first_at >= cutoff
      AND EXISTS(SELECT 1 FROM period_visits p WHERE p.user_id=f.user_id)),
    'returning_visitors',(SELECT count(*) FROM first_visits f WHERE f.first_at < cutoff
      AND EXISTS(SELECT 1 FROM period_visits p WHERE p.user_id=f.user_id)),
    'average_attendance',(SELECT CASE WHEN count(*) = 0 THEN NULL ELSE
      round((SELECT count(*) FROM visits v JOIN completed c ON c.id=v.gathering_id)::numeric/count(*),2)
      END FROM completed),
    'categories',CASE WHEN (SELECT count(*) FROM completed) >= 5
      AND (SELECT count(*) FROM visits v JOIN completed c ON c.id=v.gathering_id) >= 10
      THEN coalesce((SELECT jsonb_agg(jsonb_build_object('category',category,'count',total)
        ORDER BY total DESC,category COLLATE "C") FROM categories),'[]'::jsonb) ELSE NULL END,
    'periods',(SELECT jsonb_agg(jsonb_build_object('start',p.start_at,'end',p.end_at,
      'visits',(SELECT count(*) FROM period_visits v WHERE v.checked_in_at >= p.start_at
        AND (v.checked_in_at < p.end_at OR (p.i=2 AND v.checked_in_at=p.end_at))))
      ORDER BY p.i) FROM periods p),
    'upcoming',coalesce((SELECT jsonb_agg(jsonb_build_object(
      'id',g.id,'title',g.subject,'starts_at',g.starts_at,'ends_at',g.ends_at,
      'category',g.category,'capacity',g.seats,'venue_hosted',g.origin='venue_activated',
      'participants',(SELECT count(*) FROM attendees a WHERE a.gathering_id=g.id),
      'verified',(SELECT count(*) FROM visits v WHERE v.gathering_id=g.id),
      'can_open',staff,'status',CASE WHEN g.starts_at<=now() THEN 'ongoing' ELSE 'upcoming' END)
      ORDER BY g.starts_at,g.id) FROM
      (SELECT * FROM upcoming ORDER BY starts_at,id LIMIT 20 OFFSET _upcoming_page*20) g),'[]'::jsonb),
    'completed',coalesce((SELECT jsonb_agg(jsonb_build_object(
      'id',g.id,'title',g.subject,'starts_at',g.starts_at,'ends_at',g.ends_at,
      'category',g.category,'capacity',g.seats,'venue_hosted',g.origin='venue_activated',
      'participants',(SELECT count(*) FROM attendees a WHERE a.gathering_id=g.id),
      'verified',(SELECT count(*) FROM visits v WHERE v.gathering_id=g.id),
      'can_open',staff,'status','completed')
      ORDER BY g.ends_at DESC,g.id) FROM
      (SELECT * FROM completed ORDER BY ends_at DESC,id LIMIT 20 OFFSET _completed_page*20) g),'[]'::jsonb)
  ) INTO result;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.get_venue_dashboard(uuid,integer,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_venue_dashboard(uuid,integer,integer) TO authenticated;
CREATE INDEX gatherings_venue_start ON public.gatherings(business_id,starts_at);
NOTIFY pgrst, 'reload schema';
COMMIT;
