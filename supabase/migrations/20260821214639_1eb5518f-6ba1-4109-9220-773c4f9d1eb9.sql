ALTER TABLE public.gathering_attendees
  ADD COLUMN IF NOT EXISTS checked_out_at timestamptz,
  ADD COLUMN IF NOT EXISTS checked_out_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS checkin_lat numeric,
  ADD COLUMN IF NOT EXISTS checkin_lng numeric,
  ADD COLUMN IF NOT EXISTS checkout_lat numeric,
  ADD COLUMN IF NOT EXISTS checkout_lng numeric;

-- Attendees may update their own row; the trigger below constrains what they may change.
DROP POLICY IF EXISTS "Attendees self check in" ON public.gathering_attendees;
CREATE POLICY "Attendees self check in"
ON public.gathering_attendees FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION private.meters_between(lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 2 * 6371000 * asin(least(1, sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  )));
$$;

CREATE OR REPLACE FUNCTION public.guard_attendance_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $function$
declare
  _status gathering_status;
  _starts timestamptz;
  _ends timestamptz;
  _host uuid;
  _glat numeric; _glng numeric;
  _is_admin boolean;
  _is_host boolean;
  _dist double precision;
begin
  _is_admin := private.has_role(auth.uid(), 'admin'::app_role);
  if _is_admin then return new; end if;

  select g.status, g.starts_at, g.ends_at, g.host_id,
         coalesce(g.lat, b.lat), coalesce(g.lng, b.lng)
    into _status, _starts, _ends, _host, _glat, _glng
    from public.gatherings g
    left join public.businesses b on b.id = g.business_id
   where g.id = new.gathering_id;

  _is_host := _host = auth.uid();

  if new.user_id is distinct from old.user_id
     or new.gathering_id is distinct from old.gathering_id
     or new.joined_at is distinct from old.joined_at then
    raise exception 'ATTENDANCE_IMMUTABLE_FIELDS';
  end if;

  if _status in ('cancelled','rejected') then raise exception 'GATHERING_CLOSED'; end if;

  if (new.checked_in_at is distinct from old.checked_in_at
      or new.checked_out_at is distinct from old.checked_out_at) then
    if now() < _starts - interval '30 minutes' then
      raise exception 'CHECKIN_TOO_EARLY';
    end if;
    if now() > coalesce(_ends, _starts + interval '2 hours') + interval '24 hours' then
      raise exception 'CHECKIN_WINDOW_CLOSED';
    end if;
  end if;

  if not _is_host then
    -- Self-service path: attendee updating their own row.
    if new.user_id is distinct from auth.uid() then
      raise exception 'ATTENDANCE_FORBIDDEN';
    end if;

    -- Timestamps are append-only for self-service.
    if old.checked_in_at is not null and new.checked_in_at is distinct from old.checked_in_at then
      raise exception 'ATTENDANCE_ALREADY_SET';
    end if;
    if old.checked_out_at is not null and new.checked_out_at is distinct from old.checked_out_at then
      raise exception 'ATTENDANCE_ALREADY_SET';
    end if;
    if new.checked_out_at is not null and new.checked_in_at is null then
      raise exception 'NOT_CHECKED_IN';
    end if;

    if new.checked_in_at is distinct from old.checked_in_at and new.checked_in_at is not null then
      if _glat is not null and _glng is not null then
        if new.checkin_lat is null or new.checkin_lng is null then
          raise exception 'LOCATION_REQUIRED';
        end if;
        _dist := private.meters_between(new.checkin_lat, new.checkin_lng, _glat, _glng);
        if _dist > 100 then
          raise exception 'CHECKIN_TOO_FAR: % m', round(_dist);
        end if;
      end if;
    end if;

    if new.checked_out_at is distinct from old.checked_out_at and new.checked_out_at is not null then
      if _glat is not null and _glng is not null then
        if new.checkout_lat is null or new.checkout_lng is null then
          raise exception 'LOCATION_REQUIRED';
        end if;
        _dist := private.meters_between(new.checkout_lat, new.checkout_lng, _glat, _glng);
        if _dist > 100 then
          raise exception 'CHECKIN_TOO_FAR: % m', round(_dist);
        end if;
      end if;
    end if;
  end if;

  new.checked_in_by := case when new.checked_in_at is null then null else coalesce(old.checked_in_by, auth.uid()) end;
  new.checked_out_by := case when new.checked_out_at is null then null else coalesce(old.checked_out_by, auth.uid()) end;
  return new;
end $function$;

CREATE TABLE IF NOT EXISTS public.gathering_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gathering_id uuid NOT NULL REFERENCES public.gatherings(id) ON DELETE CASCADE,
  rater_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ratee_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  score smallint NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS gathering_ratings_unique
  ON public.gathering_ratings (gathering_id, rater_id, coalesce(ratee_id, '00000000-0000-0000-0000-000000000000'::uuid));

GRANT SELECT, INSERT ON public.gathering_ratings TO authenticated;
GRANT ALL ON public.gathering_ratings TO service_role;

ALTER TABLE public.gathering_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Raters read own ratings" ON public.gathering_ratings;
CREATE POLICY "Raters read own ratings"
ON public.gathering_ratings FOR SELECT TO authenticated
USING (rater_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Checked-in attendees rate" ON public.gathering_ratings;
CREATE POLICY "Checked-in attendees rate"
ON public.gathering_ratings FOR INSERT TO authenticated
WITH CHECK (
  rater_id = auth.uid()
  AND (ratee_id IS NULL OR ratee_id <> auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.gathering_attendees a
    WHERE a.gathering_id = gathering_ratings.gathering_id
      AND a.user_id = auth.uid()
      AND a.checked_in_at IS NOT NULL
  )
  AND (
    ratee_id IS NULL OR EXISTS (
      SELECT 1 FROM public.gathering_attendees a2
      WHERE a2.gathering_id = gathering_ratings.gathering_id
        AND a2.user_id = gathering_ratings.ratee_id
    ) OR EXISTS (
      SELECT 1 FROM public.gatherings g
      WHERE g.id = gathering_ratings.gathering_id AND g.host_id = gathering_ratings.ratee_id
    )
  )
);