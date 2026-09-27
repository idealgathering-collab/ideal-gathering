# IG-009 verification — portable deployment checkpoint, 2026-09-27

## Current outcome
Portable implementation and local verification pass. Default build uses standard
Vite/TanStack Start/React/Tailwind/Nitro, with no Lovable build wrapper or MCP Vite
plugin. Artifact: complete `.output/`, Nitro `node-server`, Node entry
`.output/server/index.mjs`. Copied artifact runs outside the checkout.
No Lovable credits/editor/remix, production writes, migrations, merge or deployment.
Venue activation remains 2–5; no IG-010 or product feature work.

## Changes and dependency audit
- Revised the approved spec/current task before implementation; portability
  supersedes the earlier Lovable staging/remix and conditional-promotion direction.
- Standard default config retains file routes, SSR, Tailwind, aliases/dedupe,
  public environment handling, import protection and `src/server.ts`.
- `vite.lovable.config.ts` retains the original wrapper/MCP plugin and optional
  platform build; `build:lovable`/`dev:lovable` select it explicitly. Never combine stacks.
- `@lovable.dev/mcp-js` remains a runtime dependency for existing MCP endpoints;
  tested issuer discovery and anonymous denial work on the independent Node server.
  Its Vite plugin is not needed for the default build because routes are committed.
- `@lovable.dev/cloud-auth-js` remains for optional Lovable OAuth. Direct Supabase
  OAuth is the portable default; provider/redirect/error branches have unit coverage.
- Server Supabase clients already used runtime environment variables. Public config
  now requires explicit URL/key, rejects known privileged keys, and uses no browser
  `process.env` fallback. MCP issuer uses the configured URL, not a project-ref hostname.
- Removed tracked root `.env`; retained prior local values only in ignored
  `.env.lovable.local`. Independent env directory and blank example contain no secrets.
- Shared brand config supplies logos, translated brand labels, root/SEO metadata,
  origin, manifest and theme hook; per-language text override map supports future
  editorial changes. Havato implementation/full legal rebranding is not claimed.
- Seven original public assets copied byte-for-byte into `public/assets`; no runtime
  Lovable asset proxy. Two large images imported by a temporary branch-only Action
  after connector upload failures; fixed SHA-256 checks passed. Import workflow is
  removed in the implementation checkpoint. No application dependency changes.
- [Deployment contract](../docs/DEPLOYMENT.md) documents install/build/start,
  required public/server variables, optional compatibility and exact staging steps.

## Commands and observed local results
Environment: Windows, Node v24.19.0, Bun 1.4.2. The bundled Bun executable was
invoked by absolute path because it was not on PATH; commands below use `bun`
as shorthand for that executable. Dependencies installed from committed bun.lock.

| Command | Result |
| --- | --- |
| `bun install --frozen-lockfile` | PASS; 550 packages; no dependency or lockfile changes |
| `bun run test` | PASS; 26 files / 279 tests, including 13 new config/OAuth tests |
| `bun node_modules/typescript/bin/tsc --noEmit` | PASS, exit 0 |
| `bun node_modules/eslint/bin/eslint.js vite.config.ts vite.lovable.config.ts src/config src/integrations/supabase/oauth.ts src/integrations/supabase/client.ts tests/unit/deployment-config.test.ts tests/unit/oauth-config.test.ts 'src/routes/manifest[.]webmanifest.ts' scripts/portable-smoke.mjs` | PASS, exit 0 |
| ESLint on all touched TS/TSX excluding generated route tree | 320 errors / 2 warnings: 314 formatting findings + 6 pre-existing `no-explicit-any` in owner.$section; same-file baseline 337 errors / 2 warnings (331 formatting + same 6). No new semantic findings |
| `bun run build` | PASS; standard Vite 8.0.16 + Nitro 3.0.260603-beta, preset node-server |
| `node scripts/portable-smoke.mjs` | PASS; actual production Node server HTTP checks |
| `node scripts/portable-smoke.mjs <copied-artifact-directory>` | PASS; complete artifact copied outside source checkout, no development dependency directory |
| `git diff --check` | PASS after whitespace cleanup |

Build/smoke settings were dummy loopback fixtures, not hosted credentials:
`VITE_SUPABASE_URL=http://127.0.0.1:54321`,
`VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_ig009_local_fixture`,
`VITE_SITE_URL=http://localhost:4173`,
`SUPABASE_SERVICE_ROLE_KEY=ig009_server_only_sentinel`.
The smoke script supplies matching dummy runtime settings and stops its server.
The artifact is structurally deployable, but must be rebuilt with real **isolated
staging** public settings before actual hosted testing.

HTTP checks: /auth, /terms, /privacy, /our-story return SSR HTML with security
headers; manifest reflects default brand; seven local image responses have exact
byte lengths; MCP metadata uses configured loopback issuer and anonymous /mcp
returns 401. Browser assets contain neither the sentinel nor the historical
production project reference. These are deployment-boundary checks, not successful
backend, browser hydration, OAuth/Storage/email or full product E2E tests.

Recovered issues: restricted Windows sandbox denied Nitro dependency-tracer
readlink traversal; rerunning with ordinary filesystem access passed. The old
Lovable Windows routesDir error does not occur in the independent path. First
bundle scan caught Bun auto-loading the legacy `.env`; removing that tracked
default and narrowing explicit public env reads fixed it. Original images were
not edited or regenerated. Lint line-ending noise was corrected; unrelated legacy
formatting/type debt remains. No unrelated source refactor or dependency upgrade.

## CI and publication
A read-only `Portable Node build` PR workflow repeats install, unit/type/config
lint, independent build and local smoke on Ubuntu/Node 24. It saves a clearly
named dummy-backend artifact, then checks the optional Lovable build on Linux.
Its actual run result will be recorded after publication; no CI pass is implied yet.
Original remote IG-009 checkpoint was 29e419e; local equivalent had different
line endings in four docs only (normalized contents verified equal). All new
commits preserve remote ancestry; no force-push or rebase. PR #13 stays draft,
stacked on #12 and unmerged.

## Hosted staging and remaining manual work
No isolated Supabase credentials or general Node hosting target are configured
in this checkout/session. No hosted URL, migrated staging database, real Auth,
Storage, email, maps, PWA/mobile install or full hosted journey has been verified.
No production data was read or changed for this implementation; prior read-only
schema/ledger evidence below is preserved, not rerun or treated as resolved.

Next: provision an empty isolated Supabase project and a separate Node 24 staging
service; reconcile/apply ordered migrations only there; configure Auth/SMTP,
redirects, Storage and Edge Functions; set matching build/runtime variables;
rebuild this PR revision; deploy the entire .output folder behind HTTPS. Verify
backend identity before synthetic writes, then execute every hosted matrix row
below. Follow [exact staging steps](../docs/DEPLOYMENT.md#isolated-staging--exact-remaining-action).
No production promotion is authorized by this revised task. Keep IG-009 active
until actual hosted beta checks pass. Farzin can host this same core on another
Node server without Lovable credits; provider/Supabase setup is still required.

---

# Historical inspection checkpoint — superseded direction, evidence retained
The text below records the earlier inspection. Lovable remix/editor actions and
promotion are no longer the next steps; the revised scope above governs work.

# IG-009 verification — inspection checkpoint, 2026-09-27

## Outcome
IG-009 started, blocked before isolated staging provisioning. Not ready for Farzin's testing of IG-001–IG-008.
No product code changed, no PR merged, no production data mutated, no migrations applied, no PostgREST reload, no new deployment.

## Environments and URLs
- GitHub: idealgathering-collab/ideal-gathering. Default branch main.
- Integration branch: codex/ig-009-staging-beta, based on 10984d66b1865e07398015d9818a9dee2c294881.
- Lovable production project: df4ffe27-d2b4-4499-9904-0c945a538777, Ideal Gathering Hub, published.
- Lovable latest code: 9e69980bd328724bd73ad6eb0202790ff8289379; same as GitHub main. Published build SHA and configured sync branch remain unverified.
- Existing live domain from source and browser navigation: https://www.idealgathering.com/
- Existing project preview: https://id-preview--df4ffe27-d2b4-4499-9904-0c945a538777.lovable.app
- That preview is NOT an isolated IG-009 staging environment; do not submit test data there.
- Repository Supabase project reference: msmmvtmgfmwwtipairsu. Lovable reports enabled Supabase; backend identity mapping needs editor verification.
- Staging URL/backend/commit: none.
- Lovable workspace lists this app plus Credit Reset Tracker; no existing staging project found.

## Git dependency reconciliation
| PR | Task | Head | Base |
| --- | --- | --- | --- |
| #5 | IG-001 | c78968c | docs/ig-001-008-build-specs |
| #6 | IG-002 | 72b214a | codex/ig-001-owner-role-foundation |
| #7 | IG-003 | 7c71e88 | codex/ig-002-profile-data-ownership |
| #8 | IG-004 | abafe39 | codex/ig-003-life-moments-foundation |
| #9 | IG-005 | d840b37 | codex/ig-004-gathering-to-life-moment |
| #10 | IG-006 | 65f9286 | codex/ig-005-life-profile-v1 |
| #11 | IG-007 | d56c413 | codex/ig-006-member-profile-privacy |
| #12 | IG-008 | 10984d6 | codex/ig-007-life-summary-v1 |

All open/unmerged/mergeable at inspection. #5–#8 ready; #9–#12 draft.
main is an ancestor of the integration baseline (git merge-base --is-ancestor exit 0).
Latest IG-008 includes the stack, so staging can test that complete history without merging anything into production first.
Before later merging, refresh all heads and ensure no concurrent changes. Preserve dependency order and published history; reconcile PR bases deliberately rather than squash/rebase the chain.

## Live migration drift (read-only)
57 ledger rows; latest version 20260906182026. Full non-secret snapshot in IG-009-production-ledger.json.
Several early ledger versions differ by seconds from repository filename timestamps, while their names identify the corresponding files. A timestamp-only missing-migration comparison would replay already-applied SQL.
Ledger contains 20260827175817 / 63685b4f-54ab-4d51-b12b-d0d46796e36b with no same-named repository migration.
Repository 20260825193000_gathering_ratings_reasons.sql has no same-version ledger row, but reasons exists.
Owner enum already exists despite no 20260910233000 ledger row. claim_initial_owner() is absent.
user_gathering_preferences exists; preferred_group_size is smallint rather than the IG-002 fresh-schema integer. Other inspected column names/types/nullability align with the migration contract. Constraints, functions, grants, triggers and policies still need a complete schema comparison.
life_moments is absent.
Storage catalog inspection found avatars only, private, with no configured size/MIME restrictions. IG-003 private media bucket is absent.
Do not repair the production ledger or replay historical SQL on these observations alone. Compare historical migration statements and schema effects first.

## Ordered rollout candidates (not applied)
After reconciling historical ratings and prerequisite drift:
1. 20260910233000_add_owner_role.sql — idempotent enum addition; separate commit boundary.
2. 20260910233100_add_owner_bootstrap.sql — old helper reference; do not expose intermediate bootstrap before corrective migration.
3. 20260919120000_fix_owner_bootstrap.sql.
4. 20260919150000_profile_preference_ownership.sql.
5. 20260919210000_life_moments_foundation.sql.
6. 20260924120000_gathering_moment_context.sql.
7. 20260925120000_member_profile_privacy.sql.
8. 20260926160000_own_life_summary.sql.
9. 20260926210000_venue_value_layer.sql.
10. 20260926213000_serialize_attendance_attribution.sql.
11. 20260927080000_venue_activation_small_groups.sql.
Fresh staging requires the full historical schema in order, or a verified schema-only clone plus reconciled ledger. Never import production records.
After approved application on verified staging, run NOTIFY pgrst, 'reload schema', then confirm RPC resolution over HTTP.
Audit historical attendance and oversized venue rows before production constraint validation; preserve audit rows.

## Configuration inspection
Vite uses the existing Lovable TanStack wrapper, server entry and MCP plugin; no hosting replacement.
Required browser config: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_PROJECT_ID.
Required runtime config: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY.
Tracked env contains URL/project/publishable-key names only; values not copied. Presence in source does not prove hosted runtime settings. Runtime service-role availability remains unknown.
Auth callback/site URLs, SMTP/provider delivery, staging mailbox ownership, Storage upload/signing and maps remain unverified.
Manifest has standalone display, root start URL and 192/512 PNG icons. No service-worker registration or push subscription implementation found in source inspection. Actual installability/offline behavior remains untested. Real push notifications are not implemented and are not a staging blocker in this approved scope.

## Hosted smoke matrix
All rows below are NOT RUN: no isolated deployed IG-009 target exists.
| Journey | Required evidence |
| --- | --- |
| Signup/login | Real email verification, login/logout/session refresh, failure handling |
| Waitlist/invite | Controlled mailbox, invitation create/redeem/expiry/reuse denial |
| Onboarding | Canonical persisted fields, failed-save retry |
| Explore/Create/Join/detail | Real listings, create, approval/access, capacity, duplicate join |
| Attendance/check-in | Actual hosted time/location eligibility, unauthorized denial |
| In-app notifications | Correct recipient, read state, navigation |
| Life Moments | Eligible completed gathering, save/edit, actual private photo upload/signing |
| Own Life Profile | Own data and aggregates, editing, persistence |
| Member/privacy | Relationship access, both-way blocks, private notes/media denied |
| Venue registration/approval/dashboard | Pending gate, approval, activation 2–5 |
| Venue analytics | Verified attendance aggregates, no identity leakage |
| Table/menu/profile management | Authorized edit, persistence, errors |
| Admin | Authorized moderation; normal-user denial |
| Owner preview/control | Authorized controls, read-only preview, access denial |
| Persian RTL/mobile/desktop | Real deployed layout, focus, no overflow |
| Error/empty states | Retry, permission errors, empty accounts |
| PWA | HTTPS/manifest/icons, real mobile/desktop installation and launch |

Safe procedure once staging exists: create synthetic member A/B, venue and administrator accounts using controlled staging mailboxes; bootstrap Owner only through approved existing-admin flow on empty staging. Use synthetic gatherings/media. Verify staging backend identity before each test run. Do not run existing local disposable-database setup scripts on hosted production.

## Promotion gate
Record immutable tested revision and build artifact/configuration, separate production environment values, backup completion and tested restoration procedure, previous production build, migration compatibility and maintenance sequence. Staging and production necessarily use different backend credentials; preserve tested application revision and configuration structure. No promotion until all gates pass.

## Checks and blockers
- Remote GitHub metadata and Lovable project/database status read successfully.
- Production metadata queries succeeded; zero test/user-data reads or writes needed.
- Lovable remix attempted twice (explicit/default options): INVALID_ARGUMENT, no project ID returned.
- Browser editor redirected to login. Farzin must sign in to inspect sync settings and complete/resolve isolated remix.
- Managed worktree creation unavailable in this projectless chat (not a Git repository). Created separate local clone; prior checkout preserved.
- Local Git HTTPS fetch unavailable: remote-https helper missing. Remote state verified through GitHub connector; checkpoint publication uses connector.
- Unit/API/DB/typecheck/lint/build: NOT RUN for documentation-only checkpoint. Prior IG-008 counts are historical, not this run. Known Windows routesDir build issue remains unverified on supported host.
- Actual published application commit and authenticated runtime behavior remain unknown.

## Exact next action for Farzin
Sign in to the opened Lovable project editor. If remix still fails there, create a project copy named Ideal Gathering IG-009 Staging in the same workspace, with a separate empty backend; do not reconnect it to production Supabase or publish production. Then provide the staging project link so integration can resume. No secrets in chat.
