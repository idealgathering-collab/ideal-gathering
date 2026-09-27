# IG-009 — Staging, Integration & Beta Readiness

Status: Blocked at staging provisioning; inspection checkpoint saved
Owner: Farzin
Approval: User request on 2026-09-27 explicitly authorizes integration, isolated staging, ordered migrations, hosted smoke testing and conditional promotion.
Branch: codex/ig-009-staging-beta
Evidence baseline: 10984d66b1865e07398015d9818a9dee2c294881
Dependencies: IG-001 through IG-008, PRs #5–#12

## Objective
Make the existing product testable end-to-end on the actual Lovable/GitHub/Supabase stack, then promote only after staging and recovery gates pass.

## User problem
The completed implementation chain is not deployed. Local and synthetic tests do not establish hosted Auth, Storage, email, maps or end-to-end behavior.

## Existing implementation
Read AGENTS.md, tasks/current.md, TASK_TEMPLATE.md, architecture/database documentation, tests/README.md, Vite wrapper, Supabase clients/config, migration prerequisites, manifest and prior verification.
GitHub main and Lovable latest code both report 9e69980bd328724bd73ad6eb0202790ff8289379. This is evidence of synchronization, not proof of the configured sync branch or published build SHA.
All PRs #5–#12 remain open, mergeable at inspection; #5–#8 ready, #9–#12 draft.
Full findings and the unrun test matrix: [verification](IG-009-verification.md).

## Requirements
1. Verify Lovable sync branch and deployment linkage. Integrate through an isolated branch retaining all published history. No force-push.
2. Establish a separate staging Lovable deployment and Supabase backend. Prove browser and server target staging before any test write.
3. Reconcile target migration ledger and schema, then apply approved migrations in order and reload PostgREST.
4. Align browser/runtime environment, Auth redirects, email delivery, Storage policies/signing, map services and PWA.
5. Record a working staging URL and exact deployed commit.
6. Execute every hosted journey in the verification matrix with synthetic staging accounts.
7. Fix only demonstrated integration/runtime blockers.
8. Promote only after staging passes, backup/restore and previous-build rollback are verified, and production migration drift is resolved. Stop for required credentials/manual actions.
9. Keep current.md updated; archive this spec and verification only on actual completion.

## UX
Preserve existing UI, EN/RU/FA translations and Persian RTL. Test mobile and desktop, keyboard/focus, loading, empty, failure and retry behavior with real hosted boundaries.

## Data
No new schema change proposed at this checkpoint. No migrations applied and no cache refresh issued.
Production inspection is metadata-only. Never copy production user data into staging or run fixture tests against production.
Keep enum-addition migrations committed separately before dependent SQL. Existing migration files are immutable.
Historical oversized venue gatherings remain for audit; do not delete or silently alter them.
Recovery requires a verified backup/restore procedure plus previous application artifact, not destructive down migrations.

## Privacy and safety
Service-role keys remain server-only. Record environment names, not values. Use dedicated staging accounts and controlled mailboxes. Verify cross-user, unverified, blocked, unauthorized and read-only Owner boundaries.

## Do-not constraints
No IG-010, Matching V2, feature additions, product-rule changes, dependency churn, unrelated refactors, production validation writes or rewritten Git history. Preserve temporary venue activation integer 2–5 cap. Real push is unimplemented and explicitly deferred.

## Acceptance criteria
- [ ] Lovable GitHub sync branch and production artifact verified.
- [ ] Isolated staging app and backend identified and proven separate from production.
- [ ] Migration ledger/schema reconciled; ordered migrations and schema cache verified.
- [ ] Hosted build succeeds and exact staging URL/commit recorded.
- [ ] All hosted smoke matrix rows pass, including Auth/Storage/email/maps and privacy.
- [ ] Mobile/desktop PWA installation behavior verified; push limitation documented.
- [ ] Backup/rollback and production migration safety verified.
- [ ] Same tested application revision promoted with environment-specific configuration.
- [ ] Farzin receives live URL and safe test procedure.

## Technical checks
For any implementation fix: bun run test, bun run lint, bunx tsc --noEmit, bun run build and relevant integration tests. Use existing test safeguards. A supported-platform build is required; prior Windows failure is not a pass.
For this documentation-only checkpoint: git diff --check, local link checks, documentation-only changed-file inventory and Git ancestry checks. Do not rerun mutating fixtures without isolated staging.

## Execution checkpoints
| Stage | Saved work | Checks/result | Remaining / exact next step |
| --- | --- | --- | --- |
| Inspection | Spec, verification, ledger snapshot, current task | Remote PR state, Lovable metadata, read-only DB metadata | Sign in to Lovable editor; inspect sync settings; create isolated staging |
| Provisioning | Two remix attempts | INVALID_ARGUMENT; no staging project returned | Resolve via authenticated editor; confirm empty separate backend |

## Completion report
Not complete. No new application build, hosted journey, deployment, migration or production promotion is claimed. See verification for exact evidence and blockers.
