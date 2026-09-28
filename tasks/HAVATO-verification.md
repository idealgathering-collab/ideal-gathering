# Havato deployment verification — 2026-09-28

## Outcome
The existing havato branch was fast-forwarded from main snapshot 9e69980 to IG009 33e3176, incorporating 32 commits. All IG001–IG008 tips below are ancestors of IG009. No conflicts, force pushes, IG-branch edits, production deployment changes, DNS changes, or production database writes.

Havato code/container checkpoint: a4292948ab82871f2a0d5f3cf1bf9bb2191d80e7. Follow-up documentation and minor formatting/config safety edits are recorded in the branch history.

| Work | Original branch (unchanged) | Incorporated tip |
| --- | --- | --- |
| IG001 | codex/ig-001-owner-role-foundation | c78968ca8ca2c2227c051f8c8906818b8254c51c |
| IG002 | codex/ig-002-profile-data-ownership | 72b214ae50399e69dcf5ad573be20a16050a1620 |
| IG003 | codex/ig-003-life-moments-foundation | 7c71e88b53c147a68f521ee6361fe472ce78c629 |
| IG004 | codex/ig-004-gathering-to-life-moment | abafe39cad7ddd4c4834fdfafd1f931a7a10d1f6 |
| IG005 | codex/ig-005-life-profile-v1 | d840b371bcea70e900609555d76eb0e8f5a08ead |
| IG006 | codex/ig-006-member-profile-privacy | 65f9286d4055f0c75aa7df2d4e4877582fdab4d0 |
| IG007 | codex/ig-007-life-summary-v1 | d56c413fcf441e80b816e8bde2fb0ceaee0b4a28 |
| IG008 | codex/ig-008-venue-value-layer | 10984d66b1865e07398015d9818a9dee2c294881 |
| IG009 | codex/ig-009-staging-beta | 33e3176da097d972551a9b56260d946d53f7f5f4 |

## Reconciliation
No merge conflict existed. The prior main-based uncommitted draft is preserved separately. Only its compatible container/temporary-logo work was reapplied. IG009's newer OAuth, environment, routes, assets, profiles, venue logic, and generated manifest were retained. Historical migrations were not rewritten.

## Verification
| Check | Result |
| --- | --- |
| Frozen Bun installation | PASS, 550 packages; lockfiles unchanged |
| Unit/component suite | PASS, 279 tests / 26 files |
| TypeScript --noEmit | PASS |
| Production Vite/Nitro build | PASS, Node 24; no local env file; dummy loopback backend |
| Standalone artifact HTTP smoke | PASS: SSR, headers, local assets, Havato manifest, MCP issuer and anonymous denial |
| Native migrations | 68 applied in a new disposable loopback cluster with test scaffolding |
| Native PostgreSQL checks | 275 passed: owner/admin 39; profiles 29; Life Moments 61; gathering moments 21; members/privacy 34; summaries 26; venues 65 |
| API integration | 120 passed: owner/admin 42; profiles 9; moments/member/summary 53; venues 16 |
| Hosted DB suite | 45 tests skipped by safety guard; no isolated hosted credentials yet |
| Full lint | 2,315 errors / 12 warnings, compared with 2,323 / 12 on IG009 baseline; inherited lint debt remains |
| Targeted config/tests lint | 0 errors, 2 existing Fast Refresh warnings |
| Privileged-key source scan | 472 tracked files scanned; no service-role JWT, private-key or real sb_secret pattern found |
| Browser artifact secret scan | PASS: no server sentinel or historical production project reference |
| Linux Docker build/start | PASS; port 3000, unprivileged node user, read-only filesystem, temporary /tmp, no volume |

Container evidence: https://github.com/idealgathering-collab/ideal-gathering/actions/runs/36467515216

Commands: bun install --frozen-lockfile; node node_modules/vitest/vitest.mjs run; node node_modules/typescript/bin/tsc --noEmit; node node_modules/vite/bin/vite.js build; node scripts/portable-smoke.mjs; node tests/{owner,profile,life-moments,gathering-moment,member-profile,life-summary,venue-value}-postgres.verify.mjs <disposable-runtime>; vitest configs owner/profile/moments/venue; eslint . and targeted files. No hosted test fixture or migration command was run against production.

Resolved verification issues: Nitro dependency tracing needed ordinary filesystem access outside the sandbox; the first brand test expected Ideal Gathering; the native SQL equality check needed CRLF/LF normalization; Docker smoke needed to follow /auth's 307 redirect. Docker itself built and listened successfully on the first run.

## Darkube preparation
Repository idealgathering-collab/ideal-gathering; branch havato; Dockerfile ./Dockerfile; context .; app name havato-test; service port 3000; readiness /auth?mode=signin; command/args empty; one replica; 500 MB / 0.25 CPU; namespace havato; cluster hamravesh-c11; no disk or custom domain.
Proposed https://havato-test.darkube.ir was reported available in the form. It is NOT deployed or reserved. Last displayed estimate: 2,937,500 IRR/month plus traffic (about 4,080 IRR/hour). Paid creation remains unapproved.

Public Docker build arguments: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SITE_URL. Confirm provider build-argument mapping. Runtime: SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY for the same new backend; SUPABASE_SERVICE_ROLE_KEY only in encrypted runtime secrets. No real keys have been committed or configured.

## Hosted blockers
User confirmed no Havato Supabase exists and authorized creating a separate one. Free-project creation form prepared with name havato and Frankfurt region. Password creation/submission requires user handoff. No project creation success is claimed yet. Hosted migration, Auth/SMTP/OAuth, storage, Edge Function, owner bootstrap and end-to-end journeys remain pending. The inherited data-only migration tied to two historical users must be handled as not applicable on a fresh backend; do not copy production users.

Authentication, main user journeys, profiles, gatherings/join, venue, admin and owner behavior have local test coverage; they have NOT been verified on a live Darkube/Supabase deployment. A fixture build is not the release artifact. Rebuild with real new-project public settings after provisioning. havato.app remains unconnected. Historical legal/support/story copy still needs review before public launch.

## Havato-specific files
The incorporated product stack additionally changes 180+ paths; see GitHub comparison main...havato. Files below are Havato-specific changes relative to IG009:
- .dockerignore
- .github/workflows/havato-container.yml
- Dockerfile
- docs/HAVATO-DARKUBE.md
- public/havato-mark.svg
- public/llms.txt
- public/robots.txt
- scripts/portable-smoke.mjs
- src/components/landing/public-header.tsx
- src/components/site-footer.tsx
- src/components/site-header.tsx
- src/config/brand.ts
- src/i18n/index.tsx
- src/lib/mcp/index.ts
- src/routes/[.]lovable.oauth.consent.tsx
- src/routes/__root.tsx
- src/routes/_authenticated/admin.tsx
- src/routes/_authenticated/chat.tsx
- src/routes/_authenticated/dashboard.tsx
- src/routes/_authenticated/my-gatherings.tsx
- src/routes/_authenticated/onboarding.tsx
- src/routes/_authenticated/owner.$section.tsx
- src/routes/_authenticated/owner.activity.tsx
- src/routes/_authenticated/owner.tsx
- src/routes/_authenticated/owner.venue-preview.tsx
- src/routes/_authenticated/people.$id.tsx
- src/routes/_authenticated/profile.tsx
- src/routes/_authenticated/settings.tsx
- src/routes/admin.auth.tsx
- src/routes/gatherings.$id.tsx
- src/routes/invite.tsx
- src/routes/manifest[.]webmanifest.ts
- src/routes/pending.tsx
- src/routes/preview.tsx
- src/routes/reset-password.tsx
- src/routes/venue.dashboard.tsx
- src/routes/venue.register.tsx
- src/routes/waitlist.tsx
- supabase/config.toml
- tasks/HAVATO-deployment.md
- tasks/current.md
- tests/gathering-moment-postgres.verify.mjs
- tests/unit/deployment-config.test.ts
- tests/unit/venue-value.test.ts
- vite.config.ts
