# IG-005 — Life Profile V1 verification

Completed 2026-09-24. Branch `codex/ig-005-life-profile-v1`, based on IG-004
`abafe39` / [PR #8](https://github.com/idealgathering-collab/ideal-gathering/pull/8).
IG-004 remains open/unmerged; preserve stacked review order. No merge,
production data changes, migration or deployment. IG-006 is next, not started.
Implementation commit `c5c4d4b` is pushed in draft
[PR #9](https://github.com/idealgathering-collab/ideal-gathering/pull/9), stacked
on PR #8. A documentation follow-up records this review link.

## Outcome and changed files

- `src/routes/_authenticated/profile.tsx`: existing `/profile` now opens with
  identity, real activity, and About. The complete existing editor opens in a
  responsive Radix dialog; all original profile fields, avatar upload, interests,
  intentions, gathering types, quiz and canonical changed-field save remain.
  Existing Style/Aura components and onboarding preference editing are reused.
  Account/settings/saved locations remain accessible in a disclosure section.
  Successful saves update identity and close the dialog; closing without saving
  retains the draft on this page. Avatar changes still save immediately, explained
  in the dialog. Account-keyed remounts discard old account state. Missing card or
  initialization failure offers retry instead of silently removing edit access.
- `src/components/life-profile.tsx`: owner-only activity UI, bounded summary,
  newest-first moments, private notes/visibility, eligible completed gatherings,
  and current place labels. Independent loading/empty/error/retry states; failures
  never become zero totals. Mobile stacks vertically; desktop expands to two
  columns. Existing token palette and navigation remain. Account-scoped query
  keys, active-view photo refresh, missing-photo fallback, no raw media paths in UI.
- `src/lib/life-profile.functions.ts`: authenticated own-only loader accepts no
  user ID, uses the caller's Supabase client/RLS, considers the 12 latest approved
  started hosted and 12 joined bookings, deduplicates, and checks each via the
  existing IG-004 context RPC. Only ended approved hosted/checked-in gatherings
  with valid account access and no blocked host pair survive. Returns only
  id/title/date/place, not attendance lists or coordinates. At most 24 context
  calls; this favors verified existing authorization over a new data policy.
- `src/components/gathering-moment.tsx`: exports the existing editor for timeline
  reuse and accepts a nullable source link. Private note/photo/visibility editing
  works for manual or detached moments; title/date remain historical display.
- `src/lib/life-moments.functions.ts`: owner timeline retains text when photo
  signing fails; shared loader still fails closed. Makes nullable prefill typing
  explicit. No widened shared projection, grants or authorization.
- `src/i18n/life-profile.ts` plus translations wiring: EN/RU/FA copy, including
  precise summary limits and privacy wording. No bulk dictionary formatting.
- `tests/unit/life-profile.test.ts`, expanded moments API suite and
  `tests/life-profile-preview/`: rendering/privacy regressions and repeatable
  synthetic browser preview of the actual profile route and components.
- Task archive, current handoff, Life Moments/ownership/UX documentation and
  decision log describe the shipped scope and verification limits.

## Data meaning and privacy

Summary counts describe this view, not lifetime metrics: at most 100 most recent
moments, and eligible gatherings from the bounded candidate bookings above.
No all-time total, participation inference from booking alone, person count,
streak, ranking, AI summary or advanced metric. Older moments beyond 100 remain
stored; pagination is not included. Existing linked records remain accessible
through their gathering's exact lookup independently of this limit.

Place labels come only from currently authorized gathering context. They are
explicitly described as current details, not historical visits; saved locations
are not evidence of attendance. No location snapshot or new tracking is stored.
Own notes are always private. Source deletion/blocks cannot erase the person's
saved moment; unavailable sources are not rendered as timeline links. Private
media refreshes while the view is active; expired/failed photos retain readable
text. Existing 60-second signed URL and orphan-media lifecycle limits remain.

No database/schema/type-generation change is needed. Existing IG-001–004
migrations must be present before rollout. No changes to `/people/$id`, shared
profile/card helpers, matching, attendance, ratings, venue work or global routes.
No `/life` route, dependency/lockfile changes, or IG-006 implementation.

## Exact verification

Windows, Node 24.19.0; Bun not available in this shell. Used the package's installed
Vitest/TypeScript/ESLint/Vite entry points under Node; did not regenerate locks.
`<runtime>` is the existing marked external `ig001-verification-runtime`,
PostgreSQL 17.5/PostgREST 12.2.3 on loopback 55439/55440. No hosted credentials used.

| Command/check | Result |
| --- | --- |
| `node node_modules/vitest/vitest.mjs run` | Exit 0: 227 tests, 20 files; includes six new component-rendering/copy checks. |
| `node tests/life-moments-postgres.verify.mjs <runtime>` | Exit 0: 61 native foundation/privacy/storage/attendance/venue regressions. |
| `node tests/gathering-moment-postgres.verify.mjs <runtime>` | Exit 0: 21 native eligibility/block/context/rating checks. |
| `node tests/profile-postgres.verify.mjs <runtime>` | Exit 0: 29 native ownership/atomic-save/backfill regressions. |
| `<runtime>/Start-PostgREST.ps1 -Restart` | HTTP 200. Required verified launcher used, never bare executable. |
| `IG003_RUNTIME=<runtime> node node_modules/vitest/vitest.mjs run --config vitest.moments.config.ts` | Exit 0: 38 API/handler tests (29 prior + 9 new), including own history, checked-in vs unchecked, account denials, both block directions, forged user ID and photo failure. |
| `IG002_RUNTIME=<runtime> node node_modules/vitest/vitest.mjs run --config vitest.profile.config.ts` | Exit 0: 9 profile/onboarding/matching API regressions. |
| `IG001_RUNTIME=<runtime> node node_modules/vitest/vitest.mjs run --config vitest.owner.config.ts` | Exit 0: 42 owner/admin regressions. |
| `node node_modules/typescript/bin/tsc --noEmit` | Exit 0, including preview and tests. |
| `node node_modules/eslint/bin/eslint.js <changed application and test files excluding main translations> --format json --output-file <scratch>/ig005-lint-final.json` | Exit 0: zero errors/warnings. |
| Same lint on `src/i18n/translations.ts` | Exit 1: 200 existing formatting errors, zero warnings. Baseline `git show abafe39:src/i18n/translations.ts` linted through stdin with the same filename: exactly 200/0. |
| `node node_modules/vite/bin/vite.js build` | Exit 1: same documented Lovable MCP Windows routesDir/root separator assertion before compilation. No build-tool workaround. Docker/Podman absent; WSL reports not installed. |
| `git diff --check` | Exit 0. |

Targeted clean lint paths: new activity component/helper/copy; profile route;
existing moment editor and helper; new unit test, expanded API test; all preview
TS/TSX files. Test-only fixture suppresses the Fast Refresh mixed-export warning
because it deliberately aliases UI and data modules and reloads synthetic state.

During development, typecheck caught nullable prefill inference; fixed. One new
API test originally assumed an earlier fixture still had its note; it now sets
its own note before asserting failure behavior. The rendering error-state test
disables retry-on-mount in its test client to inspect the settled error rather
than an immediate retry. Final results above follow those corrections.

## Browser verification and limits

`node node_modules/vite/bin/vite.js --config tests/life-profile-preview/vite.config.ts`
serves the actual profile route, activity/editor components and design CSS on
loopback 55442. Only session/data/router/header/saved-location boundaries are
synthetic; this is not a hosted-auth or deployed navigation test.

Observed mobile 375×812 and desktop 1280×900 layouts; desktop timeline/gatherings
expand to columns. EN mobile and Persian RTL mobile main/editor measured without
horizontal overflow. Observed profile dialog field preservation, name save,
dialog close/focus return and updated identity; unlinked moment note/visibility
save and updated timeline; failed-save draft and retry controls; loading/empty/
load-error states with correct counts; missing-photo text fallback. Browser
snapshots can precede dialog animation/query completion; final saved text was
explicitly read after completion. The preview restarted during formatting and
the browser session expired on interruption; both were recovered.

Native checks execute actual SQL roles/RLS/constraints. API tests execute real
PostgREST/SDK queries with framework auth/dispatch and Storage signing simulated.
Component tests render actual React with synthetic query state. No claim of
hosted Auth, real Storage signing/upload/expiration, full application navigation
E2E, physical-device testing or successful supported-platform production build.
These remain staging checks alongside existing media retention requirements.

## Handoff

IG-005 is complete for the local implementation scope; spec/report archived.
IG-006 — Public / Other-User Life Profile is next and must be a separate task.
Before rollout: preserve dependency order, verify existing migrations/cache,
exercise real authenticated route/edit/media behavior and run the unchanged
build on a supported platform. Roll back the UI if needed; retain user data.

Temporary PostgreSQL, PostgREST and preview services stopped; loopback ports
55439/55440/55442 confirmed closed and browser viewport reset. Scratch logs stayed
outside Git. The initial push was blocked by automatic approval review; an
authenticated repository/PR check confirmed origin and exact base commit, then
the reviewed push was permitted. No history rewriting or alternative upload.
