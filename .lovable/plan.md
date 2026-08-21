# First-login onboarding flow

A short, one-time welcome shown the first time a user signs in after signup, ending in the personality quiz. No changes to the quiz's own questions, scoring, or persistence.

## Where "seen onboarding" is tracked

One new column on `profiles`: `onboarded_at timestamptz` (null = never onboarded). It is set when the user finishes the flow, whether they take the quiz or skip it — so onboarding never reappears.

Whether they actually took the quiz is already knowable: `profiles.traits_updated_at` / `trait_*` are null until `saveMyTraits` runs. So:

- onboarding shown ⇔ `onboarded_at is null`
- dashboard quiz prompt shown ⇔ `onboarded_at is not null` AND `traits_updated_at is null`

No second "skipped" flag needed, and if they later take the quiz from the dashboard the prompt disappears by itself.

## Post-signup entry point

`/auth` currently navigates to `redirect ?? "/dashboard"` after sign-in, email confirm, and Google. That stays. Instead of special-casing signup, a new authenticated route `/onboarding` is the destination whenever onboarding is pending:

- The dashboard route checks the profile on load; if `onboarded_at` is null it redirects to `/onboarding`. This catches every path in (email signup, confirm link, Google, existing accounts that predate the column) without touching auth logic.
- Venue accounts are unaffected — they are already redirected to the venue portal by the authenticated layout before this runs.
- Existing users: the migration backfills `onboarded_at = now()` for all current profiles, so only genuinely new accounts see it.

## The flow (`/onboarding`)

Full-screen, no site header, progress dots at the top, three steps:

1. **Welcome** — "Welcome to Ideal Gathering, {name}" + one line on the idea: small tables, real conversation, a seat kept for you. Continue.
2. **How it works** — three compact rows: find a table near you / claim a seat / show up and talk. Continue.
3. **Quiz intro** — "Let's find your kind of table": one short paragraph on what the four traits do (better seat matching), then two actions: **Take the quiz** (~2 minutes) and a quiet **Skip for now**.

Then, if they chose to take it, the quiz itself runs inline as step 4, followed by the result card with a single "Take me in" button to `/dashboard`.

Back is available on steps 2 and 3. Closing the tab mid-flow just means onboarding shows again next visit (nothing written until the end).

## Skip vs complete

- **Complete**: `saveMyTraits` writes the trait scores (existing code path), then `onboarded_at` is stamped, then → `/dashboard`. No quiz prompt anywhere afterwards.
- **Skip for now** (from the quiz intro, or the quiz's own skip-out link mid-questions): `onboarded_at` is stamped with no trait write, then → `/dashboard`. Traits stay null, so the dashboard prompt appears.

Skipping is never blocked and never re-asked as a modal.

## Dashboard prompt for skippers

The existing `TakeQuizNudge` (already used on explore and gathering detail) is reused on the dashboard, placed under the header/greeting above the gatherings list, rendered only when traits are null. One change to it: it currently links to `/` with hash `matching`, which sends a signed-in user back to the marketing page. It should point at `/onboarding?step=quiz` (quiz-only mode, no welcome screens) instead — that also fixes the same odd jump on explore and gathering detail.

## Quiz reuse vs new

Reused as-is, unchanged:

- `src/lib/matching.ts` — `QUIZ`, `scoreQuiz`, `levelFor`, persistence helpers.
- `src/lib/profile-traits.ts` — `saveMyTraits`.
- `src/components/table-fit.tsx` — `TakeQuizNudge` (link target only).

New:

- Migration: add `profiles.onboarded_at`, backfill existing rows.
- `src/routes/_authenticated/onboarding.tsx` — the step machine, welcome screens, and the finish/skip writes.
- `src/components/onboarding/quiz-steps.tsx` — the question-and-answer UI in app (not landing/cosmic) styling, driven by the same `QUIZ` data and `scoreQuiz`. The landing widget's markup is cosmic-themed and tangled with its own preview/CTA states, so onboarding renders the same data rather than importing that component; `src/components/landing/matching-quiz.tsx` is not modified.
- i18n keys under `onboarding.*` for the welcome copy and buttons, in EN, TR and FA (quiz question copy already exists and is reused).

## Technical notes

- Profile read/write goes through the browser Supabase client with the existing owner RLS policy on `profiles`; no new policy or grant is needed.
- The redirect check lives in the dashboard route's existing profile-aware data path, so it costs no extra round trip on later visits.
- Route is under `_authenticated/`, so the managed auth gate handles sign-in state.
