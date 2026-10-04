# IG-012 — Havato legal, privacy, and trust cleanup

Status: Approved / in progress
Owner: product owner
Approval: User request in this chat on 2026-10-04 explicitly approves the 16
Phase 2 requirements and validation, continuing draft PR #15. Follow-up: remove
email addresses for now; update later. No merge or deployment authorized.
Branch: codex/havato-public-polish-phase1
Evidence baseline: ce42df567030679512ef4a8648b1c6bcb4f890b4
Dependencies: IG-011 public polish.

## Objective and user problem
Replace legacy legal copy and cosmic layout with serious Havato FA/EN documents
that describe controlled early access and observed product/data practices.
Iran-first, possible Canada; no invented entity, mailbox, exclusive jurisdiction,
payment service, or claim that staged tools are already universally available.

## Existing implementation
Terms/Privacy routes use old public chrome and dictionary prose with an Armenian
law clause, legacy contact domain, and overbroad immediate deletion promise.
Privacy metadata carries the same regional leftover in EN/RU/FA.
Existing Terms and profile DOB validator specify 18+; signup lacks an age gate.
Settings calls delete-own-account; complete deployed cascade/retention is unverified.
Supabase handles auth/database/storage; rooms handle messages/checklists; personal
moments support notes/photos/visibility; reports/blocks and venue fields exist.
Homepage expenses are staged; no inspected money transfer implementation.
Geocoding/maps and push infrastructure exist. Exact provider processing regions,
retention schedule, registered operator and postal address are unconfirmed.

## Requirements, UX and acceptance
- Keep /terms and /privacy, default FA/RTL and EN switch, Phase 1 header/footer,
  approved logo/fonts/palette. Readable sections, linked contents, document switch.
- Describe data categories conditionally by enabled access stage; name Supabase,
  disclose providers and possible cross-border processing without overclaiming.
- Preserve 18+ consistently; report registration enforcement as a launch decision.
- Moderate conduct, public/venue vs private/home precautions, realistic disclaimers,
  expense recording only, local mandatory rights and no exclusive country forum.
- No public emails per owner's follow-up. Empty configurable legal details, truthful
  contact limitation and settings deletion link; public privacy/list-removal channel
  remains a launch gap. Do not imply an operational channel or invent an address.
- Audit legal metadata, obsolete legal dictionaries, public/footer contact links,
  and trust copy. All internal public navigation must target existing routes/anchors.
- Validate actual components in Chromium FA/EN at desktop/mobile sizes and check
  language switching, anchors, menus, consent navigation and hidden member entry.

## Data, privacy and boundaries
No data writes or schema/migration changes. No backend, auth route/logic, user or
venue account, waitlist contract, PWA/install, infrastructure/dependency/hosting
change. No hosted fixtures, merge, deployment or idealgathering.com access.
Only review CI may be extended for legal lint/tests/SSR; it has no deploy step.

## Technical checks
Relevant Vitest units, TypeScript noEmit, changed-file ESLint, production preview,
Linux frozen-lockfile production build and candidate route smoke in review CI.
Record existing formatting/full-suite failures independently; do not invent passes.

## Execution checkpoints
Start: exact published Phase 1 tree exported to an isolated local checkout; local
clone unavailable under Windows sandbox, so archive plus baseline Git snapshot.
Cached dependencies copied without changing declarations/lockfiles.
Scope approved by the explicit user request; no additional scope confirmation needed.
Next: implement documents/configuration, verify local visuals/checks, publish only
the existing draft branch, and record review/launch decisions separately.
