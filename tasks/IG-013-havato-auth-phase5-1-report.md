# IG-013 — Phase 5.1 implementation and verification

Date: 2026-10-10 (Asia/Tehran). Review PR: [#16](https://github.com/idealgathering-collab/ideal-gathering/pull/16), base havato only.
Baseline: 755a9ed024f9672dffe5afaea46d109ae899ac49.
Initial implementation: 9c41816befdd182482e96ca2a6b9b058bba4639f. A follow-up localizes the expired-grant toast and records this evidence.

## Outcome

Code implemented and reviewable; hosted acceptance remains pending. Confirmation resend, query/fragment invalid/expired handling, safe callback cleanup and an isolated PKCE recovery grant replace authorization from any existing session. Owner/admin recovery and venue confirmation use the shared contracts. No schema/migration/RLS/backend setting change, merge or deployment. idealgathering.com was untouched.

## Changed files and purpose

- auth.tsx, reset-password.tsx, admin.auth.tsx and venue.auth.tsx: wire explicit link states, resend, recovery-only requests/save and shared venue confirmation callback. Existing role/beta/invitation rules remain authoritative.
- auth-link-state.ts and confirmation-link.ts: classify errors, remove callback secrets and reject an unrelated cached session as confirmation evidence.
- password-recovery.ts and integrations/supabase/recovery.ts: dedicated PKCE storage/client, fresh recovery exchange, identity/token/expiry binding, replay deduplication, stale-exchange and concurrent-update guards, successful-grant consumption and logout status.
- resend-confirmation.tsx, i18n/auth.ts and i18n/index.tsx: editable validated email, neutral response, cooldown, error/retry states and EN/FA/RU copy using existing controls.
- Three focused test files and havato-auth-review.yml: authorization/SDK transport, callback and real-component DOM coverage; Linux frozen-install/typecheck/lint/build verification with dummy backend only.
- HAVATO-AUTH.md, task scope, report and current.md: observed source audit, exact results and manual provider/credential acceptance steps.

## Checks actually run

Local source preparation did not clone. 569 files from the older local checkout matched the current GitHub tree by Git blob hash; only tasks/current.md required its exact current API content. Dependencies were reused locally (not a fresh frozen install). Published file blobs were checked against local hashes. Generated routeTree, lockfiles and AGENTS.md are unchanged.

Local focused command: bun run test -- tests/unit/auth-controls.ui.test.ts tests/unit/password-recovery.test.ts tests/unit/confirmation-link.test.ts tests/unit/oauth-config.test.ts tests/unit/havato-phase3.test.ts tests/unit/waiting-registration.test.ts, with HAVATO_TEST_JSDOM pointing to the existing jsdom fixture runtime. Result: 54 passed across six files. The real SDK test uses fake HTTP and checks the recovery PKCE challenge/verifier, not a live service. DOM tests mount the actual reset/auth/resend controls with synthetic boundaries.

Local node node_modules/typescript/bin/tsc --noEmit: pass. Focused ESLint on all changed app/test TS/TSX files with the inherited formatting rule disabled: zero errors; two existing Fast Refresh warnings in i18n/index.tsx. New helper/component/test files were formatted. Full repository lint was not rerun or claimed clean.

Initial local Vitest attempt failed before tests because its sandbox temp-cache rename returned EPERM. Retrying with TEMP/TMP in this writable workspace passed. Directory-junction preparation was denied; ordinary copying succeeded. Neither required elevation or an approval retry.

Local node node_modules/vite/bin/vite.js build with dummy backend: client and SSR compilation pass; final Nitro packaging fails with EPERM realpath on node_modules/tslib/modules/package.json. This is the Windows packaging failure recorded in earlier reports; the Linux full build below passes. No production secret was used.

## GitHub CI at initial implementation

| Workflow | Result | Evidence |
| --- | --- | --- |
| Havato authentication review | PASS — frozen install, 54 tests, typecheck, focused lint, full production build | [run 38000068623](https://github.com/idealgathering-collab/ideal-gathering/actions/runs/38000068623) |
| Havato public-site review | PASS | [run 38000068536](https://github.com/idealgathering-collab/ideal-gathering/actions/runs/38000068536) |
| Portable Node build | FAIL at inherited full-suite tests; later steps skipped | [run 38000068607](https://github.com/idealgathering-collab/ideal-gathering/actions/runs/38000068607) |

Portable suite: 449 passed, 16 failed, 20 skipped. Failures: life-profile 4, life-summary 4, member-profile 2, venue-value 6; these tests assert English while the unchanged language provider initially renders Farsi. Focused auth/OAuth/signup tests passed. Auth DOM fixtures are deliberately enabled in the auth workflow; their nine cases are among the skipped tests in the general workflow without its fixture variable.

Fresh baseline check ran those four unchanged rendering files in the verified original application checkout using the same local dependencies: 16 failed, 13 passed. All sixteen failure names/counts match CI and earlier reports. No unrelated profile/dashboard test repair or language-default change was bundled into this auth PR.

## Provider audit and exact remaining blockers

No connected Supabase integration was available. Plugin discovery found an optional Supabase connection; it remains unconnected. Browser inventory had no existing signed-in dashboard. A direct Havato project authentication dashboard load and one reload did not load settings controls; the prolonged-loading notice was observed. No current provider or redirect values were obtained. Source config has only project_id, not hosted auth settings. Google being disabled in an earlier Phase 3 report is historical, not current verification.

The code and tests do not prove real Google OAuth, email/password sign-in, email delivery, confirmation consumption, SMTP/templates, or a real password-recovery round trip. No specific live configuration defect is confirmed. [The runbook](../docs/HAVATO-AUTH.md) lists Havato-only project identity, redirect/Site URL, Google Cloud callback/client secret, email-confirmation/SMTP/template, expiry/rate-limit and dedicated-account acceptance checks. Keep credentials in the service's secret UI; do not paste them into chat or commit them.

Old implicit recovery links intentionally require a new request; PKCE links must be opened in the requesting browser. Custom email templates and actual redirect matching must be checked before rollout. Browser storage is required. Real password entry/change is an account-owner action. Responsive physical-device and real hosted-provider acceptance are not claimed by synthetic DOM tests.

## Next action and release state

Review PR #16, resolve the inherited general-test debt separately, and complete the documented hosted checks once Havato dashboard/integration access and a designated test account are available. Do not call Phase 5.1 live-verified until those results are observed. Nothing is merged/deployed, and there is no database rollout. User approval is still required before any merge or deployment.
