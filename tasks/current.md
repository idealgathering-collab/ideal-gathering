# Current task

## Approval state
The user approved the implementation queue IG-001 through IG-008 on 2026-09-18.

Execute one bounded spec at a time. Approval of the queue does not authorize unrelated refactors, speculative features, production data changes, or deployment. Follow AGENTS.md and each task's explicit scope and acceptance criteria.

## Approved implementation queue

1. [IG-001 — Owner Role Foundation](IG-001-owner-role-foundation.md)
2. [IG-002 — Profile Data Ownership Cleanup](IG-002-profile-data-ownership.md)
3. [IG-003 — Life Moments Foundation](IG-003-life-moments-foundation.md)
4. [IG-004 — Completed Gathering to Life Moment](IG-004-gathering-to-life-moment.md)
5. [IG-005 — Life Profile V1](IG-005-life-profile-v1.md)
6. [IG-006 — Public / Other-User Life Profile](IG-006-public-life-profile.md)
7. [IG-007 — Life Summary & Activity Insights V1](IG-007-life-summary-v1.md)
8. [IG-008 — Venue Dashboard Value Layer](IG-008-venue-dashboard-value-layer.md)

## Next implementation task

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
