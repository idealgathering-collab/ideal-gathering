# IG-004 — Final verification

Completed 2026-09-24 for the approved completed-gathering flow scope.
Branch: `codex/ig-004-gathering-to-life-moment`, based on IG-003 `7c71e88` / PR #7.
No merge, production migration or deployment. IG-005 is next and has not started.

## Delivered and entry point

- `src/components/gathering-moment.tsx` adds a passive Remember this? card to the
  existing gathering detail page, below attendance/safety actions and above the
  room. It does not auto-open, modify feedback/rating, or require journaling.
  Reopen a completed gathering to reach it; an open page refreshes eligibility
  every 30 seconds. Not now dismisses the invitation for that visit.
- A responsive existing Radix dialog prefills title/date/place. Photo and note
  are optional; visibility defaults private. Notes stay private even for profile
  visibility. Existing records open for editing. English/Russian/Persian copy,
  radio labels, focus management, loading/error/retry/success and busy states use
  existing primitives. No Profile/timeline/history/venue redesign or new route.
- `src/lib/life-moments.functions.ts` adds an exact own gathering lookup and
  duplicate recovery to the existing create helper. Concurrent/retried creates
  return one record plus `alreadyExists`; existing personal values are not
  overwritten. The UI loads that version for explicit editing.
- Optional media uses the existing scoped signed upload token and private bucket,
  followed by path attachment. Client type/5 MiB checks supplement DB/storage
  enforcement. Photo failures retain the saved moment and offer retry/skip;
  photo signing failure does not prevent loading/editing saved text.
- Tests cover the new read/context/flow boundaries; a credential-free synthetic
  component preview uses actual UI and styling with in-memory data.

## Database and privacy

New additive migration `20260924120000_gathering_moment_context.sql` introduces
only `get_gathering_moment_context(uuid)`. SECURITY INVOKER retains source RLS;
execution is authenticated-only. It reuses `private.can_use_life_moments` and
IG-003's ended-approved/host-or-checked-in rule. Missing end means start + two
hours. A joined-but-unchecked attendee, nonparticipant, future/cancelled gathering,
unverified/waitlisted/venue account, or blocked host/viewer pair gets no context.
It returns only id/title/date/place, never participant lists or coordinates.
No existing trigger, write policy, table, unique index or Storage grant changed.

The IG-003 insert guard and partial unique index remain final write authority.
Caller ownership is derived from authentication; the exact own query cannot
return other users' notes. The existing block-aware shared projection is unchanged.
Live place context is not copied into a new location-history field; historical
moment title/date continue to survive gathering edits/deletion as before.

Migration applied only on the marked synthetic `ig001_disposable` database on
loopback port 55439 (PostgreSQL 17.5). Installed function body matched migration,
and `prosecdef=false` confirmed invoker execution. Public types were regenerated
from this schema; only the new RPC declaration was adopted, and an AST-based
comparison confirmed it matches. No backfill or production migration.

## Exact verification results

Commands ran from repository root. `<runtime>` is the existing external marked
native test runtime. Hosted credentials were not used. Bun was unavailable in
this resumed shell; the package's same Vitest/TypeScript/Vite entry points ran
under Node 24.19.0 instead. The failed Bun command is not counted as a test run.

| Command/check | Result |
| --- | --- |
| `node tests/life-moments-postgres.verify.mjs <runtime>` | Exit 0; 61 foundation checks passed, including separate-connection duplicate contention, privacy/storage RLS, event history, join/check-in/out, avatar and venue regressions. |
| `node tests/gathering-moment-postgres.verify.mjs <runtime>` | Exit 0; 21 checks passed: exact prefill, host/checked-in eligibility, unchecked/nonparticipant/account/time/status denials, blocked pairs both directions, invoker/source comparison, core-only private save and rating-after-save compatibility. |
| `<runtime>/Start-PostgREST.ps1 -Restart` | HTTP 200. Cache loaded 20 relations, 27 relationships and 8 functions, including the new RPC. Only the required launcher was used. |
| `IG003_RUNTIME=<runtime> node node_modules/vitest/vitest.mjs run --config vitest.moments.config.ts` | Exit 0; 29 API/handler tests passed (15 foundation, 14 flow). Includes two simultaneous core-only handler requests recovering the same record, one create/one existing result, no-overwrite retries, own-only loading and private/shared behavior. |
| `node node_modules/vitest/vitest.mjs run` | Exit 0; 221 tests passed in 19 files. Includes photo type/size boundaries, optional/private defaults, translation completeness and existing feedback/attendance rules. |
| `node tests/profile-postgres.verify.mjs <runtime>` | Exit 0; 29 native profile regression checks passed. |
| `IG002_RUNTIME=<runtime> node node_modules/vitest/vitest.mjs run --config vitest.profile.config.ts` | Exit 0; 9 profile/onboarding/matching API regressions passed. |
| `IG001_RUNTIME=<runtime> node node_modules/vitest/vitest.mjs run --config vitest.owner.config.ts` | Exit 0; 42 owner/admin regressions passed. |
| `node node_modules/typescript/bin/tsc --noEmit` | Exit 0; no diagnostics, including preview/test code. |
| `node node_modules/eslint/bin/eslint.js <changed source/test/config files> --format json --output-file <scratch>/ig004-lint-final.json` | Exit 1 only for 1,091 unchanged baseline formatting findings, zero warnings. New files and changed helper/test/config files lint clean. Details below. |
| `node node_modules/vite/bin/vite.js build` | Exit 1 at the known Lovable MCP Windows routesDir/root slash assertion before application compilation. No unrelated tooling workaround. |
| `node tests/owner-postgres.types.mjs <runtime>` | Exit 0; generated public schema types. New RPC AST signature matches adopted declaration. |
| Synthetic browser component preview | Mobile 375×812 and desktop 1280×900 inspected; core-only save, saved/edit state, note/visibility edit, failed-save draft retention, Escape/focus return, ineligible hidden state, load error/retry control and Persian RTL inspected. See fidelity limits below. |
| `git diff --check` and local documentation links | Exit 0; handoff/spec/report links resolve. |

Targeted lint included the new component/rule, Life Moment helpers, translations,
generated types, gathering detail route, native/API/unit tests, signing fixture,
preview files and Vitest moments config. Baseline `7c71e88` source was separately
linted through stdin using the same filenames: Russian dictionary 105, main
translations 200, generated types 760, gathering detail 26; exactly the same
1,091 findings and zero warnings. New entries were formatted without reformatting
the existing files; line endings normalized to tracked LF. No unrelated code was
changed to eliminate baseline findings. Docker/Podman unavailable; WSL not installed.

During verification, the local PostgREST process stalled inside the initial
sandbox launch. Only its exact verified executable/PID was replaced, then the
same launcher succeeded with host permission. No global PATH or launcher changes.
Initial API failures exposed the test mock resolving the real server module on
concurrent dynamic imports. A test-only alias now supplies the synthetic signer
reliably; production signing is unchanged, and the final API suite passes.

## Browser and environment fidelity

The preview serves the actual component and design-system CSS but replaces
server dispatch/data/storage with synthetic in-memory fixtures; it is not an
application build or hosted end-to-end test. Mobile inspection found a fieldset
minimum-width overflow, fixed with bounded grid/fieldset sizing. Final English
and Persian mobile layouts fit without horizontal overflow; desktop layout and
keyboard dismissal/focus return were observed. A real file-picker automation
attempt failed/interrupted before attaching the synthetic file. Browser photo
upload/retry is therefore not claimed as passed.

Native tests execute real PostgreSQL roles/grants/triggers/RLS. API tests execute
real PostgREST and Supabase DB queries plus application validators/handlers.
Framework authentication/dispatch and Storage signing transport are simulated.
No claim of actual Supabase Storage upload/token validation/expiration, hosted
Auth, full-page route/browser E2E, or a successful supported-platform build.
Unchanged hosted opt-in suites were not run against a live target.

## Completion and rollout

IG-004 is complete for the approved local implementation scope, with the above
environment-specific verification limits recorded. Spec/report are archived and
`tasks/current.md` sets IG-005 next; IG-005 implementation is not included.

Review stacked on PR #7 and preserve dependency order. Before authorized rollout,
apply the RPC migration after IG-003, refresh PostgREST cache, then deploy the
caller. Verify target schema/grant drift, full-page auth/feedback behavior, actual
Storage upload/signing and a supported-platform build in staging. Already issued
photo URLs retain their prior 60-second lifetime; failed/replaced/deleted media
can leave private orphan bytes and still require the separately authorized
retention cleanup established in IG-003. Recover by disabling the new card or
forward-correcting the RPC; do not delete saved user moments/media.

Temporary PostgREST and preview processes were stopped; PostgreSQL shut down
cleanly using the same sandbox identity that launched it. Browser viewport was
restored. Synthetic fixtures and logs stay outside Git for reproducibility.
