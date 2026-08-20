# Block + Report v1

Scope: a `user_blocks` table, a `reports` table, block/report actions where users actually see each other, an admin report queue, and a block-aware `getTableFit`. No chat redesign, no friends system, no auto-seating.

## What's visible today (verified)

- `src/routes/gatherings.$id.tsx` shows attendees only as a **count** (`{attendees.length} / {g.seats}`) — no names, no avatars.
- `src/components/gathering-room.tsx` (chat) is the **only** place one user sees another's identity: each message renders `display_name` + sender id, resolved via `getPublicProfiles`.
- So v1 surfaces block/report on the **chat message author**, plus a report action on the **gathering detail page** (report the gathering/host).

## 1. `user_blocks`

```sql
create table public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint no_self_block check (blocker_id <> blocked_id)
);
grant select, insert, delete on public.user_blocks to authenticated;
grant all on public.user_blocks to service_role;
alter table public.user_blocks enable row level security;
```

Policies (all `to authenticated`, all keyed on `blocker_id = auth.uid()`):
- select / insert (with check) / delete — own rows only. No update policy.

This is the critical privacy property: a blocked user can run any query they like and never learn a block row exists. Enforcement that needs *both* directions runs server-side with the admin client, never in the browser.

Helper for server use:

```sql
create or replace function private.is_blocked_pair(_a uuid, _b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_blocks
    where (blocker_id = _a and blocked_id = _b) or (blocker_id = _b and blocked_id = _a))
$$;
```

### What blocking does in v1

- **Mutual hiding in chat is in scope.** Filtering only one direction produces a broken conversation (the blocker's messages still land on the blocked user and get replies nobody sees). Both sides stop seeing each other's messages going forward and historically in the rendered list.
- Implementation: chat message filtering moves behind a server function `listGatheringMessages` (admin client + `requireSupabaseAuth`) that drops messages whose sender is in a block pair with the caller. The realtime `INSERT` subscription stays, but new messages are dropped client-side against a `blockedIds` set fetched once per room (own blocks) and a server-provided `hiddenSenderIds` set for reverse blocks.
- Not in scope for v1: preventing a blocked user from *joining* the same gathering, or unseating anyone. Blocking hides, it does not evict. Called out so it isn't mistaken for enforcement.
- Unblock: from Profile → a small "Blocked people" list (own blocks only, names via `getPublicProfiles`).

## 2. `reports`

Existing approval queues (`businesses.status`, `saved_locations.status` + `reject_reason`) are single-table status columns reviewed in `admin.tsx`. Reports follow the same shape rather than inventing a new pattern.

On polymorphism: keep `target_type` + `target_id` **and** a separate nullable `target_user_id`. Reason: for a gathering report the person accountable is the host, and the admin queue and any future block/suspend action needs a user handle without re-resolving the gathering. A pure polymorphic `target_id` would force the queue to join two different tables to answer "who is this about".

```sql
create type public.report_target as enum ('user','gathering');
create type public.report_status as enum ('open','resolved','dismissed');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type report_target not null,
  target_id uuid not null,
  target_user_id uuid references auth.users(id) on delete set null,
  gathering_id uuid references public.gatherings(id) on delete set null,
  reason text not null,          -- enum-ish slug: harassment | spam | unsafe | noshow | other
  details text,
  status report_status not null default 'open',
  admin_note text,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint no_self_report check (reporter_id <> target_user_id)
);
grant select, insert on public.reports to authenticated;
grant all on public.reports to service_role;
alter table public.reports enable row level security;
```

Policies:
- `select`: `reporter_id = auth.uid()` OR `private.has_role(auth.uid(),'admin')`. The reported person has no policy path to their own reports — they cannot see they were reported.
- `insert` (with check): `reporter_id = auth.uid()` and status forced to `'open'` (a BEFORE INSERT trigger clamps `status`, `admin_note`, `resolved_*` so a reporter can't self-resolve).
- `update`: admin only.
- no delete policy.
- Trigger `prevent_report_status_change_non_admin`, mirroring the existing `prevent_gathering_status_change_non_admin`.
- Index `(status, created_at desc)` for the queue; partial unique index on `(reporter_id, target_type, target_id) where status = 'open'` to stop duplicate spam.

**No notification is ever created for the reported or blocked user** — the existing `notifications` writes are all explicit in app code, so this just means not adding one.

## 3. `getTableFit` change (in scope now)

In `src/lib/matching.functions.ts`, after resolving `otherIds`, load the caller's block pairs with the admin client:

```
select blocker_id, blocked_id from user_blocks
where blocker_id = userId or blocked_id = userId
```

Build a `blockedWith: Set<string>`, then:
- exclude those ids from the trait average for every gathering, and
- if any member of a gathering is in `blockedWith`, return `fit: null` for that gathering entirely (with a new `hasBlocked: true` flag) so the card shows no compatibility number rather than a silently skewed one.

`src/components/table-fit.tsx` renders nothing (or a neutral dash) when `fit === null`.

## 4. UI surfaces

- **`src/components/gathering-room.tsx`**: each non-own message gets an overflow menu (`DropdownMenu`, kebab on hover/focus) with "Block" and "Report". Block opens a confirm dialog; Report opens a shared `ReportDialog`.
- **`src/routes/gatherings.$id.tsx`**: a quiet "Report this gathering" link in the footer of the detail card, prefilled `target_type: 'gathering'`, `target_user_id = host_id`.
- **`src/components/report-dialog.tsx`** (new): reason radio group + optional details textarea, 500-char cap. On success a neutral toast ("Thanks — our team will review this"), no state visible to anyone else.
- **`src/routes/_authenticated/profile.tsx`**: "Blocked people" section, list + Unblock.
- **`src/routes/_authenticated/admin.tsx`**: new `ReportsPanel` tab following `SavedLocationsPanel` exactly — `Tabs` for open / resolved / dismissed, each row showing reporter, target (linked to the gathering or the reported profile), reason, details, timestamp, and Resolve / Dismiss buttons with an optional `admin_note`.

## Files touched

- migration: two enums, `user_blocks`, `reports`, grants, RLS, trigger, `private.is_blocked_pair`, indexes.
- new: `src/lib/moderation.functions.ts` (block, unblock, listBlocks, submitReport, listGatheringMessages), `src/components/report-dialog.tsx`, `src/components/blocked-users-section.tsx`.
- edit: `gathering-room.tsx`, `gatherings.$id.tsx`, `matching.functions.ts`, `table-fit.tsx`, `_authenticated/admin.tsx`, `_authenticated/profile.tsx`, `src/i18n/translations.ts` (EN/TR/FA).

## Flagged decisions

1. Mutual chat hiding is included in v1 — one-directional hiding leaves a visibly broken conversation.
2. Blocking does not prevent joining the same gathering or evict anyone in v1.
3. `target_user_id` is stored alongside `target_type`/`target_id` deliberately, so the admin queue always has a person to act on.
