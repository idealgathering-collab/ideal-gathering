# Current task

## Approval state
The user approved the implementation queue IG-001 through IG-008 on 2026-09-18.

Execute one bounded spec at a time. Approval of the queue does not authorize unrelated refactors, speculative features, production data changes, or deployment. Follow AGENTS.md and each task's explicit scope and acceptance criteria.

## Approved implementation queue

1. [IG-001 — Owner Role Foundation — complete](completed/IG-001-owner-role-foundation.md)
2. [IG-002 — Profile Data Ownership Cleanup — complete](completed/IG-002-profile-data-ownership.md)
3. [IG-003 — Life Moments Foundation](IG-003-life-moments-foundation.md)
4. [IG-004 — Completed Gathering to Life Moment](IG-004-gathering-to-life-moment.md)
5. [IG-005 — Life Profile V1](IG-005-life-profile-v1.md)
6. [IG-006 — Public / Other-User Life Profile](IG-006-public-life-profile.md)
7. [IG-007 — Life Summary & Activity Insights V1](IG-007-life-summary-v1.md)
8. [IG-008 — Venue Dashboard Value Layer](IG-008-venue-dashboard-value-layer.md)

## Next implementation task

**IG-003 — Life Moments Foundation.** Read its approved spec and reinspect the
repository before starting. No IG-003 implementation is included in this task.

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
