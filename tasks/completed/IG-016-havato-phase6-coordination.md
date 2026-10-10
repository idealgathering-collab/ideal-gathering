# IG-016 — Havato Phase 6.3 Gathering Coordination

Status: Implementation complete / draft review; staging and release acceptance pending
Owner: product owner
Approval: explicit user instruction in this chat, 2026-10-11: audit then implement responsibilities/bring-list, host assignment, volunteering, expenses/splitting, shared notes and permissions; update draft PR #17. No merge, deployment or hosted migrations.
Branch: codex/havato-phase6-private-gatherings; target havato
Evidence baseline: ba83b382b3bbba8f1c4f59874d9ef836caca99df
Dependencies: IG-014/015, existing IG-001–009

## Objective and existing implementation
Extend private gathering coordination without a second checklist or chat. Audited
gathering-room.tsx, detail route, guest endpoint/UI, IG-014/015 migrations/tests,
HAVATO-PHASE6-AUDIT.md, completed IG-001–009 specs and product/UX/database/architecture/
matching/design/roadmap/decision docs. Existing host checklist labels and personal
checkmarks are preserved; no assignee or shared completion exists. Existing chat
is reused unchanged. Life Moments notes are personal memories, not shared notes.
No existing expense ledger/split model found. No Phase 5/PR #16 dependency.

## Requirements and UX
- Private approved gatherings: extend existing checklist items with one shared
  responsibility, host assignment to eligible Going members or active Going guests,
  participant volunteer/release and shared done/reopen. Personal checks stay separate.
- Host controls which individual checklist items and notes are guest-visible; default
  false. Guest access requires valid unexpired/unrevoked link, 18+ attestation and Going.
  Guests can volunteer/release/complete only their own responsibility; no roster,
  chat, expenses, profile, memory or account permission is granted.
- Shared plain-text notes: authorized members create/edit their own; host edits/deletes
  any note and alone controls guest visibility. No rich HTML or uploads.
- Host records/deletes expenses, selects payer and Going participants for equal splits.
  Integer arithmetic with deterministic remainder; one currency per gathering while
  records exist (IRR/IRT whole units, USD/EUR cents). Members read ledger and balances.
  Records preserve historical participant keys when attendance changes. Guest names
  are host-only; members see a generic guest label. No payment/status/settlement claim.
- Bounded text/count/amounts, loading/error/retry, labeled keyboard controls, wrapping
  mobile layout, existing semantic UI tokens and Persian-first RTL plus English.
- Cancelled/rejected/ineligible/blocked/nonmember access fails closed. Completed
  approved gatherings retain member ledger/notes access; guest expiry remains unchanged.

## Data, privacy and rollout
Additive CLI-created migration; RLS-enabled non-exposed private responsibility,
note and expense tables with no direct client/service table grants. Private definer
operations explicitly authorize the resource; public wrappers are invokers with
role-specific grants. Reuse the existing gathering lock for coordination mutations
and RSVP, validate referenced checklist IDs and participants on every write.
No capacity or eligibility bypass. No raw tokens, emails, DOB, profile preferences
or guest roster in guest output. Cascade on gathering/checklist deletion; no backfill.
Schema-derived RPC types are verified against disposable PostgreSQL catalogs.
Rollback UI first, preserve rows and Phase 6 capacity/privacy protections.
Hosted migration/cache/advisors, separate-connection races and real mobile auth
acceptance require designated staging and separate approval.

## Acceptance and checks
- Functional host/member/guest task transitions, conflicts and ownership.
- Notes ownership and explicit per-record guest disclosure.
- Exact-sum splits/balances; invalid payer/duplicate/nonmember/mixed currency denied.
- RLS/grants, cross-event IDs, minors/missing DOB, block/revoke/expiry/RSVP/capacity.
- Full local migration replay; focused unit/DOM tests, typecheck, focused lint/build;
  extend/run Linux review CI and inspect results including general baseline failures.

## Exclusions
No duplicate IG-001–009, chat, checklist, personal notes, auth or capacity system.
No payment processing, custom unequal splits, shared album, host lifecycle redesign,
notification delivery, dependency upgrades, production writes or idealgathering.com.

## Checkpoints
Audit complete at baseline. Implementation 952985993fddd817d937ed85a54940cc75a1345f
passes 74 migrations/306 DB checks/126 focused tests/typecheck/lint/build in Linux.
General CI retains exactly 16 inherited rendering failures. Browser fixtures pass
eight host/member FA/EN mobile/desktop layouts. See the linked report/current.md for
precise evidence and staging/concurrency/ingress/retention release checks.
