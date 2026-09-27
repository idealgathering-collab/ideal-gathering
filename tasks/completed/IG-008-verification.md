# IG-008 — Complete Venue Dashboard MVP verification

Completed 2026-09-27 on `codex/ig-008-venue-value-layer`, based on IG-007
`d56c413`. Implementation complete within the accepted scope; review, supported
production build and staging release validation remain. No merge or deployment.
Implementation `5975fc3` is pushed in draft [PR #12](https://github.com/idealgathering-collab/ideal-gathering/pull/12), stacked on PR #11. All three local ports (55439/55440/55444) confirmed stopped; browser viewport restored.
The approved IG-001 through IG-008 implementation queue is complete. Do not start
a new product feature automatically.

## Outcome and data

The existing venue route now offers Overview, Gatherings, Visitors, My Venue,
Tables and Menu. Upcoming activity precedes verified value and recent results.
Existing business editing/activation remain; table and menu editing are added.
Pending/rejected/beta-wait venues can correct their application through a collapsed
profile form while operational tools remain gated. Owner preview stays read-only.
EN/RU/FA copy, localized numbers/dates, mobile layout and expanded desktop sidebar
are included. Loading, empty, failed business/analytics loads and retry are distinct.

Exact sources, formulas, exclusions, privacy boundaries, omissions and rollout
are documented in [VENUE_DASHBOARD](../../docs/VENUE_DASHBOARD.md). Counts use
existing business_id and actual eligible checked_in_at rows: completed gatherings,
visits, unique/new/returning visitors and average verified attendance. No booking
or host-only attendance inference. Three 10-day visit periods and thresholded
persisted category counts are included. No authoritative timezone means no busy
hours/day claims. No revenue, utilization, offers model, billing, campaigns or CRM.

## Files and purpose

- `src/components/venue-value-dashboard.tsx`: authorized six-section shell,
  responsive overview/visitors/lists, paging, disclosure and failure states.
- `src/routes/venue.dashboard.tsx`: integrates shell, retains business form,
  activation, approval/beta/email gates and Owner preview; table editing dialog.
- `src/components/menu-section.tsx`: existing add form reused for item edits;
  associated labels, errors, read-only protection and responsive actions.
- `src/lib/venue-dashboard.ts` / `.functions.ts`: strict minimum JSON schema,
  authenticated caller RPC loader, validated paging and generic errors.
- `src/i18n/venue-value.ts` and translation registration: EN/RU/FA copy.
- Generated Supabase types: only introspected new RPC signature adopted.
- Two ordered migrations: aggregate/index, restrictive operational writes,
  server-stamped attendance and immutable attribution after check-in; then
  serialized gathering-row locking before attendance checks.
- Native verifier, eleven API cases, ten unit/component cases, synthetic preview
  and shared test fixture. Legacy Life Moments fixture made explicitly approved
  to satisfy the new intentional table-write rule.
- Counting/rollout documentation, database/UX/decision/roadmap notes, tests README,
  archived spec and current-task closure.

## Verification performed

Bun unavailable; installed equivalent Node entry points used. Runtime is the
previously marked `../ig001-verification-runtime`, outside the repository.
PostgreSQL 17.5 database `ig001_disposable` on loopback 55439 only. No live keys,
production rows or hosted mutation suites used.

| Command / suite | Result |
| --- | --- |
| `node tests/venue-value-postgres.verify.mjs <runtime>` | 57 native checks pass |
| `node tests/life-moments-postgres.verify.mjs <runtime>` | 61 pass |
| `node tests/gathering-moment-postgres.verify.mjs <runtime>` | 21 pass |
| `node tests/profile-postgres.verify.mjs <runtime>` | 29 pass |
| `node tests/member-profile-postgres.verify.mjs <runtime>` | 34 pass |
| `node tests/life-summary-postgres.verify.mjs <runtime>` | 26 pass |
| `node tests/owner-postgres.types.mjs <runtime>` | Introspection succeeds; exact optional UUID/pages → JSON signature adopted |
| `node node_modules/vitest/vitest.mjs run` | 250 unit/component tests, 23 files pass |
| Same with `--config vitest.venue.config.ts`, IG008_RUNTIME | 11 API tests pass |
| Same with `--config vitest.moments.config.ts`, IG003_RUNTIME | 53 pass |
| Same with `--config vitest.profile.config.ts`, IG002_RUNTIME | 9 pass |
| Same with `--config vitest.owner.config.ts`, IG001_RUNTIME | 42 pass |
| Final `run tests/unit/venue-value.test.ts` after UI corrections | 10 pass; subset, not additional unique tests |
| `node node_modules/typescript/bin/tsc --noEmit` | Pass, including final changes |
| Targeted ESLint of changed application/test files | Pass after formatting corrections |
| Translation/generated types lint | 199 / 760 errors, unchanged legacy formatting baseline |
| `node node_modules/vite/bin/vite.js build` | Existing Lovable MCP Windows routesDir containment assertion before compilation |
| `git diff --check` | Pass |

Targeted lint covers venue route, menu/value components, value i18n, schema/loader,
native verifier, unit/API tests, fixture/preview and venue Vitest config. Full
repository lint was not repeated; existing debt is not reported as a pass.

Native coverage includes own/other venue authorization, anonymous/user/venue/
staff distinctions, pending/rejected/unverified/beta gates, no identity leakage,
booking/host exclusions, first-time partition, both-way attendee blocks, host
blocks, exact period boundaries, uncapped totals/pagination, table lock/activation,
registration→approval→management SQL, forged INSERT attendance, timestamp/actor
stamping, attribution edits and concurrency. The race test observes a check-in
waiting on another transaction's gathering lock; after the event moves into the
future and commits, CHECKIN_TOO_EARLY rejects that check-in.

PostgREST was started only with the unchanged verified Start-PostgREST.ps1 launcher
using the explicit Windows PowerShell 5.1 executable; HTTP 200 confirmed. PowerShell
7 child startup reproduced the known DLL failure before recovery with 5.1. API
tests use real PostgREST/RLS/SQL and synthetic JWT claims; framework Auth dispatch
is mocked. This is not a hosted authentication end-to-end test.

Recovered fixture failures: mandatory venue fields supplied; cancelled/rejected
events staged through approved fixture setup before admin status change, respecting
existing capacity rules. Old pending venue fixture updated to approved for table
creation. Initial preview prefer-const and final header formatting lint errors
fixed. No dependency/lockfile or Lovable wrapper changes.

## Browser evidence and limits

Actual route/components/CSS run with isolated synthetic data boundaries on 55444.
375px English and 320px Persian RTL inspected, including no horizontal overflow,
localized digits and visitors section. At 1280px desktop, document width 1265 ≤
viewport 1280, expanded sidebar and cards inspected. Russian copy checked.
Overview, six sections, gathering disclosure, table label/capacity edit, menu edit,
profile save and Owner read-only controls exercised. Pending/rejected/beta-wait,
empty, loading and analytics error/retry checked; errors expose no operational
controls or stale values. Pending correction form opened after compatibility fix.
Retry under a persistent synthetic failure remains safely in the error state;
successful network recovery is not claimed. Component tests cover failed refresh.

Preview is not a production build bypass. Map, notification/auth transports and
uploads are synthetic boundaries. Hosted email/registration, actual file storage,
maps and complete deployed venue-selection/check-in journey still need staging.
Desktop screenshot stored outside repo as `ig008-desktop.png` in this task folder.

## Release and remaining risks

Both migrations applied only locally; schema generation and all DB regression
counts above are fresh IG-008 results. Definer RPC is deliberately narrowly
authorized and aggregated, without granting raw attendee reads. New guards do not
certify historical attendance; audit existing records before production-beta
claims. Counts reflect retained eligible records, not immutable lifetime cohorts.
Refresh has a normal up-to-60-second visibility window for remote changes.

Review the stacked dependency chain through IG-007 PR #11. Before release: run
the supported-platform normal build, apply ordered migrations to staging after
ledger review, refresh PostgREST, verify hosted Auth/approval/beta/Owner/admin and
actual attendance/venue management workflows, then decide production rollout.
Use forward corrective migrations for recovery; do not weaken attendance guards.
The next task is review/staging validation, not another product implementation.
