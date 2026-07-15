## Beta gathering loop

Ship the create → explore → join flow with venue as a free-text field. No new tables; no loosening of existing RLS.

### 1. Schema migration (single migration)

- Add to `public.gatherings`:
  - `venue_name TEXT NOT NULL DEFAULT ''` then drop default
  - `neighborhood TEXT NOT NULL DEFAULT ''` then drop default
  - Make `business_id UUID NULL` and `table_id UUID NULL` (there is no venue portal yet, so gatherings must be creatable without one). Existing business-linked policies keep working via `business_id IS NOT NULL` checks.
- Extend enum: `ALTER TYPE public.gathering_status ADD VALUE IF NOT EXISTS 'rejected';`
- Add admin policies on `public.gatherings`:
  - `SELECT` using `private.has_role(auth.uid(), 'admin')`
  - `UPDATE` using / with check `private.has_role(auth.uid(), 'admin')`
- Verify (no change expected): `gathering_attendees` INSERT policy still requires `private.is_email_verified(auth.uid())`.

### 2. Data layer (`src/lib/gatherings.ts`)

- Extend `GatheringCard` with `venue_name: string` and `neighborhood: string`; keep `business` optional (null when free-text venue).
- Update `fetchApprovedGatherings` and `fetchGathering` selects to include `venue_name, neighborhood`.
- Add `joinGathering(id)` / `leaveGathering(id)` helpers wrapping the existing supabase calls (currently inline in the detail route).

### 3. Create Event — `src/routes/_authenticated/create-gathering.tsx`

Replace the venue/table selects with free-text fields:

- Fields: `subject`, `description`, `venue_name` (required), `neighborhood` (required, free text — no dropdown), `starts_at`, `seats`.
- Zod schema updated; insert sets `business_id: null`, `table_id: null`, `status: 'proposed'`.
- Drop the "auto-approve if owner" branch (no venue link).
- Keep the verified-email gate and existing `VerifyEmailBanner`.

### 4. Explore — new route `src/routes/explore.tsx`

- Public route. Uses `fetchApprovedGatherings` (already filters status='approved' and future events).
- Renders header + grid of `GatheringCard`. Empty state falls back to a "Be the first to propose" CTA.

### 5. Gathering card — `src/components/gathering-card.tsx`

- Show `venue_name` + `neighborhood` in the location line when `business` is null; keep existing business rendering as fallback.
- Table chip renders only when `g.table` exists; otherwise show the neighborhood chip.

### 6. Detail page — `src/routes/gatherings.$id.tsx`

- Location card shows `venue_name` (title) and `neighborhood` (subtitle) when there is no business; keep business display path as-is.
- Hide table chip and "Manage venue" button when `business` is null.
- "Join" button already exists — wire it through the new `joinGathering()` helper and rely on RLS (verified email + auth) for enforcement. Same for leave.

### 7. Home — `src/routes/index.tsx`

- Hero CTAs become: primary **Sign Up** → `/auth?mode=signup`; secondary **Explore Gatherings** → `/explore` (replaces "Join Waitlist" and "Register your cafe" in the hero only).
- Keep the existing waitlist Link CTA in the bottom "JOIN CTA" section so the waitlist stays available lower on the page.

### 8. i18n — `src/i18n/translations.ts`

Add EN + TR keys used above:

- `home.hero.signup`, `home.hero.explore`
- `explore.title`, `explore.subtitle`, `explore.empty`
- `create.venueName`, `create.venueNamePh`, `create.neighborhood`, `create.neighborhoodPh`
- `gd.venue` (reused where `biz.venue` currently is, if needed)

All new strings consumed via `useT()`.

### Out of scope

- No admin approval UI (policy only — hosts still see "waiting approval").
- No business/cafe portal changes; no changes to `businesses`, `venue_tables`, `menu_items`.
- No changes to attendee RLS or the waitlist table.

### Technical notes

- The `business_id`/`table_id` nullability change is required because the current `NOT NULL` constraints would block every free-text gathering insert — this is the minimum schema loosening to make the free-text venue work, and every existing RLS policy that references those columns already tolerates NULL via its `EXISTS` sub-selects.
- The admin policies are additive `PERMISSIVE` policies; existing host/owner policies remain untouched.
