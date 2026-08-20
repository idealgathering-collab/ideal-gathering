# Check-in / attendance v1

Scope: record who actually showed up, host-marked, manual roster. No ratings, no reviews, no scoring loop.

## Verified current state

- `gathering_attendees(gathering_id, user_id, joined_at)` — join record only, nothing about attendance.
- RLS today: SELECT is `user_id = auth.uid()` OR the caller is the gathering host OR the owner of the linked business; UPDATE exists only for admins; INSERT is self-join on approved gatherings; DELETE is self-leave or admin.
- `src/routes/gatherings.$id.tsx` renders attendees as a bare count; identities are only visible in the chat room (`gathering-room.tsx`).

## 1. Schema

Column on the existing table, not a new one. The relationship is 1:1 with a seat, the row already exists at join time, and a separate table would duplicate the composite key for one nullable timestamp.

```sql
alter table public.gathering_attendees
  add column checked_in_at timestamptz,
  add column checked_in_by uuid references auth.users(id) on delete set null;
```

`checked_in_at` timestamptz (not boolean): free, and later tells Phase 2 *when* someone arrived, not just whether. `NULL` = not checked in. `checked_in_by` records which host/admin marked it — cheap audit, and it distinguishes a host mark from any future self-check-in without a schema change.

Index: `create index on public.gathering_attendees (user_id) where checked_in_at is not null;` — the shape any future per-user reliability aggregate will read.

## 2. Who can write it, and the RLS

Host-only in v1, plus admin (already covered by the existing admin UPDATE policy).

On venue owners: they already have SELECT on attendees of gatherings at their business, so extending write is technically clean — but a venue owner is not reliably at the table, and for `origin='user_created'` gatherings at saved locations there is no venue owner at all. Marking attendance is a claim about who was physically present; giving it to a party who may not be present makes the signal weaker for Phase 2. Host-only.

New policy:

```sql
create policy "Hosts mark attendance"
on public.gathering_attendees for update to authenticated
using (exists (select 1 from public.gatherings g
  where g.id = gathering_attendees.gathering_id and g.host_id = auth.uid()))
with check (exists (select 1 from public.gatherings g
  where g.id = gathering_attendees.gathering_id and g.host_id = auth.uid()));
```

UPDATE alone can't restrict *which* columns change, so a BEFORE UPDATE trigger pins everything else — a host must not be able to rewrite `user_id`/`gathering_id`/`joined_at`, and must not check in for a gathering that is cancelled or rejected:

```sql
create or replace function public.guard_attendance_update() returns trigger
language plpgsql security definer set search_path = public, private as $$
declare _status gathering_status; _starts timestamptz;
begin
  if private.has_role(auth.uid(), 'admin') then return new; end if;
  if new.user_id is distinct from old.user_id
     or new.gathering_id is distinct from old.gathering_id
     or new.joined_at is distinct from old.joined_at then
    raise exception 'ATTENDANCE_IMMUTABLE_FIELDS';
  end if;
  select status, starts_at into _status, _starts
    from public.gatherings where id = new.gathering_id;
  if _status in ('cancelled','rejected') then raise exception 'GATHERING_CLOSED'; end if;
  if new.checked_in_at is not null and now() < _starts - interval '30 minutes' then
    raise exception 'CHECKIN_TOO_EARLY';
  end if;
  if now() > coalesce((select ends_at from public.gatherings where id = new.gathering_id),
                      _starts + interval '2 hours') + interval '24 hours' then
    raise exception 'CHECKIN_WINDOW_CLOSED';
  end if;
  new.checked_in_by := case when new.checked_in_at is null then null else auth.uid() end;
  return new;
end $$;
```

Server-set `checked_in_by` so the client can't spoof it. Follows the existing `prevent_*_change` trigger pattern already in this schema.

## 3. Time gating — decision

Gated, but loosely: opens 30 minutes before `starts_at`, closes 24 hours after the gathering ends.

Tradeoff: an ungated column is simpler and never blocks a legitimate host, but it lets attendance be marked weeks early or retro-edited long after, which makes the record useless as evidence for Phase 2. A window that opens slightly early covers hosts who mark people as they arrive, and a 24-hour tail covers the host who forgets until the next morning. The cost is a host who remembers two days later can no longer fix it — acceptable at this stage, and admins can still edit through the existing admin policy.

## 4. UI

New `src/components/attendance-roster.tsx`, rendered on `src/routes/gatherings.$id.tsx` for the host only, inside the existing member area near the chat/checklist section, and only once the check-in window is open (`now >= starts_at - 30m`). Before that the card is absent; after the window closes it renders read-only.

- Loads the roster via a new `listAttendance` server function in `src/lib/attendance.functions.ts` (auth middleware, host-or-admin check, joins display names through the existing `getPublicProfiles` path).
- One row per attendee: avatar, display name, and a tap target that toggles checked / not checked. Optimistic toggle, `toast.error` + revert on failure, mapping the trigger exceptions to localized messages the way `classifyJoinError` already does for joins.
- Header line: "3 of 6 checked in".
- No QR, no self check-in, no geofence.

Also:
- `src/routes/_authenticated/my-gatherings.tsx`: for past gatherings the host hosted, a quiet "X of Y attended" line. Purely informational.
- `src/routes/_authenticated/admin.tsx`: the same attended count on the gathering rows the admin panel already lists, so moderation has the context.

Nothing is shown to the attendee about their own check-in state in v1 — no notification, no badge. It's a host/admin record until Phase 2 decides what it means.

## 5. What it powers

Nothing automated. Purely a record plus a count. The schema is Phase-2-ready: timestamps per attendee per gathering, so a later reliability pass can compute attended/joined ratios and no-show recency without a migration.

## Files touched

- migration: two columns, index, `guard_attendance_update` trigger + function, host UPDATE policy.
- new: `src/lib/attendance.functions.ts`, `src/components/attendance-roster.tsx`.
- edit: `src/routes/gatherings.$id.tsx`, `src/routes/_authenticated/my-gatherings.tsx`, `src/routes/_authenticated/admin.tsx`, `src/i18n/translations.ts` (EN/TR/FA).

## Flagged decisions

1. Column on `gathering_attendees`, not a new table.
2. Host-only writes; venue owners excluded despite having read access.
3. Check-in window: −30 min to +24 h after end; admins can override.
4. Attendees see nothing about their own attendance record in v1.
