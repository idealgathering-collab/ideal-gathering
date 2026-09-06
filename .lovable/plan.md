# Private-beta audit — read-only report (no files changed)

## Health checks

| Check | Result |
| --- | --- |
| TypeScript (`tsgo --noEmit`) | Clean, 0 errors |
| Unit tests | 161/161 passing, 14 files |
| Page loads | `/` `/waitlist` `/invite` `/pending` `/preview` `/explore` `/dashboard` all 200; `/auth` 307 → `/auth?mode=signin` (expected default-search redirect) |
| Browser console | No errors captured |

`/waitlist` is confirmed a real route (`src/routes/waitlist.tsx`) and is linked correctly from the hero, `/invite`, `/preview`, the demo and quiz sections.

---

## HIGH

### H-A — Many CTAs still send people into open signup, which now always rejects them
`/auth?mode=signup` requires a valid invitation (`src/routes/auth.tsx:90-96`): with no code it toasts "need invite" and bounces to `/invite`. These links still promise signup:

- `src/components/site-header.tsx:186` ("Join")
- `src/components/landing/public-header.tsx:118` and `:166`
- `src/components/landing/sections.tsx:509`
- `src/components/landing/table-demo.tsx:156`
- `src/components/landing/matching-quiz.tsx:415`
- `src/routes/our-story.tsx:92`
- `src/routes/waitlist.tsx:220` ("already have an account? sign up")
- `src/routes/gatherings.$id.tsx:76` (join flow for signed-out visitors)

Public pages that still show these: `/our-story`, `/partnership`, `/explore`, `/gatherings/$id`, `/waitlist`, `/preview`. Every one is a dead end during beta. Fix direction: point at `/waitlist` (or `/invite`), matching the hero.

### H-B — `/explore` and `/gatherings/$id` are outside the gate
The access check lives only in `src/routes/_authenticated/route.tsx` and `venue.dashboard.tsx`. `/explore` and `/gatherings/$id` are top-level public routes, so a signed-out visitor — or a waitlisted/`/pending` account — can still browse the full gathering catalogue during the closed beta. Writes are blocked by RLS, so this is exposure, not a data-integrity problem, but it contradicts "no product access before launch". Decide whether these stay public (SEO) or move behind the gate.

---

## MEDIUM

### M-A — Mobile tab bar shows on the pending/beta screens
`src/components/mobile-tab-bar.tsx:18-23` hides only `/`, `/auth*`, `/admin*`, `/venue*`, `/onboarding*`. A signed-in but not-yet-approved user sitting on `/pending` (or `/invite`, `/waitlist`, `/preview`) sees the five product tabs; tapping any of them bounces straight back to `/pending`.

### M-B — Venue dashboard gate is client-side only
`src/routes/venue.dashboard.tsx:69-88` does the role check in a `useEffect` after mount (no `beforeLoad`), so the venue shell flashes before redirect. Access state itself is queried correctly (`hasVenueAccess`), and the tools are hidden pre-launch, so this is cosmetic/pattern inconsistency, not a leak.

---

## LOW

- `/preview` is reachable but linked from nowhere in the app — intentional per your instruction, just noting it is orphaned (and `noindex`).
- `src/routes/invite.tsx:122` offers "sign in" but no path back to `/waitlist` from the failure state other than line 117 — fine, just noting the flow.
- Landing hero only exposes `mode: "signin"` for `/auth`, which is correct; no other pre-launch entry point bypasses the invite check.

---

## Gate coverage (verified)

| Route | Covered by | Signed-out behaviour |
| --- | --- | --- |
| `/dashboard`, `/explore` (auth features), `/my-gatherings`, `/chat`, `/profile`, `/settings`, `/create-gathering`, `/people/$id`, `/businesses/$id` | `_authenticated/route.tsx` beforeLoad → `fetchAccessState`, `/pending` redirect | redirect to `/auth?redirect=…&mode=signin` |
| `/onboarding` | same gate, explicitly exempted from the `/pending` bounce | redirect to `/auth` |
| `/admin` | same gate, admin bypass | redirect to `/admin/auth` |
| `/venue/dashboard` | own role check + `hasVenueAccess` | redirect to `/venue/auth` |

`homePathForUser` (`src/lib/roles.ts:22-29`) routes correctly: admin → `/admin`, venue → `/venue/dashboard`, no product access → `/pending` (or `/onboarding` if not yet onboarded). No blank pages observed; `_authenticated` is `ssr: false`, so the redirect happens client-side after a brief spinner.

---

## Regressions from earlier audit — all still fixed

- **C1 profile RLS** — `people/$id` → `loadProfileCard` → `loadPublicProfile` server function (`src/lib/public-profile.functions.ts`), safe projection with birth date coarsened to year. Intact.
- **C2 `gathering_ratings.reasons`** — persisted via `parseReasons` at `src/lib/feedback.functions.ts:151`. Intact.
- **H1 onboarding loop** — `src/routes/_authenticated/onboarding.tsx:99-108` now checks the update result and refuses to navigate on failure. Intact.
- **H4 realtime notifications** — `notifications` added to `supabase_realtime` in migration `20260828010926_*.sql`. Intact.

---

## Suggested fix order (when you want it)

1. H-A — repoint the eight signup CTAs (pure link change).
2. H-B — decide the public/gated status of `/explore` and `/gatherings/$id`.
3. M-A, M-B.
