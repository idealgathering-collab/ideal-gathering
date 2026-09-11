# IG-XXX — Short task title

Status: Draft / Approved / In progress / Blocked / Complete
Owner: [product decision owner]
Approval: [user approval reference and exact scope; none while Draft]
Branch: [task branch]
Evidence baseline: [commit]
Dependencies: [task IDs or none]

## Objective
One bounded outcome.

## User problem
Who encounters which problem, in which situation, and why it matters.

## Existing implementation
Routes, components, helpers, tests, schema/migrations inspected; current behavior and reproducible gap. Cite repository paths. Separate observed facts from assumptions.

## Requirements
Required behavior, validation, edge cases and explicit scope.

## UX
Entry/exit points; happy path; loading/empty/error/retry states; mobile and keyboard behavior; accessible labels/focus; supported languages/RTL; copy and existing components to reuse.

## Data
CURRENT tables/columns, reads/writes and ownership. PROPOSED changes, constraints/indexes, RLS/grants/functions/triggers, migrations, backfill, type regeneration and rollback/recovery. State none when no database change is needed.

## Privacy and safety
Data minimization, visibility by role, consent, blocking/reporting, authentication/resource authorization, retention/deletion impacts and secret handling. Describe misuse/unauthorized-access cases.

## Do-not constraints
No unrelated refactors, dependency churn, redesign, invented schema, new popularity mechanics, or unapproved later-phase features. Add task-specific exclusions.

## Acceptance criteria
- [ ] Observable successful user outcome.
- [ ] Failure/retry and missing-data outcomes.
- [ ] Unauthorized access is rejected where relevant.
- [ ] Existing supported behavior is preserved.
Replace examples with specific, testable conditions.

## Technical checks
Exact relevant unit/integration tests, lint/typecheck/build commands and manual checks. Record test environment, expected result and any permitted omission. Hosted database tests require a designated test target; no production cleanup.

## Execution checkpoints
| Stage | Saved work | Checks/result | Remaining / exact next step |
| --- | --- | --- | --- |
| Start | Inspected baseline | Pending | First bounded step |

## Completion report
Outcome and acceptance-criteria evidence:
Files changed and reasons:
Database changes / migrations / applied or unapplied / rollout:
Tests and results:
Typecheck, lint and build:
Failures (new vs pre-existing) and blocked checks:
Remaining issues / risks:
Recommended next task:
Commit / PR:
Review / merge / deployment status:

After completion, archive this spec/report under `tasks/completed/` and link from `tasks/current.md`. Never mark an unrun check as passed.
