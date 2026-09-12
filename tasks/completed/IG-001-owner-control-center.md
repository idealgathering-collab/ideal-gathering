# IG-001 — Owner Control Center foundation

Status: Complete
Owner: Farzin
Approval: Explicit Codex request on 2026-09-11 approves Owner/Admin separation, server enforcement, independent control routes and Owner management of Admin permissions.
Branch: codex/ig-001-owner-control-center
Evidence baseline: 4cee6c5
Dependencies: None

## Objective and user problem
Give Owner control over staff access, independent of member/venue navigation, while preserving existing Admin operations.

## Existing implementation
Inspected AGENTS, current task, product/UX/architecture/database/design/decisions/roadmap docs, route conventions, roles, Owner/Admin server handlers/routes, migrations/types and tests. Owner SQL exists but types lag. Owner pages inherit member gating. Server handlers read raw Admin roles; RLS/triggers use private.has_role. Legacy bootstrap permits Admin self-promotion and calls a removed helper.

## Requirements
Use additive permission grants, initially one coarse permission: platform_operations. Seed existing Admin grants to preserve behavior. Owner always has platform access without requiring an Admin row. Revoking the grant removes all staff privileges; ordinary self-service remains governed by existing policies. Fine-grained domain permissions require a later policy-mapping task. Apply the decision to server guards and RLS/triggers. Owner can list, grant, restrict, restore and remove Admin access; Owner targets are protected. Disable self-service Owner bootstrap; trusted DB operator provisions initial Owner. Preserve existing Owners.

## UX
Independent pathless Owner layout, existing /owner URLs, components and English control-console conventions. Add Admin access tab with labeled UUID input, loading/empty/error/retry and pending controls. Preserve RTL-friendly layout. No Admin redesign, profile or venue-dashboard work.

## Data
New permission grants and access audit, Owner-authorized transactional RPCs, fixed search paths, revoked direct writes. Unknown permissions fail closed. New ordered migration; do not modify applied history. Update types safely and record schema verification limits. No live database or deployment changes. Validate on disposable DB where feasible; rollback must not reopen revoked access.

## Privacy and safety
No service-role credentials in browser code. Owner-only access changes, caller identity from authenticated session, protect Owner targets, prevent legacy bootstrap and direct role/grant escalation. Record only access-change metadata in audit.

## Do-not constraints
No framework/repo split, dependency churn, unrelated refactor or UI redesign. Do not use production fixtures or replay historical migrations against production.

## Acceptance criteria
- [x] Owner-only role can use control and staff functions.
- [x] Existing Admin retains operations; restriction disables server and RLS staff powers.
- [x] Non-Owners cannot manage Admins, self-promote or use Owner APIs.
- [x] Control routes are independent of member/venue gating.
- [x] Access management handles success, errors, loading and empty data.

## Technical checks
bun run test; bun run lint; bunx tsc --noEmit; bun run build. Add authorization and disposable DB tests where practical. Hosted DB checks need a designated test environment. Report exact results and blocked checks.

## Execution checkpoints
| Stage | Saved work | Checks/result | Remaining / exact next step |
| --- | --- | --- | --- |
| Inspection | Approved spec | Clean main at 4cee6c5 | Implement authorization boundary |

## Completion report
Outcome and acceptance evidence: Owner routes now use an independent authenticated layout and a server-verified Owner boundary. Owner can grant, restrict, restore and remove Admin access. Existing Admins receive the initial platform_operations grant. Server handlers and existing Admin RLS/trigger checks use the revocable permission decision. Owner targets, role writes and legacy self-bootstrap are protected.

Files: added the permission migration, shared authorization helpers, Owner access server functions/UI, independent control routes, generated route/type updates and authorization tests. Existing Admin presentation was preserved.

Database: new unapplied migration `20260911120000_owner_control_center.sql` adds `admin_permissions`, `admin_access_audit`, permission/RPC helpers, Admin backfill and bootstrap lockdown. It was validated with 41 checks in disposable PGlite PostgreSQL. It was not applied to Supabase. Before rollout, confirm a current Owner exists or provision one through a trusted database operator; then apply migration through the normal Supabase/Lovable process.

Checks: `bun run test` passed 15 files / 169 tests. `bunx tsc --noEmit` passed. Targeted ESLint for new security/control files passed. `bun run lint` remains blocked by repository-wide pre-existing formatting debt (baseline: 37,521 errors and 14 warnings; task branch: 37,429 errors and 14 warnings). Normal `bun run build` remains blocked on Windows by the existing `@lovable.dev/mcp-js` separator check; the untouched baseline reproduces it. A temporary local run with only that plugin disabled built successfully; the committed Vite configuration remains unchanged. Build warnings include existing deprecated `inputValidator` calls, including one new use consistent with repository style.

Failures and risks: hosted DB tests were not run because no designated test environment was authorized. Migration application/live schema remain unverified. The first model intentionally has one coarse Admin permission; finer permissions require a separately mapped migration and UI. Owner provisioning remains an operator procedure.

Recommended next task: IG-002 Admin dashboard UI cleanup, keeping this permission boundary intact. A later access task can split platform_operations into domain permissions after mapping every server handler, RLS policy and trigger.

Commit/PR: implementation is committed on `codex/ig-001-owner-control-center`; PR pending creation at this checkpoint. Not merged or deployed.
