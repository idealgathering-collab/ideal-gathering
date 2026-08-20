alter table public.gathering_attendees
  add column if not exists checked_in_at timestamptz,
  add column if not exists checked_in_by uuid references auth.users(id) on delete set null;

create index if not exists gathering_attendees_checked_in_user_idx
  on public.gathering_attendees (user_id) where checked_in_at is not null;

create policy "Hosts mark attendance"
on public.gathering_attendees for update to authenticated
using (exists (select 1 from public.gatherings g
  where g.id = gathering_attendees.gathering_id and g.host_id = auth.uid()))
with check (exists (select 1 from public.gatherings g
  where g.id = gathering_attendees.gathering_id and g.host_id = auth.uid()));

create or replace function public.guard_attendance_update() returns trigger
language plpgsql security definer set search_path = public, private as $$
declare _status gathering_status; _starts timestamptz; _ends timestamptz;
begin
  if private.has_role(auth.uid(), 'admin'::app_role) then return new; end if;
  if new.user_id is distinct from old.user_id
     or new.gathering_id is distinct from old.gathering_id
     or new.joined_at is distinct from old.joined_at then
    raise exception 'ATTENDANCE_IMMUTABLE_FIELDS';
  end if;
  select status, starts_at, ends_at into _status, _starts, _ends
    from public.gatherings where id = new.gathering_id;
  if _status in ('cancelled','rejected') then raise exception 'GATHERING_CLOSED'; end if;
  if new.checked_in_at is not null and now() < _starts - interval '30 minutes' then
    raise exception 'CHECKIN_TOO_EARLY';
  end if;
  if now() > coalesce(_ends, _starts + interval '2 hours') + interval '24 hours' then
    raise exception 'CHECKIN_WINDOW_CLOSED';
  end if;
  new.checked_in_by := case when new.checked_in_at is null then null else auth.uid() end;
  return new;
end $$;

revoke all on function public.guard_attendance_update() from public, anon, authenticated;

drop trigger if exists gathering_attendees_attendance_guard on public.gathering_attendees;
create trigger gathering_attendees_attendance_guard
before update on public.gathering_attendees
for each row execute function public.guard_attendance_update();