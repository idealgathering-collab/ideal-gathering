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

Review-only CI result will be recorded before handoff. Existing global tests/lint failures remain separate maintenance; do not bypass them or describe the entire repository as green. Real Supabase submission/email delivery, authenticated account journeys and physical-device installation were not exercised. Next: review Phase 1 visuals/content/PR; Terms/Privacy remain Phase 2.
