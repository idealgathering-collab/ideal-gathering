# IG-014 — Havato Friends & Family, first increment

Status: First increment review-ready; overall Phase 6 in progress
Approval: User request in this chat, 2026-10-10: audit first, implement Phase 6.1 and feasible related 6.2–6.4, create reviewable PRs. This supersedes the old documentation-only workflow restriction for this bounded task.
Branch: codex/havato-phase6-private-gatherings
Evidence baseline: havato 755a9ed024f9672dffe5afaea46d109ae899ac49
Dependencies: Existing gathering loop and IG-001–IG-009; not PR #16.

## Objective and requirements
Extend existing gatherings with immutable public/private visibility. Private hosts create a proposed gathering with a place label, optional address, title, description, local start time and 2–30 capacity. Keep admin moderation, email verification and beta access. Private creation and RSVP require a profile date of birth proving 18+; missing DOB fails closed. This is eligibility, not identity verification.

Invite existing eligible members by exact email, stored as recipient UUID only. No external email is sent; no new account onboarding or beta invitation behavior. Host and recipient see invitations, outsiders do not. Going atomically reserves a seat in existing gathering_attendees; Maybe/Declined release it. Existing row locks enforce capacity. Host can revoke, removing room access. Invitations are visible in My Gatherings. Chat/checklist/calendar reuse existing components. Existing completed memories/history remain available with current participation rules.

Phase numbering is interpreted from the user brief: 6.1 creation, 6.2 invitations/RSVP, 6.3 planning, 6.4 memories/history. The referenced chat contains no more detailed 6.x specification. This increment does not claim the whole phase complete.

## Privacy and safety
Private details visible only to host, non-revoked invitee and existing admin moderation. Bidirectional host blocking denies guest access. Pending invitees cannot read chat/checklist; only Going participants can. Recipient email is transient RPC input, never stored on invitation or returned to peers. Invites expire at start; RSVP closes then. No anonymous share capability. Exclude private rows from public service-role metadata, sitemap, discovery and compatibility scoring. Private memories must remain private: profile sharing of private-event moments is disallowed, including direct writes.

## Scope limits
No authentication/provider changes; PR #16 stays unmerged. No hosting, production migrations, deployment, merge, or idealgathering.com operations. No expenses, payment, automatic settlement, assigned responsibilities, shared album, external invite links/delivery or editable/cancellable host lifecycle in this increment. Preserve existing public gatherings and Life Profile; no duplicated tables for chat, checklist, photos or history.

## Acceptance and checks
- Create private proposal, enforce validation/18+/beta/email and immutable privacy.
- Hide it from anonymous/outsider reads, public metadata/sitemap/discovery/matching.
- Authorized host invites/revokes; recipient sees inbox and responds; wrong users denied.
- Going/Maybe/Declined and revocation update membership atomically, capacity failure rolls back.
- Reuse approved room controls and keep personal private-event moments private.
- FA/RTL and EN UI, loading/empty/error/retry; semantic Havato tokens.
- Focused unit, real disposable PostgreSQL/RLS tests, typecheck, focused lint, production build; report baseline failures and hosted/browser limitations honestly.

## Data and rollout
Add visibility to gatherings, one recipient-bound gathering_invitations table and caller-scoped RPCs. Existing rows default public. RLS, least-privilege grants, triggers, indexes and private authorization helpers are part of the additive migration. Test only synthetic local fixtures. Apply migration and reload API schema cache on a designated staging target before shipping client; verify generated types, real Supabase Auth, moderation, push and browser acceptance there. No hosted migration is authorized here. Rollback app first; retain private policies/data, never reset visibility to public.

## Checkpoints
Audit: [concrete source inventory](../docs/HAVATO-PHASE6-AUDIT.md). [Implementation/check report](IG-014-havato-phase6-report.md).
