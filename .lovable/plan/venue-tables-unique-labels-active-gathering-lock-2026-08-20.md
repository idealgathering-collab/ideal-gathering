# Venue tables: unique labels + active-gathering lock

Scoped to `TablesSection` in `src/routes/venue.dashboard.tsx` plus one DB migration. Nothing else in the tables or business flow changes.

## What changes for the venue owner

1. Adding a table whose label already exists at that venue (ignoring letter case, e.g. "a" vs "A") is refused with a clear message, both in the form and at the database level.
2. A table cannot be deleted, and its capacity cannot be lowered below a booked gathering's seat count, while an upcoming, non-cancelled gathering is sitting at that table. The refusal names the specific gathering(s) — subject and start time — that hold the lock. Once those gatherings pass or are cancelled, the table frees up again.

## Verified current state

- `venue_tables` has no unique index on `(business_id, label)` — only the primary key and an index on `business_id`.
- No duplicate labels exist today, so the unique index can be added without cleanup.
- `gatherings.table_id` is `ON DELETE CASCADE`, so deleting a table today silently deletes its gatherings. This is the main hole to close.
- Owner writes go through the RLS policy "Owner manages own tables" (client `supabase.from("venue_tables")` calls), so enforcement must live in the database, not in a server function the owner can bypass.

## Technical plan

### Migration

```sql
-- 1) Case-insensitive unique label per business
CREATE UNIQUE INDEX venue_tables_business_label_ci_uidx
  ON public.venue_tables (business_id, lower(label));

-- 2) Lock tables that are held by an upcoming, non-cancelled gathering
CREATE OR REPLACE FUNCTION public.prevent_locked_table_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _table_id uuid := COALESCE(OLD.id, NEW.id);
  _blockers text;
  _min_seats int;
BEGIN
  SELECT string_agg(g.subject || ' (' || to_char(g.starts_at, 'YYYY-MM-DD HH24:MI') || ' UTC)', ', '),
         max(g.seats)
    INTO _blockers, _min_seats
  FROM public.gatherings g
  WHERE g.table_id = _table_id
    AND g.status <> 'cancelled'
    AND g.status <> 'rejected'
    AND COALESCE(g.ends_at, g.starts_at + interval '2 hours') > now();

  IF _blockers IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'TABLE_LOCKED: %', _blockers;
  END IF;

  IF NEW.capacity < _min_seats THEN
    RAISE EXCEPTION 'TABLE_CAPACITY_LOCKED: % | %', _min_seats, _blockers;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER venue_tables_locked_guard
  BEFORE UPDATE OR DELETE ON public.venue_tables
  FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_table_change();
```

No new tables, so no new GRANTs are needed.

### Why a trigger (not RLS, not a server function)

- RLS `USING` clauses can't produce a message explaining *which* gathering blocks the delete — the row just silently doesn't match and the delete reports 0 rows.
- A guarded server function would be bypassable: the owner already has direct `DELETE`/`UPDATE` rights on their own rows through the existing RLS policy.
- A `BEFORE DELETE/UPDATE` trigger runs no matter how the write arrives (client SDK, raw REST, admin key), and can raise a message carrying the blocker details. It also fires ahead of the `ON DELETE CASCADE` that would otherwise wipe the gatherings.

### Client changes in `TablesSection` (`src/routes/venue.dashboard.tsx`)

- `add()`: before inserting, compare the trimmed label case-insensitively against `business.venue_tables`; if it matches, `toast.error` the duplicate message and return without hitting the network. Keep the insert, and additionally map a returned Postgres `23505` / `venue_tables_business_label_ci_uidx` error to the same friendly duplicate message (covers the race where two tabs add at once).
- `remove()`: parse the error message from the delete. On `TABLE_LOCKED: <list>` show a toast naming the gatherings, e.g. "Can't delete Table 3 — it's booked for: Coffee & code (2026-08-24 18:00 UTC)". Any other error keeps the current raw-message toast.
- Capacity edits: `TablesSection` has no capacity-edit control today, so the `TABLE_CAPACITY_LOCKED` branch is enforced server-side only; if the capacity field is surfaced later it will already be guarded. (Say the word if you want an inline capacity editor added here too.)
- New i18n keys in `src/i18n/translations.ts` (en/tr/fa): `biz.duplicateLabel`, `biz.tableLocked`, `biz.tableCapacityLocked`.
