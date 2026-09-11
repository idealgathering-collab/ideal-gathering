# IG-001 — Owner Control Center foundation

Status: In progress
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
- [ ] Owner-only role can use control and staff functions.
- [ ] Existing Admin retains operations; restriction disables server and RLS staff powers.
- [ ] Non-Owners cannot manage Admins, self-promote or use Owner APIs.
- [ ] Control routes are independent of member/venue gating.
- [ ] Access management handles success, errors, loading and empty data.

## Technical checks
bun run test; bun run lint; bunx tsc --noEmit; bun run build. Add authorization and disposable DB tests where practical. Hosted DB checks need a designated test environment. Report exact results and blocked checks.

## Execution checkpoints
| Stage | Saved work | Checks/result | Remaining / exact next step |
| --- | --- | --- | --- |
| Inspection | Approved spec | Clean main at 4cee6c5 | Implement authorization boundary |

## Completion report
Pending. No migration applied, merge or deployment performed.
