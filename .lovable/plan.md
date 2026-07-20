## Goal
Replace the free-text venue picker in create-gathering with a grouped dropdown: approved partner venues + the user's own approved saved locations, plus an inline "add new location" flow that reuses `LocationAutocomplete`. Add owner CRUD in profile and an admin approval queue mirroring the venue queue.

## 1. Migration — new `saved_locations` table

```sql
CREATE TABLE public.saved_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  address text NOT NULL,
  city text,
  neighborhood text,
  lat numeric,
  lng numeric,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reject_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_locations TO authenticated;
GRANT ALL ON public.saved_locations TO service_role;

ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;

-- Owner: read/insert/update/delete own rows
CREATE POLICY "own_select" ON public.saved_locations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON public.saved_locations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "own_update" ON public.saved_locations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_delete" ON public.saved_locations FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Admin: read + update status on all
CREATE POLICY "admin_select" ON public.saved_locations FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admin_update" ON public.saved_locations FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

-- Owner cannot self-approve — mirror businesses pattern
CREATE OR REPLACE FUNCTION public.prevent_saved_location_status_change_by_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, private AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NOT private.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can change saved location status';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_saved_locations_status_guard
  BEFORE UPDATE ON public.saved_locations
  FOR EACH ROW EXECUTE FUNCTION public.prevent_saved_location_status_change_by_owner();

CREATE TRIGGER trg_saved_locations_updated
  BEFORE UPDATE ON public.saved_locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

## 2. Code changes

**`src/routes/_authenticated/create-gathering.tsx`**
- Fetch approved partner venues (existing RPC) AND `saved_locations` where `user_id = me AND status = 'approved'` in parallel.
- Replace `business_id`/`table_id` Selects with a single grouped `Select`:
  - Group "Partner venues": one item per (business, table) pair, value = `venue:<bizId>:<tableId>`.
  - Group "Your saved locations": value = `saved:<savedId>`.
  - Trailing item "+ Add new location" (value = `__add`) opens a Dialog containing `LocationAutocomplete` + a `label` input; on save inserts into `saved_locations` (status pending) and shows a toast "Awaiting admin approval — you can pick it here once approved." Invalidates the saved-locations query.
- Insert into `gatherings`:
  - Partner selection → keep current shape (business_id, table_id, venue_name, neighborhood from biz).
  - Saved-location selection → business_id = null, table_id = null, venue_name = saved.label, neighborhood = saved.neighborhood ?? saved.city ?? '', plus address/city/lat/lng from the saved row (columns already exist).
- Drop the "no venues" empty state gate — a user with saved locations can still host.
- Zod schema updated: `location: z.string()` discriminated by prefix.

**`src/routes/_authenticated/profile.tsx`**
- New "My saved locations" section under the profile form:
  - List rows with label, address, status badge (pending/approved/rejected + reject_reason if any).
  - Inline rename (label only), delete button with confirm.
  - "Add location" button opens the same Dialog as create-gathering (extract to `src/components/saved-location-dialog.tsx` for reuse).

**`src/routes/_authenticated/admin.tsx`**
- Add third top-level section "Saved locations" (or a tab within existing Cafés/Venues area — mirroring the existing venue approval queue exactly): pending list, detail pane, approve/reject with reason (reuses `RejectReasonDialog`). On approve/reject: update `saved_locations.status` (+ `reject_reason`) and emit a notification to the owner via existing `admin.functions.ts` helper — extend it with `notifySavedLocationDecision`.

**`src/lib/admin.functions.ts`**
- Add `listSavedLocations`, `setSavedLocationStatus({ id, status, reason })` server fns using `requireSupabaseAuth` + admin role check (same shape as existing gathering fns).

**`src/components/saved-location-dialog.tsx`** (new, shared)
- Wraps `LocationAutocomplete` + label input + submit.

**`src/i18n/translations.ts`**
- Add EN/TR/FA keys: `create.locationGroup.partners`, `create.locationGroup.saved`, `create.addLocation`, `create.locationPending`, `profile.savedLocations.*`, `admin.savedLocations.*`.

## 3. Risks / notes
- `LocationAutocomplete` currently hardcodes `countryCodes="tr"`. For IR users this returns nothing — pass user's `profile.country` (lowercased) as the prop, fall back to `undefined` (worldwide) if unknown. Small extra read in the dialog.
- Nullable `business_id`/`table_id` already allowed by schema; existing views (`explore`, `gathering-card`, `gatherings.$id`) already handle the null case per user's confirmation.
- The pending→approved flow means a freshly-added saved location won't appear in the dropdown until an admin acts. Toast text must make that explicit; also surface it in profile.
- No changes to gathering RLS needed (host_id + verified email + origin/status only).
- Reusing `RejectReasonDialog` and notification pattern keeps admin UX consistent.

## Out of scope (per user)
gathering-card, gatherings.$id, explore, businesses, venue_tables — untouched.