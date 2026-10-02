# Havato Phase 3 — registration, waiting and activation

Approved by the user's explicit five-step request on 2026-10-02. Branch: `havato`; baseline `77ec3914572458a93ff9d6ff972df0925c40ca19`.

1. Diagnose live Google OAuth; fix it or record one exact external configuration blocker. Preserve password auth.
2. Allow public account registration through existing Supabase Auth and waitlist, retain the same identity/session, show bilingual closed-beta waiting, preserve product gates.
3. Preserve existing invitation redemption, onboarding and launch controls; verify the same account advances to product without re-registration.
4. Verify existing venue registration, pending, approval and dashboard gates. Fix only flow defects.
5. Focused isolated/live verification, publish to havato, verify Darkube. Do not claim complete with unresolved OAuth or journey acceptance blockers.

No Ideal Gathering production/backend access, second auth system, theme/PWA changes, unrelated refactor, push notifications, payments, native packaging or Phase 4.

User steering, 2026-10-02: finish Phase 3 core registration/waiting/activation/venue checks first, then return to Google. Google remains tracked separately and unresolved; this does not constitute confirmed Google acceptance.

## Step 1 checkpoint

Live auth page HTTP 200. Deployed client uses `https://ntmnpmdjfrbporcvafei.supabase.co`; deployed OAuth code calls direct Supabase Google OAuth. Read-only authorize request with provider=google and redirect_to=https://havato-test.darkube.ir returns HTTP 400, validation_failed, "Unsupported provider: provider is not enabled". This fails before Google authorization and does not establish a Google redirect mismatch.

External blocker: configure and enable Google in this Havato project's Auth providers using the owner's legitimate Google web OAuth client ID/secret. Required Google redirect URI: `https://ntmnpmdjfrbporcvafei.supabase.co/auth/v1/callback`; authorized JavaScript origin: `https://havato-test.darkube.ir`. Supabase Site URL: `https://havato-test.darkube.ir`; allow root and `https://havato-test.darkube.ir/auth**` for the existing app callback. Credentials, Google consent/test audience and actual console URL settings remain unverified. Do not invent credentials or change another Supabase project.

Browser console access timed out twice including recovery; no Supabase management connector is available. No provider settings changed. Step 1 has a precise external blocker, permitting the remaining authorized steps to proceed; Phase 3 remains INCOMPLETE.

## Core implementation checkpoint

Step 2: public landing links to existing account signup. Invitation is optional at registration (invalid provided invitations still rejected). Signup inserts into existing email-unique waitlist and creates exactly one Supabase Auth identity; Auth's existing trigger creates its profile. No manual profile insert. Existing waitlist-only form remains available. Confirmation-required signup shows a persistent bilingual message; sign-in keeps existing password auth. New closed-beta accounts route directly to pending, with bilingual beta-closed/same-account copy, optional onboarding and invite entry. Product/venue backend policies and launch flags unchanged.

Step 3: email/OAuth return URL goes to the existing auth completion page, which already redeems remembered invites for the existing session. Signed-in users entering invitation flow reuse the account; no second signup. Existing launch gate remains authoritative: invitation/approval does not bypass beta closure. When launch opens, unready users complete onboarding; ready accounts enter product. Existing accounts/status data are not backfilled or mutated.

Step 4: existing venue signup/submission/approval/dashboard flow retained; persistent email-confirmation feedback added, registration heading/explanation localized FA/EN. Pending/approved venues remain blocked while launch is closed; approved venues enter existing dashboard after launch. Dashboard not redesigned. No database migrations or live writes.

Checks: 36 tests pass across havato-phase3, waiting-registration, havato-waitlist, oauth-config and venue-beta-corrections; 17 native PWA/install/worker tests pass. TypeScript noEmit and focused ESLint (existing prettier rule disabled) pass, including new helpers/tests and changed auth/pending/venue files. Diff check passes. Unit journey tests execute existing access/gate/invitation helpers against intercepted backend responses, not hosted SQL/Auth. Signup tests confirm one identity call, email-unique waitlist reuse, no profile insertion, session-required/confirmation responses and failures.

Initial Vitest run failed at Windows temp-cache rename (no tests ran); workspace-local temp retry passed. Local build compiled browser/server modules, but final Nitro packaging failed with Windows EPERM realpath on node_modules/tslib/modules/index.js. Linux container CI must confirm build. Isolated browser E2E harness prepared but did not run journeys: Edge crashed at startup in the restricted Windows execution context. Browser-control tool repeatedly timed out even on inventory/recovery. No visual, real-account, email-link delivery, backend approval or full-browser persistence journey success is claimed. Deployment/live verification pending. Core Phase 3 remains INCOMPLETE until required acceptance checks are confirmed; Google is deferred by user's latest instruction.
