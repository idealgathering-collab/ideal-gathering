# IG-015 — Havato Phase 6.2 external guest invitations

Approved scope: user request 2026-10-10. Extend draft PR #17, targeting havato;
PR #16/Phase 5, deployment, hosted migrations and idealgathering.com excluded.

Audit: IG-001 owner roles, IG-002 canonical profile ownership, IG-003–007
personal memories/profile/history, IG-008 venue metrics and IG-009 portability
already exist. IG-014 supplies private creation, member invitations/RSVP and
room permissions. Reuse its host panel, RSVP enum, translations, eligibility,
gathering locks and capacity trigger. Guest records cannot become attendees,
auth users, beta members or gain chat/checklist/profile/media/history access.

One 256-bit random bearer link per guest; SHA-256 hash only in a non-exposed
private table, no raw-token retrieval. Links use a URL fragment, never query or
path tokens. Hosts create, list responses/expiry and revoke; a lost link requires
revocation/replacement. Expiry is 1/3/7 days capped at gathering start. Guest
Going seats count alongside host/member attendance only while invitation active.
Revocation/expiry release capacity. All capacity writers lock the same gathering.

Generic guest page/link preview. Explicit 18+ self-attestation before private
details; no DOB/account collection, no claim of identity verification. Minimum
event details and own response only. Name required for RSVP; Going/Maybe/Declined
reuse existing semantics. Bearer possession permits viewing/editing that one
guest response; forwarding and known blocked people are host responsibilities
because temporary guests have no verified identity. Host can revoke immediately.

Server-only guest RPC access; anon/authenticated cannot read guest rows or invoke
guest RPC. Same-origin POST, bounded request body, no-store/no-referrer/noindex,
generic invalid/expired/revoked/closed error. Persistent global and token limits;
optional trusted proxy IP limit requires owner-confirmed ingress header stripping.
Host creation limits are database enforced. No external message delivery.

Acceptance: real disposable migration/RLS/RPC/rollback/capacity/expiry/grants
checks; server boundary/rate tests; FA/RTL and English mobile guest interactions;
typecheck, focused lint, build. Record independent-connection race and staging
acceptance as owner release actions if unavailable locally. Never claim release.
