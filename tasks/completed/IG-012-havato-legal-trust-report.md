# Havato Phase 2 — legal, privacy, and trust review

Baseline: ce42df567030679512ef4a8648b1c6bcb4f890b4, exact Phase 1 tree
6b1aeb17ead7a2e88b53ec7dc82ddbf8930d8f15. Continue PR #15 on
codex/havato-public-polish-phase1; target havato only. No merge/deployment.
Approved requirements: [IG-012](IG-012-havato-legal-trust.md).
Owner's follow-up: remove public email addresses for now; update later.

## Outcome and implementation
- Stable /terms and /privacy now render Havato-specific FA/EN documents in the
  Phase 1 header/footer/logo/fonts/palette. Legal typography and line width,
  numbered sections, contents anchors, related documents and contact panel.
  Default FA/RTL; EN URL validation works; legal header anchors return to home.
- Terms: team operator, existing 18+ eligibility, controlled Iran-first access,
  staged tools, conduct, impersonation/harassment/illegal use, reports/blocks,
  moderation/suspension/review, venue/host roles, public vs private-home safety,
  limited content permission, deletion, qualified disclaimers and mandatory local
  rights. No universal governing-country/forum, forced arbitration or invented entity.
- Privacy: current public name/email form (city/interests remain null in contract),
  optional invited-account/profile data, location/coordinates/maps, RSVPs/attendance,
  room messages/checklists, moments/notes/photos/visibility, safety/venue information,
  sessions/device/logs, optional push and preferences. Conditional availability,
  processing purposes, visibility, providers including Supabase, possible overseas
  processing, retention/deletion limits and local rights, Canada federal/provincial
  wording without a compliance certification. No invented analytics/payment system.
- Shared-expense planning is staged, only records/calculations if enabled; no
  holding/transferring money or bank/escrow/money-transmitter/payment-processor role.
- Empty legal configuration supports only a future valid HTTPS contact URL, truthful
  operator name and postal address. No invented mailbox or company. Account deletion
  points to existing /settings. Public request-channel limitation is visible.
- Removed old EN/FA/RU legal dictionary blocks and Armenian privacy SEO copy.
  Historical story domain text and old promotional/example city references cleaned
  in public copy; actual geographic filters, account city placeholders, data and
  infrastructure remain unchanged. Shared footer old email links now point to privacy
  contact information; public-home anchors corrected. Homepage reporting/blocking
  replaces broad verification messaging; email confirmation is not identity proof.
- Review-only CI extends focused legal checks and candidate SSR routes; no deploy step.

## Inspected evidence vs verified behavior
Source inspected: auth/waiting registration, profile DOB checks, settings/deletion
edge function contract, Supabase types/migrations/database docs, room chat/checklists,
moments/visibility, reports/blocks, venue fields, maps/geocoding and push preferences.
Presence in source does not certify deployed journeys or complete deletion cascades.
No hosted data writes, actual account deletion, authenticated journeys, private-home
hosting, provider delivery or payment flows were exercised.

18+ is not newly invented: existing Terms in EN/FA/RU, profile hint and profile
save validation already require it. DOB is optional; signup does not enforce age.
Core/auth behavior was deliberately not changed.

Canadian wording informed by official OPC sources (checked 2026-10-04):
[applicable federal/provincial laws](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/02_05_d_15/),
[cross-border processing](https://www.priv.gc.ca/en/privacy-topics/airports-and-borders/gl_dab_090127/).
No opinion on specific Iran licensing or local legal compliance is claimed.

## Local verification
- Chromium actual components in built synthetic preview: 24 legal layouts,
  /terms and /privacy × FA/EN × 320/390/768/1024/1440/1920. No horizontal overflow,
  broken images, script errors, visible old brand/country/domain or email addresses;
  correct language/direction, contents targets and stable routes. Desktop/mobile
  screenshots in both languages visually reviewed.
- Two bilingual interaction groups: homepage consent -> Terms -> Privacy, contents
  anchors, language switching with retained hash and persisted reload, mobile menu,
  Request Access returning to #waitlist, homepage how-it-works and story navigation.
  Unchanged settings/venue destinations asserted as links, not claimed authenticated.
- 35 focused tests pass: legal navigation/configuration 6, waitlist/branding 9,
  existing age/access regression checks 20. No prose-mirroring tests added.
- TypeScript noEmit passes. ESLint passes for changed components/routes/config/test
  files. Large existing SEO/dictionaries also pass semantic lint with only their
  inherited prettier rule suppressed; not presented as strict whole-repository lint.
- Production component preview build passes. Local application client/SSR compile
  succeeds; final Windows Nitro packaging hits the known tslib realpath EPERM.
  Final Linux review CI passes full production packaging and candidate SSR smoke; see exact evidence below.
- First local test attempt ran zero tests due to sandbox temp rename EPERM; retry
  with an in-workspace temporary directory passed all 35. No test failure concealed.
- git diff --check passes. Dependencies copied from Phase 1 cache; declarations and
  lockfiles unchanged. Linux CI supplies frozen-lockfile installation evidence.
- Prior full-suite baseline has 16 rendering failures and global lint errors; this
  phase does not claim to fix them. Separate inherited PR CI reruns that suite.

## Unresolved launch decisions, distinct from implementation
1. Public privacy/legal and early-access deletion request channel: intentionally
   absent at owner's request. No-account list deletion cannot currently be requested
   through this page. Publish/test a monitored channel before wider access; no fake
   contact or implied fulfilled operational right.
2. Verify operator identity, registered status if any, and legal postal address;
   current neutral team wording avoids inventing a company but is not a substitute
   for required jurisdiction-specific operator disclosure.
3. Preserve existing 18+ policy. Confirm it remains the launch policy and decide
   enforcement/age assurance before wider access; signup currently has no age gate.
4. Set and verify retention/backup periods and end-to-end account/list deletion,
   provider locations/contracts and transfers. No instant complete deletion promise.
5. Regional legal review before Iran/Canada rollout: final entity/jurisdiction choice,
   local consumer/privacy/language requirements and any required licensing. Terms
   keep mandatory rights intact and do not select a universal exclusive jurisdiction.
6. Expense money movement, expanded home/private access or new sensitive features
   would need separate product/legal review before enabling; not built here.

## Boundaries and next step
No database/schema/migration/backend/waitlist contract/auth routes or logic/account
data/venue account/PWA/install/infrastructure/lockfile/hosting changes. No production
writes, merge, deployment, or idealgathering.com access. Review draft visuals/content
and complete the separate prelaunch decisions before authorizing Phase 3 release.

## Published Linux validation
Implementation commit: a0a84be93237606efd596310a885b9ded750ec2e.
Review-workflow correction/current validated implementation:
46238c708b98b80239c7eba3fe8f75ee1ebbd525, tree
0f5adff4c6965d0724b9e9719de2102263709b47; published tree exactly matches local tree.

[Focused Linux review CI 37211617366](https://github.com/idealgathering-collab/ideal-gathering/actions/runs/37211617366)
**passes** frozen Bun install, all 35 focused units, 35 PWA checks, TypeScript,
changed-file lint, semantic SEO/dictionary lint, full production build and candidate
SSR home/story/Terms/Privacy/member signin/signup/venue auth/manifest checks.
Both legal routes and EN-query URLs return 200; default Farsi/RTL and no legal
legacy references verified. Existing provider first-renders FA on SSR and applies
saved/URL EN on hydration; browser checks verify actual EN content. No i18n/auth
provider refactor was included. No real backend or account changes tested.

First review workflow revision did not start due to an incorrectly quoted YAML
lint command. Corrected to a block scalar and verified with js-yaml before the
successful run; no production config was affected.

[Inherited full-suite CI 37211617394](https://github.com/idealgathering-collab/ideal-gathering/actions/runs/37211617394)
remains red on the 16 existing life-profile/life-summary/member-profile/venue-value
rendering failures. Earlier Phase 2 run 37211183651 confirms **421 pass, 16 fail,
11 skipped** (six new focused legal checks account for the increase from 415).
This status is not bypassed and the whole repository is not described as green.
Global formatting debt remains. Browser checks were repeated against the final
dictionary changes and again passed all 24 layouts/two interaction groups.

No Phase 2 implementation blockers remain for draft review. A subsequent handoff
commit changes documentation only. Launch decisions above remain deliberately open.
Draft PR #15 remains unmerged and undeployed, targeting havato only.
