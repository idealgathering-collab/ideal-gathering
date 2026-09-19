# IG-001 — final verification and completion report — 2026-09-19

## Final disposition

**Complete for the approved IG-001 scope; ready for review.** This closes the
earlier implementation checkpoint below. The explicitly permitted equivalent
non-production environment was native PostgreSQL 17.5 plus PostgREST 12.2.3,
bound to loopback in a disposable workspace cluster. No production connection,
live migration, deployment or merge was performed. IG-002 is the next task,
not implemented by this work.

The remaining build and repository lint findings are confirmed baseline/tooling
limitations, not an unverified owner bootstrap. The user's continuation explicitly
permits documenting the known Windows build issue without modifying unrelated
tooling. Actual hosted Supabase login, deployed browser rendering and production
rollout remain environment-specific checks; this report does not claim them.

## Final acceptance evidence

| Criterion | Evidence and outcome |
| --- | --- |
| Correct owner/helper/schema | All **60 unmodified committed migration files**, including the corrective migration, executed successfully on native PostgreSQL. `public.has_role` remains absent. Owner RPCs execute through signed PostgREST HTTP calls. |
| Eligible admin bootstrap | HTTP RPC returns true; owner and original admin/user rows remain. Same owner's repeat call returns true idempotently; a different admin returns false and gains no owner role. |
| Unauthorized claims | Normal user, venue, revoked admin and spoofed signup denied. Anonymous execute and invalid JWT signature denied. JWT metadata claiming admin/owner does not grant database roles. Direct user-role writes denied. |
| Concurrent claims | **10 rounds**, alternating the winning admin, each with two distinct `pg_backend_pid()` values. The second claim was observed waiting in `pg_locks` before the first committed. Exactly one owner after every round; second result false. |
| Admin compatibility | Both owner-with-admin and ordinary admin successfully created/revoked invitations, updated beta config and resolved moderation reports through real RLS/triggers. Normal-user invitation/config writes denied. |
| Owner functions/routes | **42 integration tests passed**: all five owner server handlers allow owner and deny normal user, venue, nonowner admin and revoked admin; four route gates use real role queries. Only `/owner` admits a nonowner admin to the existing bootstrap screen. Owner subroutes deny that account. Browser role/claim helpers use actual RPC/RLS. |
| Types | Generated public types from verified schema using `@supabase/postgrest-typegen` 0.2.2. Adopted generated `claim_initial_owner.Args = Record<PropertyKey, never>`; generated `is_owner` signature and owner enum match. Typecheck passes. |
| UI/scope | No layout, venue/dashboard, access-system, Life Profile or unrelated application changes. No new application dependency or lockfile changes. |

## Environment fidelity and safeguards

Runtime: Windows, Node 24.19.0, Bun 1.4.2, PostgreSQL 17.5
(`@embedded-postgres/windows-x64` 17.5.0-beta.15), `pg` 8.23.0, PostgREST 12.2.3.
Dependencies were installed in the external scratch directory only. Sources:
[PostgreSQL binary package](https://www.npmjs.com/package/@embedded-postgres/windows-x64),
[PostgREST release](https://github.com/PostgREST/postgrest/releases/tag/v12.2.3),
[Supabase type generator](https://www.npmjs.com/package/@supabase/postgrest-typegen).

`owner-postgres.setup.mjs` creates a NEW `ig001_disposable` database and refuses
to overwrite one. Native PostgreSQL listens only on `127.0.0.1:55439`; PostgREST
only on `127.0.0.1:55440`. A marker is checked before tests/type introspection.
No `.env` or hosted credentials are read. JWT signing material is random,
local-only and not committed. Only synthetic fixture owner rows are removed
between concurrency rounds. The historical August smoke test's two fixed UUIDs
were seeded as synthetic accounts in this new database so its unchanged SQL
could run. No migration was skipped or edited.

This is a realistic database/RPC environment, not the entire hosted Supabase
stack: minimal Auth users/uid and Storage/publication scaffolding supplies the
platform prerequisites, including public default grants. All product tables,
constraints, role helpers, policies and triggers come from committed migrations.
PostgREST authenticates signed JWTs and assumes real database roles. Fixture
accounts are SQL-created (the real signup trigger executes), not GoTrue-created.
The 42 handler/route tests bypass framework dispatch and auth middleware but use
actual Supabase clients and signed HTTP/RLS queries; they are not browser E2E.

Type-generation diff was reviewed, not blindly installed. Discarded unrelated
changes: local PostgREST 12.2.3 version marker versus repository 14.5, newer
generator JSON nullability formatting, `is_beta_launched` no-argument style,
and removal of `user_gathering_preferences` because its creation migration is
absent. No missing schema was invented to make regeneration match. That known
preferences provenance issue remains for IG-002/schema follow-up.

## Final exact commands and results

Run from the repository root. `R` below expands to the absolute scratch path
`C:/Users/ASUS/Documents/Codex/2026-09-19/referenced-chatgpt-conversation-this-is-an/work/ig001-verification-runtime`.
`IG001_RUNTIME` was set to that same path for integration tests. Logs remain in
the parent scratch directory; the scripts and this evidence are versioned.

| Command | Final result |
| --- | --- |
| `node tests/owner-postgres.setup.mjs R/node_modules/pg/lib/index.js` | Exit 0; 60 migrations applied (`ig001-native-setup.log`) |
| `node tests/owner-postgres.verify.mjs R` | Exit 0; **39 database/RPC checks**, including 10 concurrency rounds (`ig001-native-verify.log`) |
| `node node_modules/vitest/vitest.mjs run --config vitest.owner.config.ts` | Exit 0; **42 passed**, 1 file (`ig001-handler-integration-final.log`) |
| `node tests/owner-postgres.types.mjs R` | Exit 0; generated public types (`ig001-types-generation.log`); `pg` emits a non-failing deprecation warning about parallel introspection queries |
| `node node_modules/vitest/vitest.mjs run` | Exit 0; **185 passed**, 16 files (`ig001-unit-final.log`) |
| `TEST_DB_ENABLED=0 node node_modules/vitest/vitest.mjs run --config vitest.db.config.ts` | Exit 0; **45 skipped**, 6 files, not claimed as passes (`ig001-hosted-suite.log`). No designated hosted credentials/GoTrue were available. Relevant database verification ran through the native suites above. |
| `node node_modules/typescript/bin/tsc --noEmit` | Exit 0 (`ig001-typecheck-final.log`) |
| Targeted ESLint command below | Exit 1; **1,622 errors, 0 warnings**, versus **1,631 errors** on unchanged `f9c8e3e` for the same existing source files (`ig001-targeted-lint.log`, `ig001-baseline-targeted-lint.log`) |
| ESLint on all added tests/config only (same test/config paths below) | Exit 0 (`ig001-tests-lint-final.log`) |
| `bun run build` | Exit 1; same baseline Lovable MCP Windows slash/path containment failure (`ig001-build-recheck.log`). No Docker or installed WSL/Linux environment available. |
| `git diff --check` | Exit 0 |

Targeted lint (PowerShell single quotes preserve the route's literal `$`):

```text
node node_modules/eslint/bin/eslint.js src/integrations/supabase/types.ts src/lib/roles.ts src/lib/owner.functions.ts src/lib/owner-venue.functions.ts 'src/routes/_authenticated/owner.$section.tsx' tests/unit/owner-roles.test.ts tests/unit/owner-authorization.test.ts tests/owner-bootstrap.local.mjs tests/owner-postgres.setup.mjs tests/owner-postgres.verify.mjs tests/owner-postgres.types.mjs tests/owner-integration/handlers.test.ts vitest.owner.config.ts
```

Full-repository lint was already baseline-compared in the earlier checkpoint;
it was not repeated or broadly auto-fixed. Targeted errors are existing
formatting/CRLF and explicit-any findings; all new tests/config pass lint.

## Rollout and next task

Archive this report and spec per AGENTS.md. PR #5 is ready for review, not merged.
IG-002 Profile Data Ownership Cleanup is next. Before eventual production rollout,
inspect the target migration ledger and existing owners, apply the new migration
in normal order, and smoke-test actual hosted login/navigation. Do not replay
historical destructive migrations on populated data. No data backfill is needed.
Recovery remains an additive change disabling bootstrap execute if necessary;
never restore the missing public helper call or remove existing owner/admin data.

---

## Historical implementation checkpoint (superseded by final results above)

## Outcome and scope

Implementation prepared on `codex/ig-001-owner-role-foundation`, based on approved
specs `f9c8e3e` and main `9e69980`. Earlier dirty local checkouts were not changed.
This is an implementation checkpoint, not a clean-build or deployment completion.

- Added `20260919120000_fix_owner_bootstrap.sql`: correct private helper, serialized
  claim/check/insert, authenticated-only bootstrap execution, retained admin role.
- Added missing `is_owner` and `claim_initial_owner` RPC signatures to Supabase
  types. The owner enum was already present. Removed claim/owner-auth client casts.
- Corrected the existing owner gathering-status mutation parameter to the schema
  enum; this fixes the baseline type error without changing UI or allowed actions.
- Added 24 unit cases covering claim responses, home routing and all five owner
  server authorization gates; added executable local PostgreSQL regression fixture.
- Updated database/test docs, active spec and current task. No dependencies,
  lockfiles, historical migrations, dashboard layout or access-system redesign.

## Verification environment and exact commands

Windows desktop, Node 24.19.0. Bun 1.4.2 from the existing workspace tooling. Frozen
dependency installation: `bun install --frozen-lockfile` succeeded; lockfiles unchanged.
Logs were retained in the parent scratch directory (`ig001-*.log`).

| Command | Result |
| --- | --- |
| `bun run test` (initial) | Exit 0; 170 tests, 15 files passed |
| `node node_modules/vitest/vitest.mjs run` (final) | Exit 0; 185 tests, 16 files passed |
| `node tests/owner-bootstrap.local.mjs C:/Users/ASUS/Documents/Codex/2026-09-11/referenced-chatgpt-conversation-this-is-an-3/work/db/node_modules/@electric-sql/pglite/dist/index.js` | Exit 0; 14 PostgreSQL checks passed |
| `bunx tsc --noEmit` | Not executed: this installation has no `bunx` command; used local TypeScript binary below |
| `node node_modules/typescript/bin/tsc --noEmit` | Final exit 0 after correcting owner status parameter |
| `node node_modules/eslint/bin/eslint.js tests/unit/owner-roles.test.ts tests/unit/owner-authorization.test.ts tests/owner-bootstrap.local.mjs` | Exit 0 |
| `bun run lint` | Exit 1; 37,510 errors, 14 warnings. Baseline also fails (37,521 errors, 14 warnings), largely CRLF/formatting plus existing lint findings |
| `bun run build` | Exit 1; Lovable MCP plugin compares forward-slash root with Windows backslash routes path and rejects `src/routes` |
| `git diff --check` | Exit 0 |

Unchanged baseline worktree `f9c8e3e`, using the same dependency installation:
`bun run lint` exit 1; `node node_modules/typescript/bin/tsc --noEmit` exit 2
(one error at owner.$section.tsx:227, string not assignable to gathering_status);
`bun run build` exit 1 with the identical Windows path containment failure.
The plugin/configuration was not patched to manufacture a build pass.

The local database test first reproduces the missing `public.has_role` error,
then executes the corrective migration twice and checks anonymous/non-admin/null
identity rejection, successful admin claim, repeat claim, rejection of a second
admin, retained admin roles, one owner, direct-write denial and own-role RLS.
It executes committed SQL against an isolated prerequisite fixture, not all 59
historical migrations. Unit server-function tests mock middleware and database
responses; they validate handler gates, not real token verification or browser UX.
Owner routes were inspected; no browser E2E run is claimed.

## Rollout, recovery and remaining checks

No hosted database connection, migration application, live owner assignment,
merge or deployment was performed. Keep the spec active until review and remaining
validation resolve; do not advance automatically into IG-002 in this task.

Before applying on a designated non-production target, inspect its migration
ledger, private helper, enum and existing owner/admin rows. Apply only the new
corrective migration after the existing owner migrations; do not replay destructive
historical migrations on populated data. No existing rows are modified by applying
this function definition. Owner insertion happens only on an authenticated claim.
Existing duplicate owners, if any, are preserved and require separate review.

Test two concurrent admin sessions against that target; only the first may become
owner. The table lock covers all role writes until transaction end and must be kept
short; multi-connection contention was not tested by the single-connection local
engine. Also verify actual Supabase RPC/auth, admin moderation and owner routes,
then regenerate public types from that verified schema and review the diff.
Run the unchanged build on a supported non-Windows environment or resolve the
upstream plugin path bug in a separate tooling change. Review existing lint debt.

Recovery: disable bootstrap execution with a new corrective migration if needed;
do not restore the broken public-helper reference, remove owner/admin rows or edit
applied history. The application type changes are backward-compatible declarations.
Next task after closing IG-001 validation: IG-002 Profile Data Ownership Cleanup.
