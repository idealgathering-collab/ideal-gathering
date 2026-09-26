# IG-006 verification — 2026-09-26

## Outcome
Implemented Other-User Member Profile + Privacy on
`codex/ig-006-member-profile-privacy`, based on IG-005 `d840b37` (PR #9).
No IG-007 implementation, production migration, merge or deployment.

## Access rule and data
Both caller and target must be verified, beta-authorized user-role members.
A common approved gathering is required: host or registered participation before
it ends; host or checked-in attendance afterward, with the existing two-hour end
fallback. Blocks in either direction between members, or between either member
and that event's host, invalidate that connection. Another genuinely authorized
connection can still qualify. Cancelled/deleted events and historical unchecked
bookings do not qualify. Staff have no member-RPC bypass. Self links use /profile.
No new join-request workflow or speculative prior-interaction graph is introduced.

Shown: name, signed standard avatar, city, interests, canonical social style,
bio, generic common-gathering context and up to 12 profile-visible moment titles,
dates and signed photos. The canonical intentions projection remains compatible
with existing cards. Private: all DOB including coarse birth year, fine location,
notes/private moments, source gathering IDs, contact data, attendance rows,
ratings, private preferences, ownership/moderation and lifecycle metadata.
No public social metadata; noindex/nofollow/noarchive and authenticated route.

## Implementation files
- `supabase/migrations/20260925120000_member_profile_privacy.sql`: transactional,
  read-only definer RPC with fixed search path and restricted grants; private
  relationship helper; replacement of the existing shared-moment predicate.
  No broader table RLS/grants, new persistence, or destructive data changes.
- `src/lib/public-profile{,.functions}.ts`: minimal DTO and caller-authorized RPC;
  privileged client only signs the target's standard avatar object for 60 seconds.
  Unknown URLs/cross-account paths are not signed. No private fields queried.
- `src/lib/profile-card.functions.ts`: compatibility adapter supplies absent private
  fields as neutral values, canonical style and an empty other-user story.
- `src/routes/_authenticated/people.$id.tsx`, `src/components/member-profile.tsx`:
  mobile-first member view, self redirect, safe states, account/target cache keys,
  periodic authorization refresh, report/block and immediate local-block clearing.
- `src/components/profile/style.tsx`: optional compact rendering, existing own
  rendering unchanged. `report-dialog.tsx`: bounded mobile scrolling and optional
  focus return. Existing server safety actions remain unchanged.
- `src/i18n/member-profile.ts` and dictionary wiring: EN/RU/FA copy.
- Generated types: only the new RPC adopted from introspected disposable schema;
  compared to generated output after normalization of whitespace/semicolons.
- Tests: new member native verifier, component tests, synthetic actual-route preview;
  moments API safety/avatar tests and updated canonical-profile API expectations.
- Docs: LIFE_MOMENTS, PROFILE_DATA_OWNERSHIP, UX, DECISIONS, tests README and tasks.

## Checks executed
Node entrypoints substitute for unavailable Bun; no dependency/lockfile changes.
Runtime: the existing marked `ig001-verification-runtime`, PostgreSQL 17 on loopback
55439 (`ig001_disposable`), PostgREST on 55440. Never hosted/production credentials.

| Check | Result |
| --- | --- |
| `node node_modules/vitest/vitest.mjs run` | 233/233 unit/component tests passed, including own IG-005 regression and 6 new member checks. |
| `node tests/life-moments-postgres.verify.mjs <runtime>` | 61/61 native checks passed after installing IG-006. |
| `node tests/gathering-moment-postgres.verify.mjs <runtime>` | 21/21 passed; refreshes synthetic fixtures before the mutating API suite. |
| `node tests/profile-postgres.verify.mjs <runtime>` | 29/29 canonical ownership/RLS/save checks passed. |
| `node tests/member-profile-postgres.verify.mjs <runtime>` | 34/34 passed: host/participant, two participants, past unchecked, leaving, cancellation, both block directions, host blocks, no admin bypass, target verification, anon/member eligibility, safe projections and owner privacy. |
| Verified `Start-PostgREST.ps1 -Restart`, Windows PowerShell 5.1 | HTTP 200. Unchanged launcher handles DLL paths and schema readiness. |
| `IG003_RUNTIME=<runtime> node node_modules/vitest/vitest.mjs run --config vitest.moments.config.ts` | 47/47 passed; existing own/shared flow plus member privacy, block/unblock/report and avatar signing boundaries. |
| `IG002_RUNTIME=<runtime> node node_modules/vitest/vitest.mjs run --config vitest.profile.config.ts` | 9/9 passed, including canonical preferences and unchanged matching signal behavior. |
| `IG001_RUNTIME=<runtime> node node_modules/vitest/vitest.mjs run --config vitest.owner.config.ts` | 42/42 owner/admin regressions passed. |
| `node node_modules/typescript/bin/tsc --noEmit` | Passed. |
| Targeted ESLint on changed application/test/preview files | Passed, zero errors/warnings. |
| ESLint baseline comparison using `d840b37` | Translations 199 errors vs baseline 200; generated types exactly baseline 760. Existing formatting debt not reformatted. |
| `node tests/owner-postgres.types.mjs <runtime>` | Generated from actual migrated local schema; new RPC shape matches adopted type. |
| `node node_modules/vite/bin/vite.js build` | Blocked before compilation by unchanged known Lovable MCP Windows routesDir path assertion. No tooling workaround. |

## Browser verification
Actual people route/components/CSS with synthetic session/router/data boundaries
on loopback 55443, using the computer-use browser tool. Checked 375px initial
mobile, final 320x740 narrow layout and 1280x900 desktop columns; EN and Persian
RTL with no horizontal overflow. Shared and empty timeline, generic load failure,
loading and own-profile redirect were observed. Report submission produced the
success message; block confirmation removed all identity/activity and focused the
unavailable heading. Failed block retained the dialog with a generic error.
Cancel restored focus to Block and Report after their closing animations. Mobile
report content scrolls within 90dvh. No hosted user data or real reports were used.
Viewport restored after QA. The preview is not a production build or hosted E2E.

## Failures found and resolved
Initial SQL projection used text arrays where canonical storage uses JSONB; fixed
and validated. Existing is_email_verified deliberately checks only auth.uid(), so
target verification now uses an internal auth.users existence check without
returning account fields. Native fixture status changes required a synthetic admin
context. The profile mock initially overwrote explicit matching context; fixed.
A rerun of the mutating moments API suite without fresh gathering fixtures failed
two duplicate/initial-state expectations; regenerating fixtures produced 47/47.
PowerShell 7 Start-Process failed PostgREST DLL loading; the unchanged verified
launcher succeeds under Windows PowerShell 5.1. A Vite restart interrupted the
preview tab; a fresh tab on the same browser restored verification.

## Limits and release requirements
Migration is local-only. Apply it before the new loader, refresh PostgREST and
verify hosted Auth, actual Storage and full navigation in staging. Normal build
still needs the supported environment. RPC safe columns include storage object
paths for authorized signing; the server response replaces avatar paths with
signed URLs, and the existing shared helper strips moment paths. Existing moment
and owner keys are retained, never private source gathering IDs. Unsupported
legacy/external avatar URLs show initials. A moment signer failure retains the
existing fail-closed unavailable behavior.

Remote blocks are enforced on every new read; an already open screen may retain
previously authorized content until focus/45-second refresh. Signed URLs last up
to 60 seconds, and downloaded bytes cannot be recalled. Local successful block
clears immediately. No real lifetime counts, attendance lists or place history.
Use forward corrective migrations for recovery; do not restore unrestricted
profile reads. IG-006 is complete for the bounded implementation with these
release limits. IG-007 is the next task and was not started.

Review handoff: implementation `ac493ee` is pushed in draft
[PR #10](https://github.com/idealgathering-collab/ideal-gathering/pull/10), stacked
on [PR #9](https://github.com/idealgathering-collab/ideal-gathering/pull/9).
Base: `codex/ig-005-life-profile-v1`; head: `codex/ig-006-member-profile-privacy`.
The 2026-09-26 resume finalized archival and publishing only; completed tests were
not rerun. No IG-007 work, merge or deployment.
