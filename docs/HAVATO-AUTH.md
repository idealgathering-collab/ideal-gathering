# Havato authentication — Phase 5.1

## Implemented contract

Consumer/signup confirmation resends use auth.resend(type=signup) with the existing /auth callback and safe destination. Venue signup now also returns through /auth, retaining /venue/register as its destination; role/beta/invitation gates remain authoritative.

Confirmation errors in query/fragment produce explicit invalid/expired UI and a resend form. A callback cannot be validated using an unrelated cached session. Callback credentials are removed from the address bar. Google remains on the existing configurable Supabase/Lovable adapter; no provider credentials were changed.

Recovery requests on /auth and /admin/auth use a dedicated PKCE client with storage key havato-password-recovery, separate from the normal session. /reset-password exchanges the one-time code, requires the SDK's saved recovery redirect type, then keeps a memory-only grant bound to identity, token and expiry (maximum fifteen minutes). No existing session or SIGNED_IN event grants password-reset access. Successful save consumes the grant and signs out. Failed logout is reported independently.

Open a recovery link in the same browser used to request it, with browser storage available. A new request may supersede an earlier link. Reloading after a consumed/cleaned link requires a new request. Old implicit-fragment recovery links deliberately fail closed and offer a new request. Standard Supabase ConfirmationURL email templates support the requested PKCE flow; custom templates must be inspected and tested. No custom token_hash verification callback is introduced.

The 60-second resend cooldown is UX protection; Supabase server rate limits remain authoritative. Provider responses are not displayed by resend. Successful API response does not prove email delivery or reveal whether an account exists.

## Source audit versus live evidence — 2026-10-10

- GitHub havato head: 755a9ed024f9672dffe5afaea46d109ae899ac49.
- publicSupabaseConfig validates public URL/key and rejects service-role/secret keys; oauthProvider defaults to supabase and explicitly supports lovable.
- Google forwards the same-origin /auth return URL. Existing adapter unit tests cover both providers and failure.
- Email sign-in uses signInWithPassword; signup uses the existing waitlist/identity helper and triggers. No beta-access or verification enforcement was relaxed.
- supabase/config.toml contains project_id only. It does not provide evidence of hosted provider, redirect, confirmation, SMTP or credential state.
- The connected Supabase API confirms project ntmnpmdjfrbporcvafei is named havato, ACTIVE_HEALTHY, in eu-central-1. Only this project was audited.
- Live GET /auth/v1/settings returned HTTP 200: external.google=false, external.email=true, disable_signup=false, mailer_autoconfirm=false. Email/signup are enabled and email confirmation is required. This does not prove successful sign-in or delivery.
- Live Google authorize returned HTTP 400, validation_failed: "Unsupported provider: provider is not enabled". Google being disabled is a current confirmed blocker.
- Deliberately invalid-token verification requests, with redirect following disabled, returned HTTP 303 with otp_expired to http://localhost:3000/ for all three Havato targets below. Signup confirmation also fell back to localhost. No real token, email or account was consumed/modified.

| Requested recovery callback | Observed redirect origin/path |
| --- | --- |
| https://havato-test.darkube.ir/auth?mode=signin | http://localhost:3000/ |
| https://havato-test.darkube.ir/auth?mode=signin&redirect=%2Fvenue%2Fregister | http://localhost:3000/ |
| https://havato-test.darkube.ir/reset-password | http://localhost:3000/ |
| https://example.invalid/havato-auth-audit (negative control) | http://localhost:3000/ |

The requested mode/destination were lost. This behavior indicates a Site URL/redirect allowlist mismatch; the complete hosted site_url and uri_allow_list were not directly read. The connector exposes project/keys/logs/SQL/docs but no Auth-configuration getter/editor; the dashboard did not load configuration controls. No SQL workaround or private-token extraction was used. A read-only network permission path succeeded after sandbox DNS failed. Public project keys were used only for these requests and are not recorded here.

- No real account, email delivery, confirmation consumption, recovery email, password update or Google OAuth round trip was tested. Synthetic SDK transport tests are not hosted verification.

## Manual provider and credential checks

Use the Havato project only; first verify its project reference. Do not open or modify Ideal Gathering production.

1. Verify deployed public Supabase URL/key identify Havato and VITE_OAUTH_PROVIDER selects the intended provider. Keep private credentials in provider/deployment secret stores, never in chat, GitHub or browser assets.
2. Correct Havato URL Configuration: set Site URL to https://havato-test.darkube.ir for this deployment; allow /auth with its actual mode/destination/language/invite query variants and /reset-password. Retest the three targets above: they must remain on the intended Havato route, while the negative control must be rejected/fall back to Havato. Include only intended local/review origins. Inspect full hosted values before changing them. Follow [Supabase redirect configuration](https://supabase.com/docs/guides/auth/redirect-urls), which recommends exact production paths; verify matching rather than assuming a wildcard works.
3. Email/signup enablement and confirmation requirement were observed. SMTP sender/domain/credentials, templates and delivery remain unverified. Inspect confirmation/recovery templates: they must follow the supplied RedirectTo/ConfirmationURL, preserve PKCE code behavior and avoid redirecting to idealgathering.com. Check resend/recovery rate limits, expiry and delivery logs using a designated test mailbox. The June 2026 [default-SMTP/free-tier template change](https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier) may affect custom-template availability; this project's plan and SMTP configuration were not read, so applicability is unknown.
4. For direct Supabase Google OAuth, enable Google with the owner's OAuth client ID/secret; in Google Cloud authorize https://ntmnpmdjfrbporcvafei.supabase.co/auth/v1/callback after verifying the project reference. Check consent-screen publication/test-user access and authorized app origins. For Lovable mode, inspect that broker's configuration instead. A secret cannot be inferred from repository code or unit tests.
5. On an authorized test/review build, test signup → delivered confirmation → same account/pending or intended destination; resend, reused/expired/invalid confirmation; password sign-in and unconfirmed-account error; Google sign-in → correct Havato callback → correct role/beta destination.
6. Request recovery from the new build, open the delivered link in the same browser, save a password, and confirm sign-out/new-password sign-in. Test a fresh browser and an ordinary pre-existing session without a link: neither should enable the reset form. Test expired/reused links and provider failures. Record exact origin/project/build/date and results. Real password entry/change should be completed by the account owner.

Credential configuration and real-account acceptance steps remain pending. The available connector cannot enable Google or edit the redirect allowlist; these require the owner/dashboard or a supported Auth-management connection. Do not merge or deploy this PR without user approval; configuration changes are not silently bundled with code review.

## Automated verification

The Havato authentication review workflow uses dummy backend settings, frozen dependencies, mocked SDK HTTP, and synthetic DOM fixtures. It runs auth/OAuth/signup regressions, TypeScript, focused lint and the full Linux build. It sends no emails and does not contact a real backend. Existing public review CI and portable CI also run on the PR. No migrations or deployment jobs are added.
