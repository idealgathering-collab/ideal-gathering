# Make the matching quiz real (Phase 1)

Today the quiz scores four traits (spark / curiosity / warmth / depth) but the result never
leaves the browser's local storage, and the "table mates" shown next to a result are hardcoded
initials. Phase 1 stores the real result on the user's profile and turns the fake placeholder
into a real, informational "your fit with this table" number. It never blocks anyone from
joining.

## What changes for a user

1. Finish the quiz while signed in → the result is saved to their account. Retaking overwrites it.
2. Signed in and haven't taken it → a dismissible prompt on Explore and on a gathering page
   invites them to take it. Browsing and joining still work untouched.
3. On each gathering card and gathering detail page:
   - viewer has traits **and** at least one other confirmed attendee has traits → show
     "Your fit with this table: X%".
   - nobody else at the table has taken it → show a neutral "Be the first at this table" line.
   - viewer hasn't taken it → show the take-the-quiz nudge instead of a number.
4. Nothing about joining changes: no gating, no waitlist, no auto-seating.

## Verified current state

- `profiles` has `bio`, `city`, `interests`, `social_links` — no trait columns.
- `profiles` SELECT policy is self-only (plus admin). A user cannot read another attendee's
  profile from the browser.
- `gathering_attendees` SELECT is limited to your own row plus rows for gatherings you host or
  own the venue for. A plain attendee cannot read the other attendees from the browser.
- `matching.ts` exports `tableMates(top)` returning hardcoded initials; only
  `matching-quiz.tsx` uses it.
- `gatherings.ts` reads/join logic has no matching code at all.

Those two RLS facts are the reason the compatibility number cannot be computed client-side.

## Technical plan

### 1. Database

New nullable columns on `profiles` (not a new table — one row per user, always overwritten,
always read together with the profile):

```sql
ALTER TABLE public.profiles
  ADD COLUMN trait_spark     smallint,
  ADD COLUMN trait_curiosity smallint,
  ADD COLUMN trait_warmth    smallint,
  ADD COLUMN trait_depth     smallint,
  ADD COLUMN traits_updated_at timestamptz;
```

No new grants or policies: `profiles` already grants the needed privileges and the existing
"Users manage own profile" policy covers writing one's own scores. Scores are the 0–100 values
`scoreQuiz()` already produces. A `CHECK (… BETWEEN 0 AND 100)` is added on each column.

A named `personality quiz` version marker is **not** added in Phase 1; `traits_updated_at`
plus the existing `QUIZ_STORAGE_KEY` version suffix is enough.

### 2. Where the calculation runs

Two different places, for two different reasons:

- **Saving the result** — client write through the existing browser Supabase client
  (`profiles.update` on `auth.uid()`). No server function needed; RLS already scopes it.
- **Computing compatibility** — a **server function**, `getTableFit`, in a new
  `src/lib/matching.functions.ts`, using `.middleware([requireSupabaseAuth])`. It must be
  server-side because attendee lists and other users' trait scores are both invisible to the
  browser under current RLS, and we do not want to widen either policy just to render a
  percentage. The function:
  1. verifies the caller is signed in (middleware) and reads the caller's own traits via
     `context.supabase`;
  2. loads attendees + their trait scores with the admin client (`await import(...)` inside the
     handler) — privileged read, but it only ever returns aggregate numbers, never other users'
     identities or raw scores;
  3. returns per-gathering `{ gatheringId, fit: number | null, ratedCount: number }`.
  Input is a list of gathering ids so Explore resolves every card in one round trip.

Scoring formula (pure, lives in `matching.ts` so Phase 2 can reuse it):
`fit = 100 - (mean absolute per-trait distance between the viewer and the average of the other
rated attendees)`, clamped to 0–100 and rounded. Self is excluded from the table average. With
zero other rated attendees the function returns `fit: null`.

### 3. Components

- `src/lib/matching.ts` — delete `tableMates()`; add `traitsFromScores`/`fitScore` helpers and a
  `TraitScores`-from-profile-row mapper.
- `src/lib/matching.functions.ts` (new) — `getTableFit` server function described above.
- `src/lib/profile-traits.ts` (new, tiny) — `saveMyTraits(scores)` client helper.
- `src/components/landing/matching-quiz.tsx` — on completion, if a session exists, call
  `saveMyTraits`; keep the localStorage path for signed-out visitors (unchanged signup handoff
  via `QuizSavedNote`). Replace the fake table-mate avatars with the existing persona/trait
  summary only.
- `src/components/gathering-card.tsx` — accept an optional `fit` prop and render the fit chip /
  neutral state. No data fetching inside the card.
- `src/routes/explore.tsx` — after the gatherings query resolves and when signed in, one
  `useQuery` calling `getTableFit` with all visible ids; pass results down; render the
  non-blocking "take the quiz" banner when the signed-in viewer has no traits.
- `src/routes/gatherings.$id.tsx` — same single-id fit query plus the same nudge.
- `src/i18n/translations.ts` — new keys in en/tr/fa: `match.fit`, `match.beFirst`,
  `match.takeQuiz`, `match.takeQuizCta`, `match.saved`.

A signed-out visitor sees no fit UI at all — the server function requires auth, and both routes
are public/SSR so the query only runs client-side once a session exists.

### 4. Explicitly out of scope for Phase 1

No change to `joinGathering`, seat math, RLS on `gathering_attendees`, or any approval flow.

---

## Phase 2 outline (not built now)

Goal: move from "informational fit" to real seating.

- **Auto-seating algorithm** — a server-side assignment pass that groups confirmed attendees
  into tables by weighted score: trait distance (as in Phase 1), age gap, introvert/extrovert
  balance, shared interests, and a diversity bonus so tables aren't clones. Runs as a scheduled
  or host-triggered job, writes an `assignments` table (`gathering_id, user_id, table_id, score,
  assigned_at`) rather than mutating `gathering_attendees`.
- **Blocks** — a `user_blocks` table (`blocker_id, blocked_id`) with a hard constraint in the
  seating pass: two users in a mutual or one-way block are never placed at the same table. This
  is a filter applied before scoring, not a penalty weight.
- **Extra profile inputs** — age/birth year and an introversion axis; both need their own
  privacy handling since they are more sensitive than trait scores.

**Architecture guardrails Phase 1 must respect so Phase 2 stays cheap:**

1. Keep the scoring function pure and exported from `matching.ts` (no React, no Supabase inside),
   so the batch seating job can import the exact same pairwise scorer.
2. Return fit as `{ fit, ratedCount }` — never a bare number — so weight breakdowns can be added
   without changing every call site.
3. Never let the UI treat fit as authoritative: no filtering, sorting, or seat-hiding by fit in
   Phase 1, so introducing real assignments later isn't a behavioural regression.
4. Store traits on `profiles` as plain columns (cheap joins for a batch job), but keep all
   cross-user reads inside server functions from day one — Phase 2 needs the same boundary and
   widening RLS now would be hard to walk back.
5. Keep table assignment out of `gathering_attendees`; Phase 1 adds nothing there, so Phase 2's
   `assignments` table can arrive without a migration of live join data.
