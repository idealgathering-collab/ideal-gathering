
# Ideal Gathering — Roles, Venue Portal, Admin Approval & Gathering Room

**Status update:** Phase 1 (schema + RLS foundation) already shipped in the previous turn — see §7. This plan is unchanged; approving it continues into Phase 2.

---

## 1. Schema & RLS changes

### 1.1 Roles ✅ (Phase 1, shipped)
- `venue` value added to `public.app_role` enum (was: `user`, `admin`).
- `user_roles` unique partial index enforces EXACTLY ONE of `user` or `venue` per auth user. `admin` is additive on top of `user` only.
- Helpers in `private` schema: `is_venue(uid)`, `is_user(uid)`, existing `has_role(...)`.
- `handle_new_user()` trigger reads `raw_user_meta_data->>'account_type'` (`'user'` | `'venue'`, default `'user'`) and grants the matching role.
- `idealgathering@gmail.com` keeps `user + admin`.

### 1.2 `businesses` ✅ (Phase 1)
- New required cols: `phone`, `mobile`. `description`, `address`, `city`, `lat`, `lng`, `cover_url` (repurposed as profile picture) all NOT NULL.
- New optional col: `menu_link`.
- Unique index `businesses_one_per_owner_idx` → 1 business per venue account.
- RLS INSERT rewritten: `owner_id=auth.uid()` AND `status='pending'` AND `private.is_venue(auth.uid())`.
- UPDATE stays owner-scoped; existing status-lock trigger keeps venue from self-approving.
- SELECT: public sees `status='approved'`; owner sees own; admin sees all.

### 1.3 `venue_tables` ✅ (Phase 1)
- RLS INSERT/UPDATE/DELETE require venue role AND ownership of parent business. Editable while business is pending.

### 1.4 `gatherings` ✅ (Phase 1)
- New: `origin` (`'user_proposed'` | `'venue_activated'`), `ends_at`.
- CHECK: venue-activated must have `business_id + table_id`.
- Overlap trigger `prevent_table_double_booking` (2h default duration).
- Status-change trigger → only admins can flip status.
- RLS:
  - INSERT user_proposed: user role, email verified, `status='proposed'`.
  - INSERT venue_activated: venue role, owns business (approved), table belongs to business, `status='approved'`.
  - UPDATE/DELETE by host allowed on own row (status blocked by trigger).

### 1.5 `gathering_attendees` ✅ (Phase 1)
- INSERT: user role AND email verified AND target gathering is approved. (Prevents venue accounts joining.)

### 1.6 `gathering_messages` ✅ (Phase 1)
- Columns: `id`, `gathering_id`, `sender_id`, `body` (1–2000 chars), `created_at`.
- RLS: SELECT/INSERT restricted to host + attendees; sender must be self; delete by sender or admin.
- Added to `supabase_realtime` publication.

### 1.7 `gathering_checklist_items` + `gathering_checklist_checks` ✅ (Phase 1)
- Items: host manages; host+attendees read.
- Checks: per-user (recommended in original plan and applied) — `(item_id, user_id)` primary key.

### 1.8 `profiles` ✅ (Phase 1)
- Added `country text NULL`.
- `city text` stays — front end will move it to a static dropdown in Phase 4.

### 1.9 Data hygiene ✅ (Phase 1)
- Truncated beta `gatherings`, `gathering_attendees`, `businesses`, `venue_tables`, `menu_items` — cleanest possible baseline.

---

## 2. Routes / files — modified vs. new (Phases 2–4)

### Phase 2 — Venue portal (NEXT)

**New files**
- `src/routes/venue/auth.tsx` — venue signup/login (email/password only; sets `account_type: 'venue'` metadata).
- `src/routes/_venue/route.tsx` — pathless layout gate; `ssr:false`; redirects non-venues out. Mirrors `_authenticated/route.tsx`.
- `src/routes/_venue/dashboard.tsx` — venue home: business summary card, tables list w/ per-table Activate button (disabled while `status!='approved'` with tooltip), links to business edit / menu builder.
- `src/routes/_venue/business.tsx` — create OR edit business (single form, upsert-style). Fields per §5. Redirects here on first login when no business exists.
- `src/routes/_venue/tables.tsx` — table CRUD (moved out of `businesses.$id.tsx`).
- `src/routes/_venue/menu.tsx` — structured menu builder (moved from `businesses.$id.tsx`) + optional `menu_link` field.
- `src/routes/_venue/activate.$tableId.tsx` — the Activate form (subject + optional starts_at/ends_at) → inserts venue_activated gathering.
- `src/components/venue-bottom-nav.tsx` — bottom nav: Dashboard / Business / Menu / Logout.
- `src/components/user-bottom-nav.tsx` — bottom nav: Explore / Host / Profile / Logout.

**Modified files**
- `src/routes/auth.tsx` — signup passes `account_type: 'user'`; add small "Are you a venue? →" link.
- `src/routes/_authenticated/register-business.tsx` — already stubbed as redirect in Phase 1 hotfix; DELETE in Phase 2.
- `src/routes/_authenticated/businesses.$id.tsx` — strip approve/decline & table CRUD & menu builder; becomes public read-only detail for approved venues (shows active gatherings per table, structured menu, menu_link).
- `src/routes/_authenticated/create-gathering.tsx` — reshape into "propose a gathering at an existing venue": pick approved business → pick table → subject/date → `origin='user_proposed'`, `status='proposed'`.
- `src/routes/_authenticated/dashboard.tsx` — becomes USER dashboard; adds user bottom nav; removes venue widgets.
- `src/routes/_authenticated/route.tsx` — after auth, branch on role: venue outside `/venue/*` → redirect to `/venue/dashboard`.
- `src/i18n/translations.ts` — many new keys for venue portal + activate flow (EN + TR).

### Phase 3 — Admin queues & edits

**New files**
- `src/routes/_authenticated/admin/businesses.tsx` — pending/approved queue.
- `src/routes/_authenticated/admin/gatherings.tsx` — global pending user-proposed queue.
- `src/routes/_authenticated/admin/users.$id.edit.tsx` — edit any profile.
- `src/routes/_authenticated/admin/businesses.$id.edit.tsx` — edit any business.

**Modified files**
- `src/lib/admin.functions.ts` — add `listPendingBusinesses`, `listPendingGatherings`, `setBusinessStatus`, `setGatheringStatus`, `adminUpdateProfile`, `adminUpdateBusiness`.
- `src/routes/_authenticated/admin.tsx` — restructure to 3 tabs: Businesses / Gatherings / Users.

### Phase 4 — Gathering Room + profile dropdowns

**New files**
- `src/components/gathering-room/tabs.tsx`, `chat.tsx`, `checklist.tsx`, `info.tsx`.
- `src/lib/countries.ts`, `src/lib/cities.ts` — static lists (start with Turkey + top ~15 cities).
- `src/components/country-select.tsx`, `src/components/city-select.tsx`.

**Modified files**
- `src/routes/gatherings.$id.tsx` — Info always; Chat when `isAttending || isHost`; Checklist same gate AND `items.length > 0`. Realtime subscription for chat.
- `src/routes/_authenticated/profile.tsx` — swap city textbox → CitySelect; add CountrySelect; drop cover photo UI.
- `src/i18n/translations.ts` — chat / checklist / country / city keys.

### Deleted
- Approve/decline block inside `businesses.$id.tsx` (Phase 2).
- `register-business.tsx` (Phase 2).

---

## 3. Flows recap
- **User signup** → `/auth` → role `user` → `/dashboard` (Explore).
- **Venue signup** → `/venue/auth` → role `venue` → `/venue/business` (must complete registration; status `pending`) → `/venue/dashboard`. Editable while pending; Activate disabled with tooltip.
- **Admin** → `/admin` → 3 tabs (Businesses / Gatherings / Users), edits any of them.
- **User proposes gathering** → `/create-gathering` → pick approved venue+table → status `proposed` → admin queue → approve → visible in Explore.
- **Venue activates table** → per-table Activate → auto-approved, overlap trigger blocks double-booking.
- **Gathering Room** → attendee opens `/gatherings/:id` → Info always; Chat + Checklist (if items exist) after joining.

---

## 4. Risks, ambiguities, sequencing

### Risks
- **Google OAuth on venue door**: hard to reliably tag first Google sign-in as `account_type: 'venue'`. **Recommend: email/password only for venue door** (applied). Users on `/auth` still get Google.
- **1-business-per-venue** simplification — lift later for chains.
- **Chat moderation**: no profanity filter/rate limit v1; sender & admin can delete.
- **Realtime**: `gathering_messages` in publication; browser subscribes via `supabase.channel`.
- **Overlap trigger** uses 2h default when `ends_at` is null.
- **Admin users also have `user` role** — they see the user bottom nav (matches spec). Admin dashboard is reached via a link.

### Ambiguities (applied defaults from prior approval)
1. Wipe beta data — YES (done).
2. Venue signup — email/password only.
3. Checklist check-state — per-user.
4. 1 business per venue for now.
5. Country/city dropdown — Turkey + top ~15 cities hard-coded, extendable JSON.
6. Default duration on venue-activated — 2 hours.

### Sequencing (4 PRs)
1. ✅ Roles + venue auth door + RLS rewrite + data wipe (SHIPPED).
2. Venue portal (dashboard, business form, tables, menu link, Activate flow) + strip approve/decline from `businesses.$id.tsx` + reshape create-gathering.
3. Admin queues (businesses, gatherings, edit-any-profile/business).
4. Gathering Room (chat + checklist tabs, realtime) + profile country/city dropdowns.

Approving this plan continues with **Phase 2 (venue portal)** next. Gathering Room stays last because its RLS depends on the finalized attendee/host model already in place.
