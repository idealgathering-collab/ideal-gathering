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
