# IG-001 verification checkpoint — 2026-09-19

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
