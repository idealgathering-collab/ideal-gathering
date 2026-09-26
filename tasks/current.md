# Current task

## Approval state
The user approved the implementation queue IG-001 through IG-008 on 2026-09-18.

Execute one bounded spec at a time. Approval of the queue does not authorize unrelated refactors, speculative features, production data changes, or deployment. Follow AGENTS.md and each task's explicit scope and acceptance criteria.

## Approved implementation queue

1. [IG-001 — Owner Role Foundation — complete](completed/IG-001-owner-role-foundation.md)
2. [IG-002 — Profile Data Ownership Cleanup — complete](completed/IG-002-profile-data-ownership.md)
3. [IG-003 — Life Moments Foundation — complete](completed/IG-003-life-moments-foundation.md)
4. [IG-004 — Completed Gathering to Life Moment — complete](completed/IG-004-gathering-to-life-moment.md)
5. [IG-005 — Life Profile V1 — complete](completed/IG-005-life-profile-v1.md)
6. [IG-006 — Other-User Member Profile + Privacy — complete](completed/IG-006-public-life-profile.md)
7. [IG-007 — Life Summary & Activity Insights V1 — complete](completed/IG-007-life-summary-v1.md)
8. [IG-008 — Venue Dashboard Value Layer](IG-008-venue-dashboard-value-layer.md)

## Next implementation task

**IG-008 — Venue Dashboard Value Layer.** Next; not started in this task.
Reinspect its approved spec and current implementation before beginning.

### IG-007 verification closure — 2026-09-26

Complete on `codex/ig-007-life-summary-v1`, based on IG-006 `65f9286`.
Own profile shows full rolling-30-day counts of completed eligible gatherings and
saved moments, persisted categories and three 10-day gathering counts. Read-only
caller-scoped invoker RPC retains RLS/access/block rules; no target parameter or
other-user metrics. People/place/first-time counts deliberately omitted for lack
of reliable evidence. Existing editing, matching and IG-006 remain unchanged.

- 240 unit/component tests; 53 moments/member/summary API, 9 profile API and 42
  owner/admin tests pass. Native DB: 26 summary + 61 moments + 21 gathering flow
  + 29 profile + 34 member checks pass. Post-fix affected component tests: 13 pass.
- Typecheck and targeted application/test lint pass. Translation/generated
  formatting debt matches baseline: 199 / 760 errors.
- Synthetic actual-route browser checks pass for 320px Persian RTL, 375px English,
  1280px desktop, Russian, loading/empty/error/retry and counting disclosure.
- Verified PostgREST launcher (Windows PowerShell 5.1) returned HTTP 200.
- Normal build remains blocked before compilation by the known Lovable Windows
  routesDir assertion. Supported-platform build and hosted staging remain.
- Migration applied only to marked disposable database. No merge/deployment.

[Archived spec](completed/IG-007-life-summary-v1.md) and
[exact verification report](completed/IG-007-verification.md) document rules,
files, commands, recovered failures and rollout limits. IG-006 PR #10 remains an
unmerged dependency. Finish review handoff; IG-008 stays a separate task.

### IG-006 verification closure — 2026-09-26

Complete on `codex/ig-006-member-profile-privacy`, based on IG-005 `d840b37`.
Implementation `ac493ee` is pushed in draft [PR #10](https://github.com/idealgathering-collab/ideal-gathering/pull/10), stacked on PR #9.
Existing people route is now an in-app member view with relationship and both-way
block enforcement at the database/shared-moment layer. No DOB/private notes or
fine location; own links use IG-005. Report/block, mobile/desktop/RTL and focus
behavior verified. No public social metadata, new feed or /life route.

- 233 unit/component, 47 moments/member API, 9 profile API, 42 owner/admin tests
  passed; native DB: 61 Life Moments, 21 gathering flow, 29 profile, 34 member.
- Typecheck and targeted application/test lint pass. Translation formatting debt
  is 199 vs baseline 200; generated types match baseline 760 formatting errors.
- Verified PostgREST launcher under Windows PowerShell 5.1 returned HTTP 200.
- Normal build remains blocked before compilation by the known Lovable Windows
  routesDir assertion. Supported-platform build and hosted staging checks remain.
- Migration applied only to the marked disposable database; no merge/deployment.

[Archived spec](completed/IG-006-public-life-profile.md) and
[verification report](completed/IG-006-verification.md) record exact rules, files,
commands, recovered failures and rollout limits. Next: review IG-006, then implement
IG-007 as a separate task. Preserve the unmerged IG-005 dependency.

### IG-005 verification closure — 2026-09-24

Branch `codex/ig-005-life-profile-v1`, based on IG-004 `abafe39` / PR #8.
Implementation `c5c4d4b` is pushed in draft
[PR #9](https://github.com/idealgathering-collab/ideal-gathering/pull/9), stacked
on PR #8. Temporary local services are stopped and browser viewport restored.
Existing `/profile` now presents identity, a bounded real-data summary, own
moments timeline, authorized completed gatherings, current places and About.
Full existing editing is accessible in a responsive dialog; canonical saves,
avatar, preferences, traits, account controls and matching behavior are retained.
Reuses the IG-004 editor and context RPC; no schema or other-user profile changes.

- 227 unit/component tests, 38 moments API tests, 61 Life Moment and 21 gathering
  flow native DB checks, 29 profile DB checks, 9 profile API and 42 owner/admin
  regressions passed. Required PostgREST launcher returned HTTP 200.
- Final typecheck passes. Changed application/test files lint clean; main
  translations retain exactly the baseline's 200 formatting errors, zero warnings.
  Normal build reproduces the known Lovable MCP Windows path assertion before
  compilation. No tooling/dependency workaround; supported-platform build remains.
- Actual profile route/components inspected with synthetic data at mobile and
  desktop sizes: profile save/focus return, unlinked moment note/visibility save,
  failed-save draft retention, loading/empty/errors, Persian RTL and overflow.
  Real hosted Auth/Storage and full deployed navigation remain staging checks.
- Summary explicitly limits moments to 100 latest and gathering candidates to
  12 hosted/12 joined. Counts are not lifetime totals; places are current details,
  not a visit history. No advanced metrics, IG-006, venue work or new route.

[Completed spec](completed/IG-005-life-profile-v1.md) and
[exact verification](completed/IG-005-verification.md) record implementation,
files, all checks and environment limits. No production migration, merge or
deployment. Preserve the unmerged PR #8 dependency. Exact next step: review
IG-005, then address IG-006 separately; do not start it in this task.

### IG-004 verification closure — 2026-09-24

Branch `codex/ig-004-gathering-to-life-moment`, based on IG-003 `7c71e88` / PR #7.
Implementation checkpoint `bb8d0a7` is pushed in ready-for-review
[PR #8](https://github.com/idealgathering-collab/ideal-gathering/pull/8), stacked
on [PR #7](https://github.com/idealgathering-collab/ideal-gathering/pull/7).
Passive Remember this? card on gathering detail opens a compact optional editor;
no automatic modal over attendance/safety/feedback. Caller-scoped prefill RPC
reuses IG-003 access and host/checked-in completed-gathering checks; the existing
insert trigger/unique index remain authoritative. Exact own lookup, duplicate
recovery, optional private photo/note, private-default visibility and EN/RU/FA
copy are complete. No Profile redesign, automatic creation or IG-005 work.

- 61 foundation + 21 new native DB checks, 29 Life Moment API/handler tests,
  221 unit tests, 29 profile DB checks, 9 profile API regressions and 42 owner/admin
  regressions passed. Typecheck passes; regenerated RPC signature matches schema.
- All new files/helper/tests lint clean. Remaining 1,091 formatting findings match
  the same-file IG-003 baseline exactly, with zero warnings. Normal build still
  hits the known Lovable MCP Windows path assertion; tooling unchanged.
- Actual component inspected in synthetic browser preview at mobile/desktop
  sizes, including saved/edit/error states, keyboard focus and Persian RTL.
  Actual Storage transport, browser file upload, full hosted Auth/route E2E and a
  supported-platform build remain staging/environment checks, not claimed passes.
- New additive migration ran only on the marked disposable database. Verified
  PostgREST launcher/cache used. No production migration, merge or deployment.

[Completed spec](completed/IG-004-gathering-to-life-moment.md),
[exact verification](completed/IG-004-verification.md) and
[flow/privacy/rollout contract](../docs/LIFE_MOMENTS.md) record the handoff.
Review stacked on PR #7 and preserve the unmerged dependency order.
Temporary database/API/preview services stopped; browser viewport restored.

### IG-003 verification closure — 2026-09-20

Branch `codex/ig-003-life-moments-foundation`, based on IG-002 `72b214a` / PR #6.
Implementation checkpoint `8cdc039` is pushed in ready-for-review
[PR #7](https://github.com/idealgathering-collab/ideal-gathering/pull/7), stacked
on [PR #6](https://github.com/idealgathering-collab/ideal-gathering/pull/6).
Additive model, owner-only raw rows, bounded shared projection, gathering
eligibility/duplicate rules and private media policies are complete. Historical
title/date survive event edits/deletion without location/participant copies.
CRUD/read/hide/upload helpers are tested; no existing UI/navigation redesigned.

- 61 native DB checks and 15 Life Moment API/handler tests pass.
- 212 unit tests, 29 profile DB regressions, 9 profile/onboarding/matching API
  regressions and 42 owner/admin regressions pass. Native coverage also exercises
  existing gathering check-in/out, avatar and venue workflows.
- Typecheck passes. All new/modified code/test files lint clean except the same
  760 baseline generated-type formatting errors. Build reproduces the existing
  Lovable MCP Windows path issue; no unrelated tooling changes.
- Generated table/RPC signatures match verified schema; six installed function
  bodies match the final migration. Verified launcher/cache used for PostgREST.
- Hosted suite: 45 skipped, not passes. Actual Storage HTTP signing/upload,
  browser/hosted Auth and a supported-platform build remain staging/environment
  checks. Storage SQL policies execute for real; signing transport is simulated.

[Completed spec](completed/IG-003-life-moments-foundation.md),
[exact verification](completed/IG-003-verification.md) and
[model/privacy/rollout contract](../docs/LIFE_MOMENTS.md) record the handoff.
No production migration, merge or deployment. Shared server photo links expire
after 60 seconds; private orphan media cleanup remains authorized rollout work.
Review this branch stacked on PR #6 and preserve dependency order.
Final cleanup confirmed both disposable test-service ports are closed.

### IG-002 verification closure — 2026-09-19

Branch `codex/ig-002-profile-data-ownership`, based on IG-001 completion `c78968c`.
Implemented canonical preference ownership, additive table/RLS/backfill migration
and atomic changed-field saves. Profile initialization races and swallowed
onboarding save failures are corrected. Audited identity/card/public/matching
readers; documented the ownership map in docs/PROFILE_DATA_OWNERSHIP.md.
Verification complete: 29 native database checks, 9 real HTTP/application tests,
42 owner/admin regression tests and 192 unit tests pass. New PostgREST launcher
confirms current schema cache. Generated preference/RPC types match verified
schema; typecheck passes. All changed application/test files lint clean except
760 unchanged generated-type formatting errors (same-file baseline: 875 errors,
1 warning). Build reproduces the baseline Lovable MCP Windows path failure.
Hosted suite: 45 skipped, not passes. Browser/hosted Auth/deployed build were not
verified; no supported Linux runtime available. No production operation or redesign.
Temporary local PostgreSQL/PostgREST services are stopped.

[Completed spec](completed/IG-002-profile-data-ownership.md) and
[exact final verification](completed/IG-002-verification.md) are archived.
Implementation checkpoint `a0f72aa` is pushed and ready for review in
[PR #6](https://github.com/idealgathering-collab/ideal-gathering/pull/6).
The review branch stacks on IG-001 [PR #5](https://github.com/idealgathering-collab/ideal-gathering/pull/5),
which is still unmerged; preserve dependency order. Review/merge and production
rollout remain separate. Apply the additive migration before new RPC clients,
inspect target schema/ledger drift and verify staging cache/privacy/save behavior.

### IG-001 verification closure — 2026-09-19

Continued from `116a53f` on the same branch. No implementation restart.
[Final verification report](completed/IG-001-verification.md) and
[completed spec](completed/IG-001-owner-role-foundation.md) are archived per AGENTS.md.

- New disposable native PostgreSQL 17.5/PostgREST 12.2.3 target; all 60 committed
  migration files applied without edits or skips using documented platform scaffolding.
- 39 real database/RPC checks passed, including ten separate-connection lock-wait
  races, denied normal/venue/revoked-admin claims, retained admin access and real
  invitation/beta/moderation operations.
- 42 owner handler/route integration tests and 185 unit tests passed; typecheck passed.
- Schema types generated and reviewed; adopted only the owner no-argument RPC
  shape. No preference table removal or unrelated type/version changes.
- Targeted lint: 1,622 existing errors versus 1,631 baseline; all new tests/config
  lint clean. Build still fails only at the baseline Lovable MCP Windows path check.
  No supported Linux/container runtime available; no unrelated tooling workaround.
- Existing hosted DB suite: 45 skipped, not passes. The equivalent native suite
  closes IG-001 database acceptance; full hosted Auth/browser/deployment checks
  remain environment-specific rollout work, not claimed here.
- No new application dependencies, dashboard redesign, production migration,
  merge or deployment. Temporary local servers are stopped after verification.

Historical next action (superseded by IG-002 closure): review PR #5 and proceed
with IG-002's bounded scope. Before any
eventual production migration, inspect the real target ledger/roles and follow
the documented rollout procedure. The known build/lint issues remain documented.

## Historical IG-001 checkpoints (superseded by closure above)

### IG-001 checkpoint — 2026-09-19

Branch: `codex/ig-001-owner-role-foundation`, based on approved specs commit `f9c8e3e` (includes main `9e69980`). Separate clean checkout; earlier local work preserved.

Inspection complete: instructions/spec, database/auth docs, migrations/helpers, owner routes/functions, generated types, unit/DB tests and recent commits. Current enum already contains owner; only RPC declarations lag. Existing bootstrap contract permits the first existing admin, not a configured email/account allowlist.

Implemented additive corrective migration using `private.has_role`, serialized check/insert, restricted bootstrap execution, retained admin role, typed owner RPC and server authorization clients. Dashboard unchanged. Local PostgreSQL prerequisite fixture: 14 checks passed, including reproducing the old missing-helper failure. Initial unit run: 170 passed. Lint/typecheck/build in progress.

Remaining: finish verification and baseline failure comparison, record rollout/type-generation limitations and final handoff. No hosted database, deployment or merge performed.

### IG-001 final implementation checkpoint — 2026-09-19

Implementation ready for review; validation remains incomplete. See [exact results and rollout/recovery report](completed/IG-001-verification.md).

Saved implementation commit: `7e0793e`. Pushed to `codex/ig-001-owner-role-foundation`;
[draft PR #5](https://github.com/idealgathering-collab/ideal-gathering/pull/5)
targets the approved specs branch `docs/ig-001-008-build-specs`. Not merged/deployed.

- Final unit run: 185 tests passed across 16 files; local PostgreSQL fixture: 14 checks passed.
- Typecheck: exit 0 with local TypeScript binary. `bunx` unavailable; exact substitute recorded in report.
- New test files lint: exit 0. Full lint: exit 1, 37,510 errors / 14 warnings; unchanged baseline: 37,521 errors / 14 warnings.
- Build: exit 1, same Lovable MCP Windows path containment failure on unchanged baseline. Dashboard remains visually unchanged; only its gathering-status parameter type was corrected.
- New migration has only run against the isolated local prerequisite fixture. No hosted application, schema regeneration, multi-connection race test or browser E2E claimed.

Exact next step: review the task branch, verify the migration/RPC/auth/admin behavior and simultaneous admin claims on a designated disposable target, regenerate types from verified schema, and obtain a supported-platform build. Preserve the active spec until these checks close, then archive spec/report under `completed/`, update links and hand off to IG-002. No unrelated implementation is authorized by this checkpoint.

**IG-001 — Owner Role Foundation**

Repository evidence already identified a concrete mismatch: the owner bootstrap migration references a public role helper removed/moved by earlier migrations, while generated Supabase types lag owner role/RPC support.

Implement IG-001 only after re-inspecting current branch state, relevant migrations, role helpers, types, tests, and recent commits as required by AGENTS.md.

Do not broaden IG-001 into an access-system rewrite or owner-dashboard redesign.

## Product direction carried by this queue

The surrounding gathering product already exists and should not be rebuilt.

The main consumer change is:
completed gathering → Life Moment → Life Profile.

The Life Profile is the existing Profile; do not create a separate `/life` product.

The main business change is:
venue gathering activity → real attendance attribution → venue value metrics.

Do not rebuild the venue dashboard. Preserve and extend it.

## Deferred

Not part of IG-001 through IG-008:
- Live Gathering
- Emergency Button
- Community Aid
- advanced Brain research
- Pulse implementation
- AI life stories/analysis
- venue billing/subscriptions
- paid promotion/ad marketplace

## Working loop

For each task:
1. Read AGENTS.md, this file, the active IG spec, and relevant docs.
2. Reinspect current implementation before editing.
3. Implement only the approved scope.
4. Run relevant tests, lint, typecheck, and build.
5. Record exact results and unresolved risks.
6. Update this file with checkpoint/next step.
7. Move completed spec/report to `tasks/completed/` according to AGENTS.md.
8. Continue to the next approved IG task without reopening already-approved product scope unless implementation reveals a genuine conflict requiring a decision.

## Prior workflow checkpoint

Workflow documentation was prepared on `codex/project-workflow`; see [completion report](completed/workflow-setup.md). Inspect current Git state and branch/merge status rather than assuming that historical branch state has been merged or deployed.
