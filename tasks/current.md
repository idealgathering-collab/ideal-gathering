# Current task — IG-016 Havato Phase 6.3 coordination, review-ready

User authorized 2026-10-11: audit/reuse then responsibilities, shared notes and
expense splitting on existing draft PR #17; target havato. Baseline ba83b382.
[Approved scope](completed/IG-016-havato-phase6-coordination.md) ·
[Implementation, tests and release blockers](completed/IG-016-havato-phase6-coordination-report.md).
Checklist-integrated host assignments/volunteering/completion, versioned notes,
host-managed integer equal expense splits/balances and explicit per-record Going
guest sharing implemented. No guest roster/chat/expense/profile/memory permissions.
Local 74-migration replay/306 DB checks, 126 focused tests, typecheck/build and
focused lint (zero errors/three existing local warnings) pass. Eight synthetic
FA/EN host/member mobile/desktop layouts: correct direction/no overflow or console
errors. Implementation 952985993fddd817d937ed85a54940cc75a1345f passes Linux Phase 6
review (38088345634) and public review (38088345752); logs inspected. General Linux
CI (38088345674): 471 passed/16 same baseline rendering failures/34 skipped; later
general build/smoke steps skipped, not passed. Next: review draft PR and separately
approve designated staging migration/advisors/cache/types, real mobile flows,
separate-connection races and ingress/retention review. Migration unapplied to all hosted targets.
PR #16/Phase 5 excluded. No merge/deploy/hosted writes or idealgathering.com access.

---
# Historical — IG-015 Havato Phase 6.2 guest invitations, review-ready

User explicitly authorized 2026-10-10: remaining external/private invitation links,
account-free guest RSVP and host management. Extend draft PR #17 on
codex/havato-phase6-private-gatherings, targeting havato; PR #16/Phase 5 excluded.
[Scope](IG-015-havato-phase6-guest-invitations.md) ·
[Implementation, validation and owner release actions](IG-015-havato-phase6-guest-invitations-report.md).
Audited/reused IG-014 and IG-001–009. Guest capabilities are separate from member
attendance/permissions. Hashed 256-bit tokens, expiry/revocation, 18+ attestation,
Going/Maybe/Declined, combined capacity, privacy/grants, persistent quotas and
FA/EN mobile guest/host controls implemented. 73 migrations replayed locally;
179 DB checks, 98 focused tests, typecheck, focused lint and production build pass.
Execution-time expiry correction adds two regressions; no hosted migration was rewritten. Eight synthetic browser layouts verified. Local dependencies reused; Linux frozen
install/review CI passes at final implementation f25d769d34364571ef985a546296d5faf5d87fd5
(run 38084597078); public-site review passes too (38084597137). General CI: 452 passed/
16 documented baseline failures/25 skipped (38084597411). Built-server guest HTTP smoke:
20 passing. A final documentation-only checkpoint records these exact-head results.
No hosted application, merge/deployment,
external messaging or idealgathering.com access. Next: review guest capability
contract and approve designated staging checks/migrations separately before release.

---
# Historical checkpoint — IG-014 Havato Phase 6, first increment review-ready

User-authorized 2026-10-10: Phase 6 precedes Phase 5; audit and incremental implementation.
Branch codex/havato-phase6-private-gatherings; base havato 755a9ed024f9672dffe5afaea46d109ae899ac49.
[Draft PR #17](https://github.com/idealgathering-collab/ideal-gathering/pull/17) targets havato.
[Bounded scope](IG-014-havato-phase6.md) · [Audit](../docs/HAVATO-PHASE6-AUDIT.md) · [Report/checks/gaps](IG-014-havato-phase6-report.md).
Private creation, member invitations/inbox/Going-Maybe-Declined, revocation, reuse of
existing room/checklist/history, private projections and durable memory privacy implemented.
Existing admin approval, beta/email gates and 18+ preserved. No auth/provider edits.
74 focused unit/DOM checks, 84 disposable PostgreSQL/schema checks after 72-migration
replay, TypeScript, focused lint (zero errors/two existing i18n warnings), Windows
production build and 12 FA/EN fixture layouts pass. Dedicated Linux review CI added.
Linux Phase 6 and public-site CI pass at implementation commit b17b868. General CI
has 16 FA-default/English-expectation failures, freshly reproduced on unchanged base.
Whole Phase 6 remains incomplete: expenses/assignments/shared album, external invites,
host lifecycle UX and real staging/provider/concurrency acceptance are documented gaps.
Next: review draft PR, inspect designated Havato staging ledger and perform recorded
acceptance before any separately approved migration/release. PR #16 stays unmerged;
Phase 5 deferred. No hosted changes, merge/deploy or idealgathering.com operations.

---
# Current task — IG-012 Havato legal/trust Phase 2, review ready

User-authorized 2026-10-04. [Scope](completed/IG-012-havato-legal-trust.md) ·
[Report and launch decisions](completed/IG-012-havato-legal-trust-report.md).
Continue draft PR #15 on codex/havato-public-polish-phase1, base havato only.
Validated implementation 46238c708b98b80239c7eba3fe8f75ee1ebbd525.
Terms/Privacy FA/EN, shared legal presentation, neutral operator/configurable
contact, metadata, legacy public copy/footer and truthful safety copy implemented.
24 legal browser layouts/two bilingual interaction groups, 35 focused units,
35 PWA checks, TypeScript and focused lint pass. Linux review CI 37211617366
passes frozen install, full production build and candidate legal/auth/PWA SSR smoke.
Inherited full-suite CI still has 16 existing rendering failures; global lint debt
remains. User requested no public email addresses yet: monitored privacy/list
deletion channel and verified operator/postal details remain launch decisions.
Existing 18+ preserved; signup enforcement and regional legal/provider/retention
review remain before broad launch. No backend/schema/waitlist/auth/account/PWA/
infrastructure changes. Do not merge/deploy or touch idealgathering.com.
Next: review Phase 2 visuals/content and resolve launch decisions before Phase 3.

---
# Current task — IG-011 Havato public-site polish Phase 1, review pending

User-authorized 2026-10-04. Branch `codex/havato-public-polish-phase1`,
base `havato` at d69e6954104b3c39dad393fe5c278a2960934ad7.
[Approved scope](completed/IG-011-havato-public-polish.md) ·
[Implementation/checks](completed/IG-011-havato-public-polish-report.md).
Desktop scale, FA/EN Early Access, restored/rebranded story, shared public
navigation/footer, grouped venue access, hidden member entry flag and decorative
clickability cleanup implemented. 36 browser layouts/eight interaction groups,
9 focused units, 35 PWA checks, typecheck and changed-component lint pass.
Focused Linux CI 37208769543 passes frozen install, full production build and
candidate home/story/member/venue auth/PWA SSR checks at `43dd1115`.
Inherited full-suite CI retains the documented 16 rendering failures; global lint
errors remain. [Draft PR #15](https://github.com/idealgathering-collab/ideal-gathering/pull/15)
targets Havato only. Do not merge/deploy. No backend/schema/auth/legal content/
PWA/hosting changes. Next: review Phase 1 visuals, content and PR.

---
# Historical — Havato prelaunch account links COMPLETE

User-authorized 2026-10-04 small homepage follow-up on `havato`.
Implementation `ff53f83693ccabd74d5e9083c46cbd1350987686` published and live.
Both consumer account links removed from the FA/EN homepage until launch.
Focused lint and exact-commit Linux CI/container/startup pass. Darkube build
`e766c874-dbb4-45df-9111-508b5a73b355` deploy OK, app healthy; live FA/EN
at 1280 and 390 widths contain zero consumer auth links. No backend, schema,
configuration or idealgathering.com changes.
[Scope and verification](completed/HAVATO-prelaunch-account-links.md).
Next: restore account entry links as part of a separately approved launch.

---
# Current task — IG-010 Havato homepage implemented

User-approved reference homepage on `havato-home-reference`, baseline 9ed2316.
[Completed scope](completed/IG-010-havato-home.md) · [Verification](completed/IG-010-havato-home-report.md).
Responsive FA/EN home, two use cases, planning strip, trust, activity categories,
FAQ and mobile menu. Exact waitlist helper/insert contract and approved logo
preserved. Four optimized supporting images; install/auth/backend untouched.
14 browser layout configurations and 7 interaction checks pass; 9 focused unit
checks, TypeScript and focused lint pass. Full suite: 415 pass, 16 failures also
reproduced on baseline, 11 skipped. Full lint retains unrelated baseline errors.
Client/SSR compilation passes; Windows Nitro packaging blocked by the recorded
baseline tslib realpath EPERM. Draft review branch only; no merge/deployment or
production writes. Next: review the draft and validate Linux packaging before a
separately authorized Havato release.

---
Current task â€” Havato Notifications Phase 4: final code phase COMPLETE

User-approved Havato-only preferences/controls, baseline `b6746236`, no device
acceptance or Bazaar/TWA/APK work. [Completed scope and exact device checklist](completed/HAVATO-notifications-phase4.md).
Master/four categories, per-user RLS storage, explicit FA/EN push language and
delivery-time gating implemented. 140 unit/DOM, 85 disposable SQL/type/security,
35 PWA/worker/install checks, TypeScript and focused lint pass. Implementation
`2550a5d1bc50459ee026b372724a00c9fbdc5e08` published; exact-tree Linux CI passes
container and stateless startup. Havato-only migration/ledger applied and verified;
RLS/least-privilege grants inspected. Darkube build `20b59a9d-3a5c-4925-8bb4-a463365aae5b`
deploy OK, app healthy, live Phase 4 auth/settings/manifest and actual preference
bundle verified; worker bytes unchanged. Local visual preview unavailable;
Windows Nitro packaging retains known EPERM. Physical mobile/real-provider and
authenticated live preference writes remain in the separate final acceptance.
Stop here: no real push, hosted preference fixtures, device acceptance or packaging.

---
# Historical â€” Havato Notifications Phase 3: code and infrastructure COMPLETE

User-approved Phase 3 only on `havato`.
[Completed scope, verification and rollout](completed/HAVATO-notifications-phase3.md).
Published implementation `856ee1ab` and line-ending preservation `8478e612`.
111 focused unit tests, 38 disposable SQL checks, 35 PWA/worker/install checks,
TypeScript, focused lint and both Linux container/startup CI runs pass.
Havato-only migration applied and ledger recorded; six triggers and service-only
access verified. Darkube build `b06414bf-04d4-4e4f-8939-142dad48ba54` deploy OK,
image `8478e612-b15448`, app healthy. Earlier live HTTP checks confirm Phase 3
server/auth, manifest/worker and disabled test endpoint. Browser sign-in works;
repeat shell checks blocked by local DNS, no repeated full HTTP suite claimed.
Real-device Phase 2/3 acceptance intentionally deferred until code phases complete,
per user instruction. Phase 4 preferences/controls remain; no Phase 4/Bazaar work
started. Stop here.

---
# Historical â€” Havato Notifications Phase 2: infrastructure deployed, real-device acceptance deferred

User-approved 2026-10-03 Notifications Phase 2 only on `havato`, baseline
`8b49c7cde351b10bf30454076e428ec1e824dc21`.
[Exact architecture/configuration/verification checkpoint](HAVATO-notifications-phase2.md).
Server-only self-test sender, VAPID validation, provider egress guard, snapshot-safe
404/410 cleanup, worker display/click and focused tests implemented. Real pair
generated and privately retained encrypted; Havato Darkube runtime/public build
settings saved and public/isolated-backend build arguments read back. Implementation
`278dc99a4470a2611ce5778508661262c8070d3d` published; Linux frozen install, 91 focused
unit checks, 35 PWA checks, typecheck/lint, container and stateless startup pass
(run `37113320146`). Darkube build `90552293-7717-4dd5-bb0a-aa5c4c707f32` succeeded;
`278dc99a-b15448` deployed. Live auth HTTP 200, manifest Havato, worker exact-source
match, and actual served notification bundle contains the matching retained public
key. Three runtime VAPID entries persisted, private half encrypted/masked. Test
endpoint remains disabled without a designated account UUID; observed live
HTTP 404 JSON. VAPID setup is resolved, not an outstanding configuration blocker.
No real browser subscription or end-to-end notification claim: browser app is
signed out. No DB migration/RLS change or Ideal Gathering production work.
Stop before event triggers/preferences/Bazaar. Do not mark Phase 2 complete until
real-provider and observed-device acceptance is recorded.
Precise owner action: sign in to a designated Havato test account in the retained
browser tab; never send passwords/session tokens in chat. Then allowlist that
account with runtime `WEB_PUSH_TEST_USER_IDS` and perform explicit real-device
subscription/self-test/display/click verification. No actual push was sent.

---
# Historical â€” Havato Notifications Phase 1: deployed foundation, VAPID enablement pending at that checkpoint

User-approved 2026-10-03 push foundation only on `havato`, baseline 0a3c8bd.
[Implementation and final verification](HAVATO-notifications-phase1.md) Â· [Architecture, schema and exact env names](../docs/PUSH_NOTIFICATIONS.md).
Implementation cb1aafb7174e7347203f0163320dd969c5a3212a published; exact-commit Linux container/stateless startup CI passed. Darkube confirms cb1aafb7-b15448 healthy/Running. Live desktop/Android emulation: HTTP 200, new notification entry, no initial permission prompt, denied-permission guard, zero installability errors, unchanged worker/icons/manifest/colors, FA/RTL/mobile overflow and offline/reconnect pass. Auth/REST and empty PushManager lookup were fixtures, no real provider subscription claimed.
68 focused unit + 17 PWA + 20 disposable PostgreSQL checks, TypeScript and focused lint pass. Actual reusable component browser fixtures verify subscribe/save, unsubscribe/delete, persistence-failure rollback/retry and FA/RTL. Windows packaging hits pre-existing tslib realpath EPERM; Linux CI resolves build validation.
Signed-in in-app browser recovered. Applied exact additive migration 20261003090000 only to Havato project ntmnpmdjfrbporcvafei and recorded ledger entry. Hosted authenticated-role own CRUD/upsert/multiple-device and cross-user denial checks pass; all synthetic users/endpoints rolled back. Existing account data unaffected. No Ideal Gathering production access or change.
Public VITE_WEB_PUSH_VAPID_PUBLIC_KEY is not configured in Darkube build arguments. Hooks are implemented, and absent config safely disables Enable. No private VAPID pair was generated/configured. Supply the public half of a retained real pair, rebuild and verify actual provider subscribe/unsubscribe before claiming end-to-end push foundation activation. Physical Android/iPhone push remains untested. Stop before sending/event/chat/preferences/analytics/Bazaar work. Notifications Phase 2 remains secure delivery, worker handling and stale-endpoint cleanup.

---
# Current task â€” Havato Phase 3 COMPLETE

[Completed scope and acceptance](completed/HAVATO-phase3.md). User explicitly selected isolated browser fixtures and deferred Google. Published implementation c6fed64cbe181b7151c8fa66306b977f0e7fb176 / documentation head 30949e76aa62f4535a88ca6fb3abfc481daec285: both Linux container/startup checks passed. Live origin now serves Phase 3 auth-2VISgTNA.js and public signup link; previous old-bundle mismatch cleared. Darkube console requires login, so its exact deployed revision is unverified. Live implementation and HTTP 200 confirmed; no app/deployment code change needed.

Actual live Chromium acceptance with intercepted backend responses passed user signup/confirmation/waitlist/sign-in/waiting, blocked Explore/dashboard/create-gathering, same-account invitation and beta gate, onboarding/activated product rendering, venue signup/confirmation/submission/pending/approval-plus-launch/dashboard rendering, FA/EN mobile layout, restored session and live-worker offline/reconnect behavior. No live account/backend writes. Runtime extraction and fixture timing/schema issues were fixed only in workspace test harnesses. Previously passing 36 unit + 17 PWA tests/typecheck/focused lint and Linux builds were preserved; only focused browser acceptance/documentation checks ran this pass.

Accepted fixture limitations: email delivery/link consumption, hosted SQL/RLS/admin approval and physical installs were not repeated. Google is explicitly deferred and unchanged: disabled in Havato Supabase project ntmnpmdjfrbporcvafei. This does not block Phase 3 completion by user decision. No core blocker remains. Phase 3 COMPLETE. Stop here; no Google configuration, Phase 4 or Ideal Gathering production work.
---
# Current task â€” Havato logo presentation COMPLETE

User-authorized 2026-10-02 branding-only cleanup on havato, baseline ca58f01. [Scope and focused verification](completed/HAVATO-logo-presentation.md). Removed continuous logo rotation and old circular crops/tinted footer treatment; approved logo assets, image boxes, theme and all app/PWA behavior retained. 16 branding/config tests and TypeScript pass; focused lint matches six pre-existing owner-page errors. Desktop/mobile waitlist, sign-in, pending/loading and shared header/footer verified locally. Implementation 3db0825e2ab6dd3d5945926ad2bb77af311773e5 published; exact-commit Darkube deployment succeeded and live logo HTML/CSS, desktop/mobile venue/public/shared logos and unchanged approved asset bytes verified. Physical installed-device launch not rerun. Stop here, no Phase 3.

---
# Current task â€” Havato Phase 2 COMPLETE

User-authorized finish pass on `havato` completed 2026-10-02. [Full scope and verification](completed/HAVATO-phase2-finish.md). Approved orange/cream palette applied; Steps 5â€“6 passed with recorded fixture/tooling limits. Implementation af01dbfb4aa2db4d38540fa3bd2f228f2994f6e5 published, Linux container CI passed, Darkube deployed and final live site verified. Entire Chromium reopen and actual v1â†’v2 worker upgrade preserve session/expiry and saved EN/FA/RTL; no auth changes. 17 PWA and 48 focused unit tests plus TypeScript pass; 8 exact baseline lint errors retained. Android physical acceptance relies on user's existing confirmation. Physical iPhone acceptance explicitly waived and accepted as non-blocking residual risk. No production/Supabase changes, push or native packages. Stop here; do not start Phase 3.

---
# Current task â€” Havato PWA Phase 2, Step 4

User-authorized 2026-10-02: iPhone/iOS install setup and focused testing only on `havato`, baseline `6cf68a20757dc8765f712f4f31820b621639bef9`. See [Step 4 scope and verification](HAVATO-pwa-step4.md). Existing iOS controller and Android native install behavior preserved. Added Apple Home Screen metadata and clarified bilingual Safari instructions. Implementation `0b0ba3d0abd7410838e1d3c0cc9f31822ec62b37` published; Linux CI, Darkube auto-deploy and live WebKit EN/FA/standalone plus Android native-eligibility checks pass. Physical iPhone installation/launch remains required. Stop after Step 4; no session persistence, final cross-device checks, color migration, push, backend or production work.

---
# Current task â€” Havato PWA Phase 2, Step 3

User-authorized 2026-10-01: Android installability diagnosis and public install CTA only on havato, baseline e462a85f061d9fb65e24814fe5cda4eabfb0b3c3. See [Step 3 implementation and checks](HAVATO-pwa-step3.md). Small bilingual CTA and early native event capture implemented; 14 focused tests, TypeScript, focused lint and actual component browser checks pass. Manifest/icons and service worker unchanged; no Android manifest blocker found in live HTTP checks. Implementation published as 2992f4b00e6f57a259da99c3f6a1d039daa8234b; Linux container CI passed and Darkube public rollout verified. Live normal Chrome desktop and Android emulation report zero installability errors, emit a real native event, show the CTA and invoke the native prompt once; worker remains active/unchanged. Physical Android WebAPK installation/standalone launch still required; device-specific shortcut cause remains unconfirmed. Next: complete that physical-device check; stop after Step 3.

---

# Current task â€” Havato PWA Phase 2, Step 2

User-authorized 2026-10-01: service worker, safe static caching and offline fallback only on havato. Baseline 40047719c3706eb11f4b1ee612158c608fb21e16; Step 1 live verification passed. See [Step 2 scope and checks](completed/HAVATO-pwa-step2.md). Focused worker and isolated browser checks pass. Publish checkpoint, allow existing Darkube auto-deploy, then verify live registration/offline/reconnect behavior. Stop after Step 2; Step 3 remains Android install/standalone testing.

---

# Current task â€” Havato PWA Phase 2, Step 1

User-authorized 2026-10-01: foundation verification only on havato. See [scope and checks](completed/HAVATO-pwa-step1.md). Manifest/meta colors now match the existing public orange/cream palette; approved icons and launch settings verified. Focused local checks pass. Publish this checkpoint and verify the existing Darkube live manifest/meta/icons. Stop after Step 1; service worker remains Step 2.

---

# Current task â€” Havato desktop landing polish

User-authorized frontend-only polish on havato, based on deployed 4e744a85ee547bcb931442c22e1105b45f0baf65. See [scope and verification](completed/HAVATO-desktop-polish.md). Implementation and focused local visual/CSS checks complete; GitHub publication and existing Darkube auto-deployment verification pending. No backend, assets, copy, routes, or mobile layout changes.

---
# Current task â€” Havato approved logo/icon correction

User-authorized branding-only fix on havato. See [scope and checks](completed/HAVATO-logo-icons.md). Assets prepared; focused checks and existing Darkube deployment verification in progress. Homepage behavior/layout and all production/Supabase settings preserved.

---

# Current task â€” Havato Phase 1

User-authorized Phase 1 only. See [completed Phase 1 and verification](completed/HAVATO-phase1.md). Responsive public waitlist is live on Darkube; implementation 9419ff4, Linux container CI passed, FA/EN and mobile verified. Stop after Phase 1. Preserve all Ideal Gathering production and Supabase settings. Phase 2 has not started.

---

# Current task â€” Havato visible branding correction

User-authorized scope, 2026-09-29: branding only on havato; push for Darkube auto-deployment and verify https://havato-test.darkube.ir. No theme, product behavior, production, or Supabase changes.

Replaced split hardcoded header/footer/auth/venue/admin/owner names with brand.name; retained existing logoAsset. Translation dictionaries now use {brandName} with unchanged language selection/interpolation. SEO titles, descriptions, structured data and gathering fallback metadata use the brand config. Browser/install/share icons use brand.logoUrl, removing the old install icon fallback.

Checks: TypeScript noEmit passes; deployment-config 10 tests and branding metadata 6 tests pass; git diff --check passes. Targeted ESLint with the existing formatting rule disabled reports only 6 pre-existing no-explicit-any errors in owner.$section.tsx and 2 existing Fast Refresh warnings in i18n/index.tsx. Client/server compilation succeeds; local final Nitro packaging blocked by Windows EPERM readlink C:/Users/ASUS. The existing Linux container workflow will verify the pushed commit.

Remaining verification: confirm Linux container CI and Darkube redeployment, then inspect live English/Farsi landing/auth/venue entry pages. Authenticated dashboards have been inspected in source, not claimed as logged-in live checks. Existing historical idealgathering.com story reference and support/legal email remain unchanged; the repository describes its current Havato SVG as provisional. No replacement logo was invented.

---

# Current task â€” Havato deployment

Branch: havato. Full IG001â€“IG009 incorporated without conflicts. [Scope](HAVATO-deployment.md) Â· [Verification and exact blockers](HAVATO-verification.md) Â· [Darkube runbook](../docs/HAVATO-DARKUBE.md).

Local code, database/API tests, production build and Linux stateless container verification pass. Hosted deployment remains pending new Supabase project/password handoff and paid Darkube approval. No Ideal Gathering production changes. Next: finish isolated backend creation, validate fresh-project migration plan, configure real build arguments/runtime secrets, obtain paid-resource approval, then deploy and run hosted journey matrix.

---

# Current task â€” Havato deployment

[Approved scope](HAVATO-deployment.md). Branch: havato. Full IG001â€“IG009 incorporated at 33e3176 by fast-forward. Havato container/branding verification in progress. No production modifications.

---

# Current task â€” IG-009

## Active approved scope
IG-009 â€” Portable Deployment, Staging & Beta Readiness.
Farzin approved the revised scope on 2026-09-27; it supersedes Lovable-first staging.
Branch: codex/ig-009-staging-beta, draft PR #13 stacked on #12.
[Accepted spec](IG-009-staging-beta-readiness.md) Â· [Verification](IG-009-verification.md)
Â· [Deploy/run/env contract](../docs/DEPLOYMENT.md).

Checkpoint: portable implementation published as 0f03e31; Windows and Linux verification pass.
Standard Vite/TanStack Start/Nitro Node build passes on Windows/Node 24.
Copied standalone .output artifact also passes local HTTP smoke outside the repo.
279 unit tests and typecheck pass. Linux CI 36344103468 also passes the portable
Node build/smoke, artifact upload and optional Lovable production build. New/config files lint clean; touched legacy
files retain baseline lint debt (exact comparison in verification).
Supabase public/server settings are explicit; old tracked .env removed. Direct
Supabase OAuth is default, Lovable OAuth/build is optional. Local visual assets
and minimal brand/SEO/manifest/text/theme hooks support a future Havato build.
No dependencies/lockfiles/schema/product rules changed; venue cap stays 2â€“5.
No Lovable credits/editor/remix, production writes, migrations, merge or deployment.
Hosted Auth/email/Storage/maps and full beta journeys are NOT RUN: no isolated
backend/hosting credentials. Local fixture artifact is not a live staging site.
Exact next action: provision empty Supabase plus a separate Node 24 staging host;
set its build/runtime variables, rebuild, deploy complete .output, then execute
the hosted matrix after backend identity checks. No IG-010 or production promotion.
Keep IG-009 active until actual hosted beta validation passes.

---

## Historical record (prior queue authorization and checkpoints)
The deployment exclusions below describe the earlier IG-001â€“008 scope. The active IG-009
spec above governs current staged release work and its production safety gates.

# Current task

## Approval state
The user approved the implementation queue IG-001 through IG-008 on 2026-09-18.

Execute one bounded spec at a time. Approval of the queue does not authorize unrelated refactors, speculative features, production data changes, or deployment. Follow AGENTS.md and each task's explicit scope and acceptance criteria.

## Approved implementation queue

1. [IG-001 â€” Owner Role Foundation â€” complete](completed/IG-001-owner-role-foundation.md)
2. [IG-002 â€” Profile Data Ownership Cleanup â€” complete](completed/IG-002-profile-data-ownership.md)
3. [IG-003 â€” Life Moments Foundation â€” complete](completed/IG-003-life-moments-foundation.md)
4. [IG-004 â€” Completed Gathering to Life Moment â€” complete](completed/IG-004-gathering-to-life-moment.md)
5. [IG-005 â€” Life Profile V1 â€” complete](completed/IG-005-life-profile-v1.md)
6. [IG-006 â€” Other-User Member Profile + Privacy â€” complete](completed/IG-006-public-life-profile.md)
7. [IG-007 â€” Life Summary & Activity Insights V1 â€” complete](completed/IG-007-life-summary-v1.md)
8. [IG-008 â€” Venue Dashboard Value Layer â€” complete](completed/IG-008-venue-dashboard-value-layer.md)

## Implementation queue complete

IG-001 through IG-008 are complete within their accepted implementation scopes.
No next product feature is authorized automatically. Next: review the stacked PRs,
complete supported-platform build and hosted staging validation, then plan release.
Completion here does not mean merged, deployed or production-beta validated.

### IG-008 corrective checkpoint â€” 2026-09-27

User-authorized follow-up on `codex/ig-008-venue-value-layer`, starting at
`14d9330`, in existing draft PR #12, still stacked on IG-007 PR #11.
Both registration and dashboard profile pickers now inherit shared Armenia/Yerevan
behavior. Venue activation has integer 2â€“5 form bounds, defensive payload clamping,
and an origin-specific database CHECK for direct inserts/updates. Physical table
capacity and consumer gathering capacity rules remain unchanged.

- 266 unit/component tests pass, including 16 focused correction tests.
- 120 API tests pass: 16 venue, 53 moments/member/summary, 9 profile, 42 owner/admin.
- 236 native DB checks pass: 65 venue, 61 moments, 21 gathering, 29 profile,
  34 member, 26 summary. Includes consumer capacity preservation and origin-change rejection.
- Typecheck and targeted lint pass; registration retains 14 baseline formatting
  findings (zero warnings), and passes with only the formatting rule disabled.
- Normal build reproduces the existing Lovable Windows routesDir assertion.
- New migration `20260927080000_venue_activation_small_groups.sql` applied only to
  the marked disposable database. NOT VALID preserves historical rows; all new
  inserts/updates are enforced. Historical exceptions need audit before validation;
  editing an existing oversized venue gathering requires correcting its seats.

Exact commands, evidence and rollout limits are in the
[corrective verification](completed/IG-008-verification.md#corrective-checkpoint--2026-09-27).
Next: review this correction in PR #12, then supported-platform build and staging
validation in dependency order. No IG-009, merge, deployment or production mutation.

### IG-008 verification closure â€” 2026-09-27

Complete on `codex/ig-008-venue-value-layer`, based on IG-007 `d56c413` (PR #11).
Implementation `5975fc3` is pushed in draft [PR #12](https://github.com/idealgathering-collab/ideal-gathering/pull/12), stacked on PR #11. Temporary services stopped; viewport restored.
Six-section venue dashboard, real verified visitor aggregates, profile/table/menu
editing and read-only Owner preview. Pending/beta-wait profile corrections remain
available. Two additive migrations close attendance forgery/attribution races and
restrict operational writes; applied only to the marked disposable database.

- Native DB: 57 venue + 61 moments + 21 gathering + 29 profile + 34 member + 26 summary pass.
- 250 unit/component tests; API 11 venue + 53 moments/member/summary + 9 profile + 42 owner/admin pass.
- Final affected 10 tests, typecheck and targeted lint pass. Translation/generated
  formatting debt remains 199 / 760 errors, matching baseline.
- Actual-route synthetic mobile 375px, Persian RTL 320px, desktop 1280px, Russian,
  editing, Owner read-only, empty/loading/error/retry and access gates checked.
- Normal build blocked by existing Lovable Windows routesDir assertion. Hosted
  Auth/storage/map/complete deployed journey and historical attendance audit remain.
- No merge, deployment, production migration or unrelated feature work.

[Archived spec](completed/IG-008-venue-dashboard-value-layer.md),
[verification report](completed/IG-008-verification.md), and
[counting/privacy contract](../docs/VENUE_DASHBOARD.md).

### IG-007 verification closure â€” 2026-09-26

Complete on `codex/ig-007-life-summary-v1`, based on IG-006 `65f9286`.
Implementation `e601443` is pushed in draft [PR #11](https://github.com/idealgathering-collab/ideal-gathering/pull/11),
stacked on PR #10. Temporary local services are stopped and viewport restored.
Own profile shows full rolling-30-day counts of completed eligible gatherings and
saved moments, persisted categories and three 10-day gathering counts. Read-only
caller-scoped invoker RPC retains RLS/access/block rules; no target parameter or
other-user metrics. People/place/first-time counts deliberately omitted for lack
of reliable evidence. Existing editing, matching and IG-006 remain unchanged.

- 240 unit/component tests; 53 moments/member/summary API, 9 profile API and 42
  owner/admin tests pass. Native DB: 26 summary + 61 moments + 21 gathering flow
  + 29 profile + 34 member checks pass. Post-fix affected component tests: 13 pass.
- Typecheck and targeted application/test lint pass. Translation/generated
  formatting debt matches baseline: 199 / 760 errors.
- Synthetic actual-route browser checks pass for 320px Persian RTL, 375px English,
  1280px desktop, Russian, loading/empty/error/retry and counting disclosure.
- Verified PostgREST launcher (Windows PowerShell 5.1) returned HTTP 200.
- Normal build remains blocked before compilation by the known Lovable Windows
  routesDir assertion. Supported-platform build and hosted staging remain.
- Migration applied only to marked disposable database. No merge/deployment.

[Archived spec](completed/IG-007-life-summary-v1.md) and
[exact verification report](completed/IG-007-verification.md) document rules,
files, commands, recovered failures and rollout limits. IG-006 PR #10 remains an
unmerged dependency. Review the stacked PR; IG-008 stays a separate task.

### IG-006 verification closure â€” 2026-09-26

Complete on `codex/ig-006-member-profile-privacy`, based on IG-005 `d840b37`.
Implementation `ac493ee` is pushed in draft [PR #10](https://github.com/idealgathering-collab/ideal-gathering/pull/10), stacked on PR #9.
Existing people route is now an in-app member view with relationship and both-way
block enforcement at the database/shared-moment layer. No DOB/private notes or
fine location; own links use IG-005. Report/block, mobile/desktop/RTL and focus
behavior verified. No public social metadata, new feed or /life route.

- 233 unit/component, 47 moments/member API, 9 profile API, 42 owner/admin tests
  passed; native DB: 61 Life Moments, 21 gathering flow, 29 profile, 34 member.
- Typecheck and targeted application/test lint pass. Translation formatting debt
  is 199 vs baseline 200; generated types match baseline 760 formatting errors.
- Verified PostgREST launcher under Windows PowerShell 5.1 returned HTTP 200.
- Normal build remains blocked before compilation by the known Lovable Windows
  routesDir assertion. Supported-platform build and hosted staging checks remain.
- Migration applied only to the marked disposable database; no merge/deployment.

[Archived spec](completed/IG-006-public-life-profile.md) and
[verification report](completed/IG-006-verification.md) record exact rules, files,
commands, recovered failures and rollout limits. Next: review IG-006, then implement
IG-007 as a separate task. Preserve the unmerged IG-005 dependency.

### IG-005 verification closure â€” 2026-09-24

Branch `codex/ig-005-life-profile-v1`, based on IG-004 `abafe39` / PR #8.
Implementation `c5c4d4b` is pushed in draft
[PR #9](https://github.com/idealgathering-collab/ideal-gathering/pull/9), stacked
on PR #8. Temporary local services are stopped and browser viewport restored.
Existing `/profile` now presents identity, a bounded real-data summary, own
moments timeline, authorized completed gatherings, current places and About.
Full existing editing is accessible in a responsive dialog; canonical saves,
avatar, preferences, traits, account controls and matching behavior are retained.
Reuses the IG-004 editor and context RPC; no schema or other-user profile changes.

- 227 unit/component tests, 38 moments API tests, 61 Life Moment and 21 gathering
  flow native DB checks, 29 profile DB checks, 9 profile API and 42 owner/admin
  regressions passed. Required PostgREST launcher returned HTTP 200.
- Final typecheck passes. Changed application/test files lint clean; main
  translations retain exactly the baseline's 200 formatting errors, zero warnings.
  Normal build reproduces the known Lovable MCP Windows path assertion before
  compilation. No tooling/dependency workaround; supported-platform build remains.
- Actual profile route/components inspected with synthetic data at mobile and
  desktop sizes: profile save/focus return, unlinked moment note/visibility save,
  failed-save draft retention, loading/empty/errors, Persian RTL and overflow.
  Real hosted Auth/Storage and full deployed navigation remain staging checks.
- Summary explicitly limits moments to 100 latest and gathering candidates to
  12 hosted/12 joined. Counts are not lifetime totals; places are current details,
  not a visit history. No advanced metrics, IG-006, venue work or new route.

[Completed spec](completed/IG-005-life-profile-v1.md) and
[exact verification](completed/IG-005-verification.md) record implementation,
files, all checks and environment limits. No production migration, merge or
deployment. Preserve the unmerged PR #8 dependency. Exact next step: review
IG-005, then address IG-006 separately; do not start it in this task.

### IG-004 verification closure â€” 2026-09-24

Branch `codex/ig-004-gathering-to-life-moment`, based on IG-003 `7c71e88` / PR #7.
Implementation checkpoint `bb8d0a7` is pushed in ready-for-review
[PR #8](https://github.com/idealgathering-collab/ideal-gathering/pull/8), stacked
on [PR #7](https://github.com/idealgathering-collab/ideal-gathering/pull/7).
Passive Remember this? card on gathering detail opens a compact optional editor;
no automatic modal over attendance/safety/feedback. Caller-scoped prefill RPC
reuses IG-003 access and host/checked-in completed-gathering checks; the existing
insert trigger/unique index remain authoritative. Exact own lookup, duplicate
recovery, optional private photo/note, private-default visibility and EN/RU/FA
copy are complete. No Profile redesign, automatic creation or IG-005 work.

- 61 foundation + 21 new native DB checks, 29 Life Moment API/handler tests,
  221 unit tests, 29 profile DB checks, 9 profile API regressions and 42 owner/admin
  regressions passed. Typecheck passes; regenerated RPC signature matches schema.
- All new files/helper/tests lint clean. Remaining 1,091 formatting findings match
  the same-file IG-003 baseline exactly, with zero warnings. Normal build still
  hits the known Lovable MCP Windows path assertion; tooling unchanged.
- Actual component inspected in synthetic browser preview at mobile/desktop
  sizes, including saved/edit/error states, keyboard focus and Persian RTL.
  Actual Storage transport, browser file upload, full hosted Auth/route E2E and a
  supported-platform build remain staging/environment checks, not claimed passes.
- New additive migration ran only on the marked disposable database. Verified
  PostgREST launcher/cache used. No production migration, merge or deployment.

[Completed spec](completed/IG-004-gathering-to-life-moment.md),
[exact verification](completed/IG-004-verification.md) and
[flow/privacy/rollout contract](../docs/LIFE_MOMENTS.md) record the handoff.
Review stacked on PR #7 and preserve the unmerged dependency order.
Temporary database/API/preview services stopped; browser viewport restored.

### IG-003 verification closure â€” 2026-09-20

Branch `codex/ig-003-life-moments-foundation`, based on IG-002 `72b214a` / PR #6.
Implementation checkpoint `8cdc039` is pushed in ready-for-review
[PR #7](https://github.com/idealgathering-collab/ideal-gathering/pull/7), stacked
on [PR #6](https://github.com/idealgathering-collab/ideal-gathering/pull/6).
Additive model, owner-only raw rows, bounded shared projection, gathering
eligibility/duplicate rules and private media policies are complete. Historical
title/date survive event edits/deletion without location/participant copies.
CRUD/read/hide/upload helpers are tested; no existing UI/navigation redesigned.

- 61 native DB checks and 15 Life Moment API/handler tests pass.
- 212 unit tests, 29 profile DB regressions, 9 profile/onboarding/matching API
  regressions and 42 owner/admin regressions pass. Native coverage also exercises
  existing gathering check-in/out, avatar and venue workflows.
- Typecheck passes. All new/modified code/test files lint clean except the same
  760 baseline generated-type formatting errors. Build reproduces the existing
  Lovable MCP Windows path issue; no unrelated tooling changes.
- Generated table/RPC signatures match verified schema; six installed function
  bodies match the final migration. Verified launcher/cache used for PostgREST.
- Hosted suite: 45 skipped, not passes. Actual Storage HTTP signing/upload,
  browser/hosted Auth and a supported-platform build remain staging/environment
  checks. Storage SQL policies execute for real; signing transport is simulated.

[Completed spec](completed/IG-003-life-moments-foundation.md),
[exact verification](completed/IG-003-verification.md) and
[model/privacy/rollout contract](../docs/LIFE_MOMENTS.md) record the handoff.
No production migration, merge or deployment. Shared server photo links expire
after 60 seconds; private orphan media cleanup remains authorized rollout work.
Review this branch stacked on PR #6 and preserve dependency order.
Final cleanup confirmed both disposable test-service ports are closed.

### IG-002 verification closure â€” 2026-09-19

Branch `codex/ig-002-profile-data-ownership`, based on IG-001 completion `c78968c`.
Implemented canonical preference ownership, additive table/RLS/backfill migration
and atomic changed-field saves. Profile initialization races and swallowed
onboarding save failures are corrected. Audited identity/card/public/matching
readers; documented the ownership map in docs/PROFILE_DATA_OWNERSHIP.md.
Verification complete: 29 native database checks, 9 real HTTP/application tests,
42 owner/admin regression tests and 192 unit tests pass. New PostgREST launcher
confirms current schema cache. Generated preference/RPC types match verified
schema; typecheck passes. All changed application/test files lint clean except
760 unchanged generated-type formatting errors (same-file baseline: 875 errors,
1 warning). Build reproduces the baseline Lovable MCP Windows path failure.
Hosted suite: 45 skipped, not passes. Browser/hosted Auth/deployed build were not
verified; no supported Linux runtime available. No production operation or redesign.
Temporary local PostgreSQL/PostgREST services are stopped.

[Completed spec](completed/IG-002-profile-data-ownership.md) and
[exact final verification](completed/IG-002-verification.md) are archived.
Implementation checkpoint `a0f72aa` is pushed and ready for review in
[PR #6](https://github.com/idealgathering-collab/ideal-gathering/pull/6).
The review branch stacks on IG-001 [PR #5](https://github.com/idealgathering-collab/ideal-gathering/pull/5),
which is still unmerged; preserve dependency order. Review/merge and production
rollout remain separate. Apply the additive migration before new RPC clients,
inspect target schema/ledger drift and verify staging cache/privacy/save behavior.

### IG-001 verification closure â€” 2026-09-19

Continued from `116a53f` on the same branch. No implementation restart.
[Final verification report](completed/IG-001-verification.md) and
[completed spec](completed/IG-001-owner-role-foundation.md) are archived per AGENTS.md.

- New disposable native PostgreSQL 17.5/PostgREST 12.2.3 target; all 60 committed
  migration files applied without edits or skips using documented platform scaffolding.
- 39 real database/RPC checks passed, including ten separate-connection lock-wait
  races, denied normal/venue/revoked-admin claims, retained admin access and real
  invitation/beta/moderation operations.
- 42 owner handler/route integration tests and 185 unit tests passed; typecheck passed.
- Schema types generated and reviewed; adopted only the owner no-argument RPC
  shape. No preference table removal or unrelated type/version changes.
- Targeted lint: 1,622 existing errors versus 1,631 baseline; all new tests/config
  lint clean. Build still fails only at the baseline Lovable MCP Windows path check.
  No supported Linux/container runtime available; no unrelated tooling workaround.
- Existing hosted DB suite: 45 skipped, not passes. The equivalent native suite
  closes IG-001 database acceptance; full hosted Auth/browser/deployment checks
  remain environment-specific rollout work, not claimed here.
- No new application dependencies, dashboard redesign, production migration,
  merge or deployment. Temporary local servers are stopped after verification.

Historical next action (superseded by IG-002 closure): review PR #5 and proceed
with IG-002's bounded scope. Before any
eventual production migration, inspect the real target ledger/roles and follow
the documented rollout procedure. The known build/lint issues remain documented.

## Historical IG-001 checkpoints (superseded by closure above)

### IG-001 checkpoint â€” 2026-09-19

Branch: `codex/ig-001-owner-role-foundation`, based on approved specs commit `f9c8e3e` (includes main `9e69980`). Separate clean checkout; earlier local work preserved.

Inspection complete: instructions/spec, database/auth docs, migrations/helpers, owner routes/functions, generated types, unit/DB tests and recent commits. Current enum already contains owner; only RPC declarations lag. Existing bootstrap contract permits the first existing admin, not a configured email/account allowlist.

Implemented additive corrective migration using `private.has_role`, serialized check/insert, restricted bootstrap execution, retained admin role, typed owner RPC and server authorization clients. Dashboard unchanged. Local PostgreSQL prerequisite fixture: 14 checks passed, including reproducing the old missing-helper failure. Initial unit run: 170 passed. Lint/typecheck/build in progress.

Remaining: finish verification and baseline failure comparison, record rollout/type-generation limitations and final handoff. No hosted database, deployment or merge performed.

### IG-001 final implementation checkpoint â€” 2026-09-19

Implementation ready for review; validation remains incomplete. See [exact results and rollout/recovery report](completed/IG-001-verification.md).

Saved implementation commit: `7e0793e`. Pushed to `codex/ig-001-owner-role-foundation`;
[draft PR #5](https://github.com/idealgathering-collab/ideal-gathering/pull/5)
targets the approved specs branch `docs/ig-001-008-build-specs`. Not merged/deployed.

- Final unit run: 185 tests passed across 16 files; local PostgreSQL fixture: 14 checks passed.
- Typecheck: exit 0 with local TypeScript binary. `bunx` unavailable; exact substitute recorded in report.
- New test files lint: exit 0. Full lint: exit 1, 37,510 errors / 14 warnings; unchanged baseline: 37,521 errors / 14 warnings.
- Build: exit 1, same Lovable MCP Windows path containment failure on unchanged baseline. Dashboard remains visually unchanged; only its gathering-status parameter type was corrected.
- New migration has only run against the isolated local prerequisite fixture. No hosted application, schema regeneration, multi-connection race test or browser E2E claimed.

Exact next step: review the task branch, verify the migration/RPC/auth/admin behavior and simultaneous admin claims on a designated disposable target, regenerate types from verified schema, and obtain a supported-platform build. Preserve the active spec until these checks close, then archive spec/report under `completed/`, update links and hand off to IG-002. No unrelated implementation is authorized by this checkpoint.

**IG-001 â€” Owner Role Foundation**

Repository evidence already identified a concrete mismatch: the owner bootstrap migration references a public role helper removed/moved by earlier migrations, while generated Supabase types lag owner role/RPC support.

Implement IG-001 only after re-inspecting current branch state, relevant migrations, role helpers, types, tests, and recent commits as required by AGENTS.md.

Do not broaden IG-001 into an access-system rewrite or owner-dashboard redesign.

## Product direction carried by this queue

The surrounding gathering product already exists and should not be rebuilt.

The main consumer change is:
completed gathering â†’ Life Moment â†’ Life Profile.

The Life Profile is the existing Profile; do not create a separate `/life` product.

The main business change is:
venue gathering activity â†’ real attendance attribution â†’ venue value metrics.

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
