
# Ideal Gathering — Roles, Venue Portal, Admin Approval & Gathering Room

Big, foundational change. I recommend shipping it in 4 sequential phases (see §7). Below is the full breakdown you asked for.

---

## 1. Schema & RLS changes

### 1.1 Roles

- Add `'venue'` to the `public.app_role` enum (currently `user`, `admin`).
- `user_roles` stays the source of truth. A single auth user has EXACTLY ONE of `user` or `venue` (enforced by a partial unique index or a CHECK-via-trigger). `admin` is additive on top of `user` only.
- New helper (in `private` schema, matching existing pattern):
  - `private.is_venue(uid)` — has role `venue`.
  - `private.is_user(uid)` — has role `user`.
  - `private.has_role(...)` already exists — keep.
- Update `handle_new_user()` trigger: it currently hard-codes `user`. Change to read `raw_user_meta_data->>'account_type'` (`'user'` or `'venue'`) set from the signup form, default `'user'`. Venue signups skip inserting a `profiles` row OR insert a minimal one — we'll insert a profile row for both (so `display_name` works everywhere), but grant `venue` role instead of `user`.
- Backfill: existing accounts stay `user`. `idealgathering@gmail.com` already has `user + admin` — good, no change.

### 1.2 `businesses`

Add:
- `phone text NOT NULL` (telephone)
- `mobile text NOT NULL` (mobile)
- Rename semantics: reuse existing `cover_url` as the required **profile picture** path (stored in `avatars` bucket, same as user avatars). Drop the separate "cover" concept for venues in UI. Column stays; we just repurpose + make it `NOT NULL` after backfill.
- `menu_link text NULL` (optional external menu URL)
- `description NOT NULL` (currently nullable — backfill `''` then set NOT NULL)
- `address`, `city`, `lat`, `lng` → make `NOT NULL` after backfill
- `status` already exists (`pending`/`approved`/`rejected`) — keep.

**RLS rewrites on `businesses`**:
- INSERT: only if `private.is_venue(auth.uid())` AND `owner_id = auth.uid()` AND no existing business for this owner (1 business per venue account — simplest; can relax later).
- UPDATE: owner may update ALL fields EXCEPT `status` (existing `prevent_business_status_change_by_owner` trigger already enforces this) — keep working whether `status` is pending or approved.
- SELECT public: only where `status = 'approved'` (existing).
- SELECT own: owner sees own row regardless of status (existing).
- Admin: full read/write via `has_role(admin)`.

### 1.3 `venue_tables`

- No column changes.
- RLS INSERT/UPDATE/DELETE: only if caller owns the parent business AND is `venue` role. Editable while business is pending (per spec).

### 1.4 `gatherings`

Add:
- `origin text NOT NULL DEFAULT 'user_proposed'` with CHECK IN (`'user_proposed'`, `'venue_activated'`) — lets us tell the two flows apart cleanly for policies + UI.
- `ends_at timestamptz NULL` — optional, needed for the "no overlapping active gathering per table" rule (fall back to `starts_at + 2h` if null).
- Make `business_id` and `table_id` NOT NULL for `origin = 'venue_activated'` (partial CHECK).
- Existing `venue_name`, `neighborhood`, `address`, `city`, `lat`, `lng` become required for `user_proposed`, ignored for `venue_activated` (they inherit from business).

**Status flow**:
- `user_proposed` → inserted as `status='proposed'`, only ADMIN can flip to `approved`/`rejected`.
- `venue_activated` → inserted as `status='approved'` directly, only allowed if `origin='venue_activated'` AND caller is venue owner of `business_id` AND business.status='approved'.

**RLS**:
- INSERT (user_proposed): role=`user` AND `is_email_verified()` AND `host_id=auth.uid()` AND `origin='user_proposed'` AND `status='proposed'`.
- INSERT (venue_activated): role=`venue` AND owns `business_id` AND business is approved AND `status='approved'` AND `origin='venue_activated'` AND `table_id` belongs to that business AND no overlapping active gathering on that table (enforced via BEFORE INSERT trigger raising exception; overlap = `tsrange(starts_at, coalesce(ends_at, starts_at+2h))` intersects an existing approved/proposed row's range for same `table_id`).
- UPDATE status: only `has_role(admin)` (removes existing venue-owner approve path).
- SELECT public: `status='approved'` (existing) — unchanged.

### 1.5 `gathering_attendees`

- INSERT: role=`user` (already email-verified) AND gathering is `status='approved'`. Prevents venues joining as attendees; matches spec.
- Everything else unchanged.

### 1.6 New: `gathering_messages` (chat)

```
id uuid pk, gathering_id uuid fk, sender_id uuid, body text, created_at timestamptz
```
- RLS SELECT/INSERT: caller is host OR in `gathering_attendees` for that gathering. INSERT also requires `sender_id = auth.uid()`.
- Enable Realtime on this table (`ALTER PUBLICATION supabase_realtime ADD TABLE ...`).
- GRANTs: `authenticated` SELECT/INSERT; no anon.

### 1.7 New: `gathering_checklist_items`

```
id uuid pk, gathering_id uuid fk, label text, sort_order int, created_at timestamptz
```
- RLS INSERT/UPDATE/DELETE: only gathering host.
- SELECT: host + attendees.

**Recommendation on check-state**: **per-user**, via a separate join table `gathering_checklist_checks (item_id, user_id, checked_at)`. Reason: items like "bring a book" or "arrive 10 min early" are personal actions, not shared todos. Simpler RLS too (`user_id = auth.uid()`). Flag if you'd rather have shared.

### 1.8 `profiles`

- Add `country text NULL` (dropdown-backed).
- Keep `city text` — becomes dropdown-backed on the client, no schema change.
- Drop `cover_url` from user profiles UI (still used on businesses; keep column for now to avoid data loss, hide from user profile page).

### 1.9 Data hygiene / backfill risks

- **Existing gatherings** created via the current free-text create-gathering flow have no `business_id`/`table_id` and were never really approvable. Mark them all `origin='user_proposed'`, leave them alone. Admin queue will show them; admin can reject/clean up.
- **Existing businesses** created before venue role existed: their owners currently have `user` role. Migration will need to detect any owner of a `businesses` row and grant them `venue` role too (or ask you: do we wipe existing test businesses? Likely yes since data is beta).
- **Required new fields** on businesses (`phone`, `mobile`, `description`, address bits): backfill with placeholder strings then set NOT NULL, OR wipe existing beta businesses. Recommend **wipe** — simpler.
- **1 business per venue** constraint: if any owner has >1 today, keep first, delete rest.

---

## 2. Routes / files — modified vs. new

### New files

- `src/routes/venue/auth.tsx` — venue signup/login (mirrors `/auth`, signs up with `account_type: 'venue'` metadata; no Google — email/password only for cleanliness).
- `src/routes/_venue/route.tsx` — pathless layout gate, redirects non-venue users out. Uses `ssr:false` like `_authenticated`.
- `src/routes/_venue/dashboard.tsx` — venue home: business profile summary, tables list w/ Activate buttons, menu builder link, menu_link field.
- `src/routes/_venue/business.tsx` — edit business profile (fields listed in §5).
- `src/routes/_venue/tables.tsx` — table CRUD (moved out of `businesses.$id.tsx`).
- `src/routes/_venue/activate.$tableId.tsx` — the Activate form (subject + optional starts_at/ends_at) → inserts venue_activated gathering.
- `src/routes/_authenticated/admin/businesses.tsx` — pending/approved businesses queue (replaces current inline tab).
- `src/routes/_authenticated/admin/gatherings.tsx` — NEW global pending user-proposed gatherings queue.
- `src/routes/_authenticated/admin/users.$id.edit.tsx` — admin edits any profile.
- `src/routes/_authenticated/admin/businesses.$id.edit.tsx` — admin edits any business.
- `src/components/venue-bottom-nav.tsx` and `src/components/user-bottom-nav.tsx` — role-scoped bottom navs.
- `src/components/country-select.tsx`, `src/components/city-select.tsx` — static dropdowns (start with Turkey + major cities; extendable JSON).
- `src/components/gathering-room/` — `chat.tsx`, `checklist.tsx`, `info.tsx`, tab shell.
- `src/lib/gathering-messages.functions.ts`, `src/lib/gathering-checklist.functions.ts` — server functions (chat send if we want moderation; otherwise direct Supabase client + Realtime).
- `src/lib/admin.functions.ts` — extend with `listPendingBusinesses`, `listPendingGatherings`, `setBusinessStatus`, `setGatheringStatus`, `adminUpdateProfile`, `adminUpdateBusiness`.

### Modified files

- `src/routes/auth.tsx` — clarify it's the USER door; add link "Are you a venue? → /venue/auth"; signup metadata `account_type: 'user'`.
- `src/routes/_authenticated/register-business.tsx` — **delete** (moved into venue portal as `/venue/business` shown on first venue login when no business exists yet).
- `src/routes/_authenticated/businesses.$id.tsx` — strip approve/decline UI, strip table CRUD (moved to venue portal). Becomes a public read-only business detail page for approved venues (shows tables' active gatherings, menu, menu_link).
- `src/routes/_authenticated/create-gathering.tsx` — reshape into "propose a gathering at an existing venue". Instead of free-text venue, use a venue picker (search approved businesses) → then table picker → subject/date. Sets `origin='user_proposed'`, `status='proposed'`.
- `src/routes/_authenticated/dashboard.tsx` — becomes the USER dashboard shell with bottom nav (Explore / Host / Profile / Logout). Existing venue-related widgets removed.
- `src/routes/_authenticated/admin.tsx` — restructured tabs: Businesses / Gatherings / Users (each links into the new admin subroutes above).
- `src/routes/_authenticated/profile.tsx` — add country + city dropdowns; remove cover photo upload UI.
- `src/routes/_authenticated/route.tsx` — after auth check, branch on role: venue → redirect to `/venue/dashboard` unless URL already starts with `/venue`; user → allow app routes. Admin routes gate additionally on `admin` role.
- `src/routes/gatherings.$id.tsx` — add Gathering Room tabs (Info / Chat / Checklist) shown only when `isAttending || isHost`; Checklist tab hidden if `items.length === 0`.
- `src/routes/explore.tsx` — filter to `status='approved'` (already) + surface both origin types.
- `src/i18n/translations.ts` — many new keys (venue portal, activate flow, admin queues, chat, checklist, country/city labels).
- `src/lib/mcp/tools/*` — audit `my-businesses`/`join-gathering` for new role gates.

### Deleted / obsolete

- Approve/decline block inside `businesses.$id.tsx`.
- Any UI implying a normal user can register a business from the user dashboard.

---

## 3. Flows recap

**User signup** → `/auth` → role `user` → redirected to `/dashboard` (Explore).
**Venue signup** → `/venue/auth` → role `venue` → redirected to `/venue/business` (must complete registration; status `pending`) → then `/venue/dashboard`. Can edit while pending; Activate button disabled with tooltip "Waiting for admin approval".
**Admin** → `/admin` → 3 tabs: Businesses pending, Gatherings pending, Users. Can edit any of them.
**User proposes gathering** → `/create-gathering` → picks approved venue + table → status `proposed` → appears in admin gatherings queue → admin approves → visible in Explore.
**Venue activates table** → `/venue/dashboard` → per-table Activate → auto-approved → visible in Explore. Overlap trigger blocks double-booking.
**Gathering Room** → attendee opens `/gatherings/:id` → sees Info always; Chat if joined; Checklist if joined AND host added items.

---

## 4. Risks, ambiguities, sequencing

### Risks
- **Existing beta data**: mix of orphan free-text gatherings + businesses without required new fields. Cleanest path is a wipe of both tables in the first migration (data is pre-launch). Please confirm — otherwise I'll write backfills with placeholder values.
- **Google OAuth on venue door**: today `/auth` uses Google. If a Gmail user signs up via `/venue/auth` with Google, we can't reliably set `account_type` metadata on first sign-in. Recommend: **venue signup is email/password only**; venues can add Google later. Flag if you want Google on both doors.
- **1-business-per-venue** constraint is a simplification. If a chain owner needs multiple locations later, we lift the unique constraint and add a business picker.
- **Chat moderation**: no profanity filter, no rate limit in v1. Admin can delete messages via admin tools (add later if needed).
- **Realtime on `gathering_messages`** requires enabling the publication + a signed-in supabase client subscription. Straightforward but new surface area.
- **`admin` role users also have `user` role** — they'll see the user bottom nav. That's fine and matches your spec.
- **Overlap trigger** needs care with time zones + null `ends_at`. Will use a default 2h window; happy to make it configurable per venue.

### Ambiguities to confirm before build
1. Wipe existing beta gatherings + businesses? (Strong recommend yes.)
2. Venue signup — email/password only, or also Google? (Recommend email/password only.)
3. Checklist check-state — per-user (recommended) or shared?
4. 1 business per venue account for now? (Recommend yes.)
5. Country/city dropdown source — start with Turkey + top ~15 cities hard-coded, extend later?
6. Default venue-activated gathering duration when `ends_at` omitted — 2 hours OK?

### Recommended sequencing (4 PRs, in order)

1. **Roles + venue auth door + RLS rewrite + data wipe/backfill** (foundational; unlocks everything). Ship with a temporary "venue portal coming" placeholder page.
2. **Venue portal**: dashboard, business form (with new required fields + profile pic upload), tables, menu link, Activate flow + overlap trigger. Remove approve/decline from `businesses.$id.tsx`.
3. **Admin queues**: businesses pending, gatherings pending, edit-any-profile, edit-any-business. Restructure `/admin`.
4. **Gathering Room** (chat + checklist tables, realtime, tabs on gathering detail) + profile country/city dropdowns.

Doing Gathering Room before account separation would be risky — its RLS depends on the cleaned-up attendee/host model, and shipping chat on top of the current shared-login world would need to be redone.

Waiting on your answers to the 6 questions in §4 before I open the first migration.
