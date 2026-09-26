# IG-007 — Life Summary & Activity Insights V1 verification

Completed 2026-09-26 on `codex/ig-007-life-summary-v1`, based on IG-006 `65f9286`.
The implementation is complete within the accepted V1 scope. IG-008 is next and
has not started. Branch work is not merged or deployed.

## Outcome and exact data

Own `/profile` now shows a private recent-life card, replacing the IG-005 capped
list-length snapshot. It presents:

| Metric | Persisted evidence / rule |
| --- | --- |
| Completed gatherings | Approved gatherings started in the last 720 hours, ended by now (ends_at or existing start + two hours), caller host or checked_in_at attendee, no either-direction caller/host block. One row once even if host is also attendee. |
| Moments saved | Own life_moments.created_at within the same window, including private/manual moments and older memories saved recently. Database-protected save time, not happened_at or updated_at. |
| Activity categories | Existing eleven gathering_type values; unknown/null maps to Other / uncategorized. Count descending then category C-collation; no free-text inference. |
| Recent activity | Three consecutive 240-hour gathering-start buckets, oldest first. Half-open except final now endpoint; exact cutoff/bucket boundaries tested. |

Counts cover all eligible rows within this period, independently of the timeline's
100 rows and history's 12 hosted/12 joined candidates. Neither count claims a
lifetime total. Existing bounded history, timeline, current place cards, About,
full editor and matching behavior remain intact. No /life route or member metrics.

People met is deliberately omitted: attendance does not establish interpersonal
contact. Historical place visits are omitted because current venue references
and labels can change without historical snapshots. First-time experiences have
no explicit source field. Nothing is inferred from browsing, profile city, saved
locations or private text. No scores, streaks, rankings, comparisons or AI.

## Files and implementation

- `src/components/life-summary.tsx`: responsive own summary; localized counts/dates,
  category labels, period breakdown, private label and expandable explanation.
  Loading is distinct from zero; empty is supportive with My Gatherings link;
  failed refresh hides stale totals and offers retry.
- `src/components/life-profile.tsx`: replaces old snapshot, labels bounded history,
  invalidates summary after existing timeline save. Existing editing retained.
- `src/lib/life-summary.ts` and `life-summary.functions.ts`: strict aggregate schema
  and authenticated caller-client loader with strict empty input and masked errors.
- `src/i18n/life-summary.ts`, translation registration: EN/RU/FA copy.
- New migration and minimal generated RPC signature in Supabase types.
- Native verifier, six API cases, seven component/schema cases; existing profile
  unit mock and synthetic actual-route preview extended.
- LIFE_MOMENTS, PROFILE_DATA_OWNERSHIP, UX, DATABASE, DECISIONS and tests README
  document counting, ownership, rollout and reproduction. Spec archived alongside
  this report; current.md sets IG-008 next.

No IG-006 route/component/loader/predicate changes. No profile writers, canonical
preference ownership, matching, venue dashboard or global navigation changes.

## Database and privacy

`20260926160000_own_life_summary.sql` adds `get_my_life_summary()`, STABLE SECURITY
INVOKER with fixed empty search_path, and `life_moments_owner_saved_at` index.
No table, backfill or RLS/grant expansion. Function execution is authenticated-only;
existing can_use_life_moments checks user role, email verification and beta access.
Existing row policies still apply. No target ID/date selector, privileged client
or duplicate activity store. Output has only window bounds, counts, allowlisted
category/count pairs and three dated counts; no source IDs, names, notes or location.

Query cache is account-scoped with gcTime 0, refetch on focus/every 60 seconds and
save invalidation. Remote data/eligibility changes can remain visible until next
refresh; new reads reauthorize, and failed refresh hides stale data. Own summary
does not grant access to other people or reveal their attendance.

Applied only to the previously marked disposable local PostgreSQL 17.5 database
ig001_disposable at loopback 55439. Generated via the existing native schema
introspection script; adopted only the new no-argument JSON RPC declaration.
PostgREST 12.2.3 refreshed through the unchanged verified launcher under Windows
PowerShell 5.1; HTTP 200 confirmed. Never launched raw postgrest.exe.

## Exact checks and results

Bun is unavailable; equivalent installed Node entry points used from the repository.
Runtime argument below is `../ig001-verification-runtime`, outside the repository.

| Command / configuration | Result |
| --- | --- |
| node tests/life-summary-postgres.verify.mjs <runtime> | 26 native checks pass |
| node tests/life-moments-postgres.verify.mjs <runtime> | 61 pass |
| node tests/gathering-moment-postgres.verify.mjs <runtime> | 21 pass |
| node tests/profile-postgres.verify.mjs <runtime> | 29 pass |
| node tests/member-profile-postgres.verify.mjs <runtime> | 34 pass |
| node tests/owner-postgres.types.mjs <runtime> | Schema introspection succeeds; new RPC signature adopted |
| node node_modules/vitest/vitest.mjs run | 240 tests / 22 files pass |
| Same with --config vitest.moments.config.ts; IG003_RUNTIME set to runtime | 53 pass (includes 6 new summary cases) |
| Same with --config vitest.profile.config.ts; IG002_RUNTIME | 9 pass |
| Same with --config vitest.owner.config.ts; IG001_RUNTIME | 42 pass |
| node node_modules/typescript/bin/tsc --noEmit | Pass, including after localized-digit fix |
| Targeted ESLint of changed application/test files excluding two legacy files below | Pass |
| Translation/generated-type ESLint | 199 / 760 formatting errors, same as IG-006 baseline; no new errors |
| node node_modules/vite/bin/vite.js build | Fails before compilation at known Lovable MCP Windows routesDir assertion |
| git diff --check | Pass |

Targeted ESLint: src/components/life-profile.tsx, src/components/life-summary.tsx,
src/i18n/life-summary.ts, src/lib/life-summary.ts, src/lib/life-summary.functions.ts,
tests/life-summary-postgres.verify.mjs, tests/unit/life-summary.test.ts,
tests/unit/life-profile.test.ts, tests/moments-integration/life-moments.test.ts,
tests/life-profile-preview/fixtures.tsx and vite.config.ts. The legacy files are
src/i18n/translations.ts and src/integrations/supabase/types.ts. No full-repo
formatting or dependency/lockfile changes. After the small digit-localization
adjustment, the affected summary/profile component tests were rerun: 13 pass.

Native cases cover private old memories saved now, old saved moments excluded,
host/checked-in eligibility and deduplication, non-attended/cancelled/proposed/
future/not-ended/unrelated exclusions, deterministic category mapping/order,
exact time boundaries, both block directions, anonymous/unverified/waitlisted/
venue denials, another caller's own-only result, absent target overload and minimum
output. Fixtures prove 103 moments and 28 gatherings exceed history caps.
Existing attendance/block/privacy/member and owner/admin regressions pass.

API tests execute real SQL/PostgREST/RLS under signed synthetic JWTs while mocking
framework Auth dispatch and Storage signing transport, as in the existing harness.
Hosted Auth/Storage and deployment E2E are not claimed. Hosted opt-in suite was
not enabled; production credentials/data were not used.

## UI actually checked

The existing actual /profile route/component/CSS preview ran on loopback 55442,
with synthetic session/data/router/header boundaries and no hosted requests.
Browser checked EN at 375px phone and 1280px desktop, Persian RTL at 320px, and
Russian copy on desktop. DOM width checks found no horizontal overflow; desktop
periods share a row and mobile periods stack. Screenshots inspected after reload
to avoid a temporary browser compositor artifact during viewport changes.
Counting disclosure opens, localized digits/dates render, zero state offers
My Gatherings, loading does not show zeroes, error/retry stays generic.

The browser connector's stale tab wrappers initially failed; its documented fresh
tab API recovered without changing app code. Preview is UI evidence, not a normal
production build or hosted navigation/Auth test. Existing editor compatibility is
covered by retained code and profile/API regressions, not a newly claimed full
hosted editor E2E.

## Recovered failures and limits

- First native summary run exposed the existing immutable created_at trigger
  overriding an old-date fixture (3 instead of 2). Fixed only fixture setup:
  briefly disable guard_life_moment inside a transaction on the marked disposable
  database, insert the old synthetic row, reenable before commit. Production
  trigger unchanged. Final 26 checks pass.
- New translation spreads initially added two formatting errors; split touched
  lines only. Final lint matches baseline. Persian bucket digits localized after
  browser inspection; affected tests/typecheck/lint passed.
- Normal build reproduces the known @lovable.dev/mcp-js routesDir slash/path
  containment error before compilation. Lovable wrapper is preserved. A supported
  platform build is still required before release.
- Counts reflect current records/eligibility, not immutable historical analytics.
  No production-scale performance/load test; owner/date index supports saved
  counts, existing gathering/attendee indexes retained.

## Release and next task

IG-007 is complete for review with the documented environment limitations.
Before deployment inspect target schema/ledger and prerequisites, apply the new
additive migration, refresh PostgREST, deploy dependent client/server code and
check staging Auth, account switching, block/cancellation refresh and summary.
Use forward corrective migration for recovery; rolled-back app may leave the
unused RPC/index safely installed. No production migration, merge or deployment.

IG-006 PR #10 remains open/unmerged; preserve its dependency chain when reviewing
this branch. IG-008 — Venue Dashboard Value Layer is next and remains untouched.
