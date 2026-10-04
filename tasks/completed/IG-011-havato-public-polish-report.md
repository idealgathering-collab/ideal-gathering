# Havato public-site polish — Phase 1 review

Baseline: remote `havato`, d69e6954104b3c39dad393fe5c278a2960934ad7.
Review branch: `codex/havato-public-polish-phase1`; base: `havato` only.
Approved scope: [IG-011](IG-011-havato-public-polish.md).

## Implementation
- `havato-waitlist.css`: desktop-only >1000px full-width shell and hero, viewport-aware height, larger type/form/sections, balanced 54/46 hero columns, readable section widths capped at 1600px, restrained footer. Existing home mobile breakpoints retained. New responsive story styles use the existing tokens/fonts.
- `havato-home-copy.ts`, `havato-waitlist.tsx`: Early Access / Request Access copy in FA/EN, staged invitations and feature availability, translated confirmation/duplicate/error states. Removed obsolete auth-copy fragments.
- `havato-public-chrome.tsx`: shared homepage/story navigation, real /our-story link, Request Access control, language buttons/mobile menu, deliberate legal/story footer links and separately grouped For Venues / Venue Access. Member login can be restored with `showMemberSignIn`; auth routes untouched.
- `havato-waitlist.tsx`: two use cases become articles; seven activity tiles become informational divs. Removed link arrows and obsolete auth-layout CSS. Images, category examples, trust and planning strips are not controls. Conditional PWA install remains unchanged; its empty wrapper no longer creates a blank section.
- `havato-story.tsx`, `routes/our-story.tsx`: existing URL/eight chapters/founder/images retained, matching public shell and localized image descriptions. Updated chapter four's old domain framing, chapter seven's current brand, mission closing and homepage access CTA. Other origin chapters retain the weekly table, scattering, search, blackouts/war and rebuilding history. No invented launch/valuation/market claims. English URL validation restored; Farsi SEO/default added.
- `lib/seo.ts`: only homepage FA/EN and story FA metadata copy changed. Legal metadata/content untouched.
- `tests/landing-preview`: existing synthetic fixture now renders either actual home or story component and handles explicit search/hash links.
- `tests/havato-public-smoke.mjs`, review-only GitHub workflow: frozen Linux install, focused checks, candidate production build and SSR route/manifest smoke with dummy loopback settings. Read-only CI permissions; no deployment step.
- Task/UX documentation records this reviewed scope and handoff.

## Local verification
Actual Chromium, bundled production preview of actual components with the existing synthetic adapter. Requests for preview assets were fulfilled from local files; Windows loopback restrictions prevented using its local development listener. No hosted backend calls or signup writes in these checks.

- 36 home/story configurations: widths 320, 375, 390, 700, 768, 1024, 1366, 1440, 1920 in FA and EN. All pass: no horizontal overflow/page errors/broken images; correct language/direction; eight story chapters; no legacy visible brand/waitlist/About Us/valuation labels, no member login links, one clearly grouped venue entry, zero linked decorative cards/tiles.
- Eight interaction groups pass: Farsi default/persisted English/mobile menu/story/access return/FAQ; both-language empty/invalid-email/consent validation, exact normalized name/email/city:null/interests:null payload, busy/double-submit guard, joined/duplicate/error-retained-values/retry; conditional install event invokes unchanged install controller.
- Live existing `/auth?mode=signin`, `/auth?mode=signup`, `/venue/auth`: each HTTP 200 with email/password forms. No sign-in or account creation. These unchanged routes were observed on existing deployment, not asserted as candidate authenticated journeys.
- Focused waitlist/branding units: 9/9 pass.
- Existing PWA install/worker/push checks: 35/35 pass.
- TypeScript: pass. Changed landing/route/preview files and new smoke script lint clean. SEO file retains 20 existing formatting errors; full LF-normalized checkout lint: 2723 errors, 12 warnings, in existing code. No repo-wide formatter changes committed.
- Full Vitest suite: 415 pass, 16 fail, 11 skipped. The 16 failures are the same life-profile/life-summary/member-profile/venue-value rendering categories recorded at the earlier homepage baseline; those implementations/tests are untouched. No fresh baseline rerun claimed.
- Preview build: pass. Application client and SSR compilation: pass; final local Nitro packaging fails on existing Windows `EPERM realpath node_modules/tslib/modules/package.json`.
- Frozen local Bun install blocked by Windows temporary-directory EBADF. Local checks reused the existing cached dependency tree; lockfiles/declarations unchanged. Review CI supplies exact frozen-lockfile/Linux validation.
- `git diff --check`: pass.

Screenshots and machine-readable layout/route results are delivered in this chat's outputs directory. Homepage and story desktop/mobile FA/EN screenshots visually inspected.

## Boundaries and remaining checkpoint
No database, migrations, waitlist helper/insert contract, backend, authentication, accounts, venue product, PWA/controller/worker/manifest, approved assets, Terms/Privacy content, dependency lockfile or hosting configuration changes. No production writes, merge, deployment, or idealgathering.com work.

## Published review and Linux verification

Draft [PR #15](https://github.com/idealgathering-collab/ideal-gathering/pull/15)
targets `havato`; implementation commit `43dd1115b150e0612b4290858ca3c56e5eaac57f`.
Its published tree is byte-identical to the locally checked implementation tree
`55a1cbffe5d5f296f53a1b4028a978249eb5e845`. GitHub connector published this
review branch because local Git Credential Manager cannot run in the sandbox.

[Focused Linux CI 37208769543](https://github.com/idealgathering-collab/ideal-gathering/actions/runs/37208769543)
passes frozen Bun install, 9 focused units, 35 PWA checks, TypeScript, focused
lint, full production build and candidate SSR smoke. Actual candidate homepage,
story, member sign-in/signup and venue sign-in all return 200; default Farsi/RTL,
eight chapters, hidden public member entry and unchanged orange Havato manifest
verified. Windows packaging limitation is resolved for review by Linux evidence.

[Inherited full-suite CI 37208769464](https://github.com/idealgathering-collab/ideal-gathering/actions/runs/37208769464)
fails at full unit tests: exactly 415 pass, 16 fail, 11 skipped, matching the local
result and prior recorded rendering failures. Later steps in that older job are
skipped; do not describe it as passing or bypass its status. Existing global lint
errors also remain separate maintenance.

No implementation blockers remain for visual/content review. The repository's
full-suite check remains red. Real Supabase submission/email delivery,
authenticated account journeys and physical-device installation were not
exercised. Next: review Phase 1 visuals/content/PR; Terms/Privacy remain Phase 2.
