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

## Published implementation — acceptance still blocked

Published `c6fed64cbe181b7151c8fa66306b977f0e7fb176` to havato by connected GitHub API, non-forced fast-forward from baseline. Published tree `bd950d0b05e2dbd4d86b10ef2ea15dec96af28c7` exactly matches reviewed local tree; unpublished local commits 8bd244f/c291a38 were reconciled to identical remote content. Native Git credential-helper execution is blocked in this Windows sandbox. No production branch updated.

[Exact-commit Linux container build/startup](https://github.com/idealgathering-collab/ideal-gathering/actions/runs/37029624830) completed successfully at 2026-10-02 15:49:37 UTC. This resolves the platform-specific local packaging check. Final locale resolver typecheck passes; focused locale lint has zero errors and the same two existing Fast Refresh warnings. Application PWA assets/install/offline/session code unchanged.

Read-only live Auth settings confirm Google disabled, email enabled, public signup enabled, email confirmation required. Actual console credentials, site URL/redirect allowlist, email delivery and hosted account journeys remain unverified. Latest core-first instruction means Google must remain deferred until core acceptance closes.

Live https://havato-test.darkube.ir returns HTTP 200, but checks through 2026-10-02 15:56 UTC still show the old auth-CannA3aA.js bundle and no new public signup link. Darkube automatic rollout is therefore NOT CONFIRMED; exact-commit console build status unavailable because browser access failed. Do not equate GitHub CI success with Darkube deployment.

Browser E2E remains NOT RUN. A second official Chromium runtime attempt downloaded successfully but extraction failed with Windows EPERM realpath in the workspace; automatic download retry stopped. Local Vite servers start but cross-command localhost checks time out in this restricted environment. No account/backend data was written. Prepared browser harness is scratch only and not committed as a passing test. Isolated unit flow evidence is not a complete hosted journey.

Next: verify Darkube deployed c6fed64 (or documentation descendant with identical app code), verify new live public signup/waiting UI; run isolated actual-browser signup/email-confirmation/sign-in/waiting/same-account invitation/activation and venue submission/approval/dashboard checks in a working browser environment. Confirm live email redirect/delivery safely on Havato. Mark core complete only after those checks; then return to Google provider setup. Phase 3 remains INCOMPLETE. Stop before Phase 4.
