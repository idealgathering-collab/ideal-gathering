# IG-013 — Havato Phase 5.1 authentication

Status: Implemented and CI verified; review pending; hosted acceptance blocked by observed Google disablement and localhost callback fallback
Owner: repository owner
Approval: user request in this chat, 2026-10-10, explicitly authorizes the following bounded implementation, focused tests, provider audit where access exists and a reviewable PR.
Branch: codex/havato-auth-phase5-1
Evidence baseline: 755a9ed024f9672dffe5afaea46d109ae899ac49 on havato, verified through the connected GitHub API.
Dependencies: existing signup/waitlist, invitation, role and beta gates.

## Objective and observed problem
Finish resend-confirmation and explicit email/recovery link states; prevent a stored ordinary session from authorizing password reset. The existing reset page accepted getSession or SIGNED_IN. Signup confirmation had no resend control. Auth callbacks had no explicit invalid/expired state.

## Requirements and UX
- Reuse existing auth/reset routes and controls, EN/FA/RTL and RU translations.
- Resend a signup confirmation to an editable validated email; preserve safe callback destinations; show a neutral result and sixty-second cooldown, including provider/rate-limit failure.
- Recognize provider error codes in query or fragment. Invalid/expired confirmation must remain visible even when already signed in. Remove callback credentials from the address bar.
- Use a dedicated Supabase PKCE client and storage namespace for recovery. Only a fresh code exchange with the SDK's saved recovery verifier grants access. Existing sessions, implicit recovery markers, wrong-purpose codes, changed identities/tokens and expired grants fail closed.
- Bound authorization to the session expiry or fifteen minutes. Serialize updates, allow retry after network/update failure, consume authorization on success and sign out. Report logout failure separately from password-save success.
- Consumer and owner/admin recovery requests use this flow. Venue confirmation returns through the shared handler with its registration destination.
- Older implicit recovery emails require a new link; open new links in the browser that requested them. No email-template change is required for standard Supabase ConfirmationURL templates, but the hosted template must be checked.

## Data, privacy and exclusions
No database/schema/RLS/migration/type-generation change. Dedicated recovery tokens/verifier remain in browser storage under havato-password-recovery; the authorization grant is memory-only and never inferred from persisted state. No credentials or user records enter repository files. No hosted fixtures, provider-setting mutations, real emails, real password changes, merge or deployment are authorized by this implementation. idealgathering.com is excluded.

## Acceptance and checks
Synthetic unit/SDK transport and real-component DOM checks cover authorization, session replacement, expiry, replay, stale exchange, update retry, provider failure, cooldown and route behavior. Run the focused auth workflow, existing OAuth/signup regressions, TypeScript, focused ESLint and a supported-platform build. Hosted Google/email acceptance is a separate requirement and must not be inferred from fixtures.

## Checkpoint
Application source was reconstructed from 569 local files whose Git blob hashes match the API tree; the sole unmatched file, tasks/current.md, came from the API. No clone or local-history assumption was used. Local 54 focused checks and TypeScript pass; focused lint has zero errors and two pre-existing Fast Refresh warnings. Final Windows packaging failed after compilation; exact error and Linux result will be recorded in the report. PR is required before review; no merge/deploy.

See [verification report](IG-013-havato-auth-phase5-1-report.md) and [configuration and acceptance runbook](../docs/HAVATO-AUTH.md). Authentication/public review Linux CI pass; general CI retains sixteen reproduced baseline rendering failures. PR #16 is draft; hosted acceptance remains pending.

Connected Supabase audit (2026-10-10): project identity/health verified; live email/signup flags and confirmation requirement observed. Google authorize fails because the provider is disabled. Invalid-token confirmation/recovery error callbacks fall back to localhost rather than Havato. The connector does not expose Auth-configuration read/write; owner configuration and real-account acceptance are still required. No hosted configuration or account changes were made.
