# Enforce gathering seat capacity at the database level

Today a join is a bare insert into `gathering_attendees`. Nothing checks the gathering's `seats` against the current attendee count, so a full table can keep taking people, and two people tapping "Join" on the last seat both succeed.

## Point 4 first — double-join is already covered

Confirmed against the live database: `gathering_attendees` has `PRIMARY KEY (gathering_id, user_id)`. A user cannot be inserted twice for the same gathering — the second insert fails with Postgres error `23505`. No new constraint needed. The only gap is that the current UI surfaces the raw Postgres message for that case, so it will get a friendly message as part of this work.

## 1. The database guard

A `CHECK` constraint can't do this (it can't count rows in another table) and switching transactions to `SERIALIZABLE` would need every caller to retry. The correct tool is a `BEFORE INSERT` trigger on `gathering_attendees` that takes a row lock on the parent gathering:

```sql
CREATE OR REPLACE FUNCTION public.enforce_gathering_capacity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _seats int; _status gathering_status; _taken int;
BEGIN
  -- locks the gathering row: concurrent joins to the same gathering serialize here
  SELECT seats, status INTO _seats, _status
  FROM public.gatherings WHERE id = NEW.gathering_id FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'GATHERING_MISSING'; END IF;
  IF _status IN ('cancelled','rejected') THEN RAISE EXCEPTION 'GATHERING_CLOSED'; END IF;

  SELECT count(*) INTO _taken
  FROM public.gathering_attendees WHERE gathering_id = NEW.gathering_id;

  IF _taken >= _seats THEN
    RAISE EXCEPTION 'GATHERING_FULL: % of % seats taken', _taken, _seats;
  END IF;
  RETURN NEW;
END; $$;
```

Why `SELECT ... FOR UPDATE` on the parent row: the second concurrent transaction blocks until the first commits, then re-reads the count and correctly sees the seat gone. A plain count without the lock lets both transactions read "7 of 8" and both insert. This mirrors the locking style already used by the existing `venue_tables` / double-booking triggers in this project, so it stays consistent.

The trigger fires only on INSERT — leaves and deletes are unaffected.

## 2. Surfacing a clear error

The trigger raises sentinel-prefixed messages (`GATHERING_FULL:`, `GATHERING_CLOSED:`), the same pattern already used by `TABLE_LOCKED` / `TABLE_CAPACITY_LOCKED` in the venue dashboard. Call sites match on the prefix and show a translated toast instead of the raw message:

- `src/routes/gatherings.$id.tsx` — `join()` currently does `toast.error(error.message)`. Maps `GATHERING_FULL` → "This table just filled up", `GATHERING_CLOSED` → "This gathering is no longer open", and `23505` → "You've already joined this gathering". On a full-table error it also invalidates the gathering query so the seat count refreshes immediately.
- `src/lib/gatherings.ts` — `joinGathering()` gets a small error classifier (e.g. throws a typed `JoinError` with `reason: 'full' | 'closed' | 'already_joined' | 'other'`) so any future caller gets the same mapping for free. `leaveGathering()` is unchanged.
- `src/lib/mcp/tools/join-gathering.ts` — returns the same friendly text instead of the raw Postgres string (its description already promises "Fails if the gathering is full or already joined").

New i18n keys in `src/i18n/translations.ts` for EN, TR and FA: `gd.joinFull`, `gd.joinClosed`, `gd.joinAlready`.

## 3. Leaving and cancelled gatherings

Nothing extra is required for seats to free up: capacity is computed live as `count(*)` at insert time, so a delete from `gathering_attendees` immediately reopens the seat for the next joiner. There is no denormalised counter to drift out of sync — that is deliberate, and the reason for counting rather than caching.

Cancelled/rejected gatherings are handled inside the same trigger (the `GATHERING_CLOSED` branch), which closes a related hole: today someone can still join a cancelled gathering.

## Out of scope

No changes to the leave flow, waitlists, RLS policies, or the join button's visibility logic. The client-side "full" display stays as-is; the trigger is the authority.

## Technical summary

- One migration: `enforce_gathering_capacity()` function + `BEFORE INSERT` trigger on `public.gathering_attendees`. No schema/column changes, no new grants (no new table).
- Concurrency safety comes from `SELECT ... FOR UPDATE` on the parent `gatherings` row, not from a check constraint or isolation-level change.
- Double-join already blocked by the existing composite primary key; only its error message changes.
- Files touched: `src/lib/gatherings.ts`, `src/routes/gatherings.$id.tsx`, `src/lib/mcp/tools/join-gathering.ts`, `src/i18n/translations.ts`.
