## Saved locations for hosting

Replace the free-text venue picker in create-gathering with a grouped dropdown of approved partner venues and the user's own approved saved locations, with admin review for new user-submitted locations.

### 1. Database migration — `public.saved_locations`

Columns: `id`, `user_id (uuid → auth.users)`, `label (text)`, `address (text)`, `city (text null)`, `neighborhood (text null)`, `lat (numeric null)`, `lng (numeric null)`, `status (text default 'pending' check in pending/approved/rejected)`, `reject_reason (text null)`, `created_at`, `updated_at`.

Same status pattern as `businesses` (text + check, not a new enum, to stay consistent with the existing pattern).

GRANTs: `authenticated` (select/insert/update/delete), `service_role` (all). No `anon`.

RLS policies:
- Owner select / delete: `auth.uid() = user_id`.
- Owner insert: `auth.uid() = user_id AND status = 'pending'` (users can only create pending rows).
- Owner update: `auth.uid() = user_id` — plus a `BEFORE UPDATE` trigger that raises if the owner tries to change `status` (only admins may). Mirrors the pattern used for `businesses` and `gatherings`.
- Admin select / update: `private.has_role(auth.uid(), 'admin')`.

`updated_at` trigger reuses the existing `public.update_updated_at_column()`.

### 2. Create-gathering form — grouped dropdown

`src/routes/_authenticated/create-gathering.tsx`:
- Remove the existing two selects (business + table) and free-text location field.
- One `<Select>` whose option value encodes the source: `venue:<bizId>:<tableId>` or `saved:<savedLocId>`, plus a trailing `__add` sentinel.
- Two `<SelectGroup>`s labeled "Partner venues" and "Your saved locations".
- Selecting `__add` opens a shared dialog (see §5) instead of setting form state.
- Submit reads the prefix:
  - `venue:*` → insert with `business_id`, `table_id`, `venue_name = biz.name`, `neighborhood = biz.city` (unchanged behavior).
  - `saved:*` → insert with `business_id=null`, `table_id=null`, `venue_name = saved.label`, `neighborhood = saved.neighborhood || saved.city`, plus `address / city / lat / lng` copied through.
- Two parallel queries via TanStack Query: existing `list_approved_businesses` RPC + `saved_locations` for the current user filtered to `status='approved'`.

### 3. Profile — "My saved locations" section

New component `src/components/saved-locations-section.tsx` rendered in `src/routes/_authenticated/profile.tsx` above the danger zone:
- Lists the user's saved locations with a status badge (pending / approved / rejected) and, if rejected, the `reject_reason`.
- Inline rename (updates `label`) and delete (with AlertDialog confirm).
- "Add location" button opens the shared dialog from §5.

### 4. Admin — Saved locations queue

`src/routes/_authenticated/admin.tsx`: new `TabsTrigger value="locations"` between Gatherings and Users, and a new `SavedLocationsAdminSection` component:
- Inner tabs Pending / Approved / Rejected (mirrors the venues section).
- Reads directly from `saved_locations` under the admin RLS policy.
- Owner display name fetched via existing `get_public_profiles` RPC.
- Approve is one click; Reject opens a Dialog requiring a reason (mirrors existing venue reject flow), then updates `status` + `reject_reason` and sends a notification.

### 5. Shared dialog — `SavedLocationDialog`

New `src/components/saved-location-dialog.tsx`, reused by both the create-gathering "+ Add" flow and the profile section. Wraps the existing `LocationAutocomplete` component (no rebuild); collects `label` + picked address; inserts a `pending` row; toasts and closes.

### 6. Notifications

Extend `NotificationType` in `src/lib/notifications.ts` with `saved_location_approved` and `saved_location_rejected`. Admin approve/reject calls `insertNotification` so the user sees the outcome in the bell.

### 7. i18n

Add EN/TR/FA keys for the new UI: dropdown labels, "+ Add new location", empty states, dialog copy, profile section, admin tab + reject dialog, and the two notification titles/bodies. Also add `common.cancel / save / delete` if not already present.

### Files touched

- New: `supabase/migrations/*_saved_locations.sql`
- New: `src/components/saved-location-dialog.tsx`
- New: `src/components/saved-locations-section.tsx`
- Edit: `src/routes/_authenticated/create-gathering.tsx`
- Edit: `src/routes/_authenticated/profile.tsx` (import + render new section)
- Edit: `src/routes/_authenticated/admin.tsx` (new tab + section component)
- Edit: `src/lib/notifications.ts` (extend union)
- Edit: `src/i18n/translations.ts` (EN/TR/FA keys)

### Risks / notes

- `gatherings.venue_name` and `neighborhood` are NOT NULL — the `saved:*` branch must always populate them (falling back to `label` and `city` respectively).
- The status-change trigger must be `SECURITY DEFINER` with `search_path` locked, and `EXECUTE` revoked from `PUBLIC/anon/authenticated`, to stay consistent with the current security-memory guidance for trigger-only definer functions.
- Owners must not be able to flip their own row to `approved` — enforced by the trigger, not the RLS `WITH CHECK` alone (RLS can't compare OLD vs NEW).
- No changes to `gatherings` schema, RLS, `gathering-card.tsx`, `gatherings.$id.tsx`, or `explore.tsx`.
