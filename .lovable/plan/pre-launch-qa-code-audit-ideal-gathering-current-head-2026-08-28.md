# Pre-launch QA / Code Audit — Ideal Gathering (current HEAD)

No files were modified. Findings below come from running the real diagnostics plus reading the code and querying the live database.

## Diagnostics run

| Check | Result |
| --- | --- |
| TypeScript (`tsgo --noEmit`) | Clean, 0 errors |
| Unit tests (`vitest run`) | 154/154 passing, 13 files |
| ESLint | 0 blocking rule failures; ~230 Prettier formatting errors, 27 `no-explicit-any`, 8 `no-case-declarations`, 2 `exhaustive-deps` |
| Security scan | 1 warn-level finding (`profiles_no_public_select_policy`) — *under*-provisioned, not a leak |
| DB check | RLS enabled on all 17 public tables; grants present; policies reviewed |

Nothing is currently broken at compile time. All the real problems are runtime/logic level.

---

## CRITICAL

### C1 — Viewing another person's profile always fails (`/people/$id`)
**Confirmed.** `src/lib/guest-profile.functions.ts:57-70` (`loadGuestProfile`) queries `profiles` with the **browser** Supabase client. Live RLS on `profiles` has exactly three policies: `Users manage own profile` (`auth.uid() = id`), `Admins read all profiles`, `Admins update any profile`. There is **no policy letting one authenticated user read another user's profile row**, so `loadGuestProfile(someoneElse)` returns `null` for every non-admin.

Consequence: `src/routes/_authenticated/people.$id.tsx:36-50` renders the "profile not found" / empty state for all real users. Also mitigating today: no `<Link to="/people/$id">` exists anywhere in `src/` (only in `routeTree.gen.ts`), so the route is currently **unreachable dead code** — but the moment anyone links attendees to their profiles (the obvious next step, and the reason the route exists), it ships broken.

Verify: sign in as user A, hit `/people/<user-B-uuid>` → empty/not-found. As admin → works.

Fix direction: move the read behind a `createServerFn` that returns only a public projection (display name, avatar, city, persona, interests — **not** `date_of_birth`, which the current query selects), or add a narrow `TO authenticated` SELECT policy plus column-level grants.

### C2 — Feedback "what didn't work" reasons are still discarded
**Confirmed, and this is a regression** — it was reported fixed previously but is not fixed at HEAD. `src/lib/feedback.functions.ts:142-148`: the per-person insert rows are built as `{ gathering_id, rater_id, ratee_id, score, comment: null }`. `p.reasons` — validated on line 126 and sent by `src/components/feedback-prompt.tsx` — is never written.

Downstream, `src/lib/matching.functions.ts:126-152` reads `reasons`, runs `parseReasons` → `avoidBandsFromHistory` → `avoidEnergy` into `scoreTables`. Because the column is always the `'{}'` default, the entire learned-avoidance feature is inert: the app keeps recommending the table type the user just said they disliked.

Verify: rate a tablemate ≤3 with a reason chip, then `select reasons from gathering_ratings where ratee_id = ...` → `{}`.

---

## HIGH

### H1 — Onboarding ↔ dashboard redirect loop on a silent write failure
**Confirmed code path, not live-reproduced.** `src/routes/_authenticated/onboarding.tsx:84` awaits the `profiles.update({ onboarded_at })` but **never checks `error` or rows affected**, then navigates to `/dashboard` on line 85. `src/routes/_authenticated/dashboard.tsx:31-39` unconditionally redirects back to `/onboarding` whenever `onboarded_at` is falsy. Any failed/0-row update (missing profile row from a signup-trigger race, transient error) traps the user in an infinite bounce with no error message.

Verify: temporarily deny the update (or delete the user's `profiles` row) and finish onboarding.

### H2 — Mobile tab bar leaks onto admin, venue and onboarding surfaces
**Confirmed.** `src/components/mobile-tab-bar.tsx:16` hides only on `/`, `/auth*`, `/venue/auth*`. Missing: `/admin`, `/admin/auth`, `/venue/dashboard`, `/onboarding`. `__root.tsx:161-164` renders it on every other route.

Worst case: a venue-role user on `/venue/dashboard` (mobile) taps "Explore" → `_authenticated/route.tsx:21-23` immediately redirects them back to `/venue/dashboard`. A visible navigate-and-bounce on every tap.

Verify: sign in as a venue account, narrow viewport, `/venue/dashboard`, tap any bottom tab.

### H3 — `calculateUserMatch` adds a phantom +10 when no ages are known
**Confirmed.** `src/lib/user-match.ts:88-121`: `ageFactor` defaults to `1`, but `score += (ageScore - 50) * 0.2` and `totalWeight += 0.2` run **outside** the `if (hasAgeData)` guard. Two users with no date of birth get `ageScore = 100` → a flat `+10` treated as a *known* signal, which also distorts the `50 + (score - 50) / totalWeight` renormalization (`totalWeight` can never drop below 0.2).

Note this is specific to `user-match.ts`; the server-side `src/lib/table-fit.ts` handles missing age correctly as a neutral multiplier, so the two surfaces disagree.

Verify: `calculateUserMatch(a, b)` with both `dateOfBirth: null` and no traits — expect 50, get ~60.

### H4 — Realtime notifications never fire
**Confirmed via DB.** `src/components/notifications-bell.tsx:31-45` subscribes to `postgres_changes` on `public.notifications`, but `notifications` is **not a member of the `supabase_realtime` publication** (only `gathering_messages` is). The bell therefore only ever shows what it fetched on mount; new notifications appear only after a full page load.

Verify: `select tablename from pg_publication_tables where pubname='supabase_realtime'` → `gathering_messages` only.

---

## MEDIUM

### M1 — Duplicate join is reported as "gathering full"
**Confirmed by trigger logic.** `enforce_gathering_capacity` (migration `20260820201345_*.sql:16-21`) counts `gathering_attendees` for the gathering **without excluding the inserting user**, and fires `BEFORE INSERT` — i.e. before the unique constraint. At exact capacity, an already-joined attendee who re-submits gets `GATHERING_FULL` instead of the `23505` that `src/lib/join-errors.ts:14-18` maps to "already joined". Messaging bug only; no data corruption.

### M2 — Host "Attendance" tab never disappears
**Confirmed.** `src/routes/gatherings.$id.tsx:142` gates the tab on `opensAt` only, ignoring `closesAt` and `g.status`. Server-side `src/lib/attendance.functions.ts:85-90` correctly blocks marking, so this is cosmetic — but the tab persists forever on long-past gatherings.

### M3 — `/admin` has no route-level guard
**Confirmed.** `src/routes/_authenticated/admin.tsx:22-25` has no `beforeLoad` role check; authorization runs in a `useEffect` after mount. Not a data leak (child fetches gate on `allowed`, and the subtree is `ssr: false`), but it breaks the app's own `beforeLoad` pattern and flashes the admin title/shell to non-admins.

### M4 — Seats are never validated against the pinned table's capacity
**Confirmed gap.** `src/routes/_authenticated/create-gathering.tsx` loads `tableCapacity` per venue option but never compares it to `form.seats` before insert; `create-gathering-rules.ts:8-15` only bounds seats 2–30 globally, and the capacity trigger checks `gatherings.seats`, not `venue_tables.capacity`. A host can book 12 seats at a 4-seat table. Confirm whether this is intentional overbooking tolerance.

### M5 — No service worker; PWA is manifest-only
**Confirmed.** `public/manifest.webmanifest` is linked from `__root.tsx:114`, but there is no SW registration anywhere in `src/` or `public/` — no offline cache, no install reliability beyond the browser's minimal heuristic. The manifest also has no `purpose: "maskable"` icon, so Android home-screen icons will be badly cropped.

### M6 — Venue signup races role assignment
**Potential risk.** `src/routes/venue.auth.tsx:61-91` signs up then navigates straight to `/venue/dashboard`, which queries `user_roles` at `venue.dashboard.tsx:65-77` and bounces to `/` with a "not a venue" toast if the row isn't there yet. If the `venue` role is granted by an async trigger on `user_metadata.account_type`, a legitimate new venue owner can be rejected immediately after registering. Needs a retry/settle step or a post-signup wait.

### M7 — Chat block filter has a first-mount race
**Potential risk.** `src/components/gathering-room.tsx:98-124`: the realtime subscription closes over `hidden`, which is an empty set until `loadMessages()` resolves. A message from a blocked user arriving in that window is rendered until the effect resubscribes. Narrow window, but it's a moderation gap. `profiles` is also read inside the handler without being in the dep array.

---

## LOW

- **L1** — `src/routes/_authenticated/people.$id.tsx:13` destructures `params` in `head()` but never uses it: every profile page has the same generic title. Same file hardcodes `bg-gray-900 / text-white / bg-white/10` (13 occurrences; 7 more in `guest-profile-card.tsx`), bypassing the design tokens.
- **L2** — Missing `head()` entirely on `venue.dashboard.tsx`, `_authenticated/dashboard.tsx`, `_authenticated/onboarding.tsx`, `_authenticated/create-gathering.tsx`, `_authenticated/businesses.$id.tsx`.
- **L3** — Dead code: `fromOnboarding` in `dashboard.tsx:40` (nothing ever navigates with `?onboarded=1`, and the value is never read); `isFutureStart` / `parseLocationKey` in `create-gathering-rules.ts:19-46` are unit-tested but unused — the route reimplements both inline, so the tests cover logic that doesn't ship.
- **L4** — `dashboard.tsx:25-30` re-runs `fetchRoles` and the admin redirect that the parent `_authenticated/route.tsx:24-28` already performed: an unreachable branch plus a duplicate round-trip on every dashboard load.
- **L5** — `src/lib/roles.ts:26` accepts any `redirect` starting with a single `/`; backslash variants (`/\evil.com`) normalize to protocol-relative in some browsers. `auth.tsx:87` passes the raw `redirect` into `emailRedirectTo` with no validation (Supabase's allowlist is the only backstop).
- **L6** — `admin.functions.ts:234-241` updates a gathering status without confirming the row exists; a bad id returns `{ ok: true }` having changed nothing.
- **L7** — `venue.dashboard.tsx:254-256` mints cover-image signed URLs with a 10-year expiry — unrevocable if a venue is later rejected or banned.
- **L8** — `gathering-room.tsx:284` fetches *all* of the user's checklist checks across every gathering (no `gathering_id` scope). Harmless today (UUID item ids), a cost/perf drag over time.
- **L9** — Lint hygiene: ~230 Prettier violations across `venue.dashboard.tsx`, `venue.auth.tsx`, `terms.tsx` and others; 27 `any` in `admin.functions.ts` / `business.functions.ts` / `notifications.ts`; `no-control-regex` in `recommend.ts:134`.
- **L10** — `anon` holds `INSERT/UPDATE/DELETE` (no SELECT) on `profiles`, `businesses`, `gathering_attendees`, and full CRUD on several others. RLS blocks all of it today, so this is defence-in-depth only — worth tightening before launch.

---

## Confirmed vs. potential

**Confirmed by code + DB inspection:** C1, C2, H2, H3, H4, M1, M2, M3, M4, M5, L1–L4, L6–L10.
**Traced statically, not reproduced live:** H1, M6, M7, L5.

## Suggested fix order

1. C2 (data loss, one-line insert fix) → C1 (server-side public profile projection).
2. H1, H4, H3, H2.
3. M1–M3, M6, M7.
4. Low-severity cleanup and lint pass.

Say the word and I'll turn any slice of this into an implementation plan.
