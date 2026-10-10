# IG-014 — Havato Phase 6 first increment

Review branch: `codex/havato-phase6-private-gatherings`, based solely on `havato` at `755a9ed024f9672dffe5afaea46d109ae899ac49`. User prioritizes Phase 6 before Phase 5. PR #16 remains open and unmerged; none of its authentication edits are included.

Review: [draft PR #17](https://github.com/idealgathering-collab/ideal-gathering/pull/17), targeting `havato`.

## Concrete audit
[Source inventory and reuse decisions](../docs/HAVATO-PHASE6-AUDIT.md) covers creation, private visibility, beta/event invitations, RSVP, chat, checklist, responsibilities, expenses, memories/media, reminders and history. The main missing models were event privacy and event-specific invitations. Existing chat/checklist/attendance, IG-003–007 memories/profile and Phase 3/4 reminders are reused. Expenses, assignment and a shared album are not present and are not falsely reported as implemented.

## Completed code
- Same creation route gains a private mode and a direct private entry from My Gatherings. Place name/optional arrival instructions, title/description, future date/time and 2–30 capacity. Creation retains proposed/admin approval. Host seat is reserved.
- Immutable visibility defaults existing gatherings to public. Private details require host, invited eligible adult or existing admin moderation access. Bidirectional host blocks deny guest access.
- Recipient-bound invitations to existing members by exact email; invitation inbox, host response list and revocation. No email is stored in invitation rows or sent externally.
- Going/Maybe/Declined RPCs atomically use existing attendee memberships and gathering row locks. Going reserves capacity; other responses/revocation release it. A direct legacy leave synchronizes Declined. Full capacity rolls back the RSVP.
- Existing room/chat, checklist, calendar and member/host history remain the feature surfaces. Private guests do not enter public matching. Public privileged metadata/sitemap, Explore and MCP discovery exclude private events. Own attendance-window reads now use caller RLS.
- Private-event memories cannot become profile-visible, including after deletion of their gathering. A durable marker preserves the boundary; the existing editor shows private-only controls.
- FA-first/RTL and English copy, existing Havato semantic tokens/components, loading/failure/retry controls. Existing RU uses English fallback for new strings.

## Verification performed locally
- `node tests/private-gatherings.local.mjs <pglite/dist/index.js> <scratch-schema.json> <scratch-types.ts>`: all **72 committed migrations** replayed unchanged in disposable PGlite 0.5.8 with minimal Supabase platform scaffolding; **84 PostgreSQL/RLS/RPC/schema-type checks pass**. Synthetic legacy minor fixture briefly disables only the local profile trigger to test fail-closed handling; production policies/triggers are never disabled. No hosted credentials are read.
- Focused Vitest suite: **74 passing** across validation/create rules/age/memories, public projections, private matching and six DOM interactions. The matching regression was a separate final one-test run after the 73-test run. DOM uses scratch jsdom 26.1.0; no browser permission, mail or push delivery.
- `node node_modules/typescript/bin/tsc --noEmit`: pass.
- Changed application/new test ESLint with existing Prettier rule disabled: zero errors; two existing i18n Fast Refresh warnings. Preview-only mock modules have six additional Fast Refresh warnings; no lint errors.
- `node node_modules/vite/bin/vite.js build` with dummy backend environment: local Windows client/server/Nitro production build passes. Dependencies reused from the preceding local scratch installation; this is not a fresh frozen-lock install. The PR-specific Linux workflow performs frozen Bun install, SQL/DOM/units, typecheck, lint and build.
- Synthetic browser fixture: **12 layouts** (create, host invites, guest RSVP × FA/EN × 390/1280 widths), no page errors/horizontal overflow, correct RTL/LTR. Inspected rendered Persian mobile create and English desktop invite screenshots. Preview mocks auth/backend/router; it does not prove hosted navigation or real Auth behavior.
- `git diff --check`: pass. New TypeScript fragments are generated/checked from the replayed schema; full hosted regeneration/cache acceptance remains a rollout check.

The restricted Windows sandbox initially prevented Vitest cache renames and Supabase CLI telemetry writes. Local verification succeeded through permitted escalation. No unresolved approval rejection.

## Linux CI and baseline evidence
At implementation commit `b17b8683220f34e86edabd1265eb292cfcc2efdc`, [Phase 6 review](https://github.com/idealgathering-collab/ideal-gathering/actions/runs/38046026442) passed the frozen dependency install, migration replay/database checks, all 74 focused tests (including six DOM interactions), typecheck, focused lint and production build. [Public-site review](https://github.com/idealgathering-collab/ideal-gathering/actions/runs/38046026473) also passed.

[Portable Node CI](https://github.com/idealgathering-collab/ideal-gathering/actions/runs/38046026397) failed its general suite: 436 passed, 16 failed, 17 skipped. The failures are English-text rendering expectations receiving the FA-default output in `life-profile` (4), `life-summary` (4), `member-profile` (2) and `venue-value` (6). All 16 were freshly reproduced on the unchanged base `755a9ed` in an isolated detached checkout with reused local dependencies: 16 failed, 13 passed across those four files. This confirms the baseline issue; no full-suite pass is claimed. The subsequent documentation-only checkpoint does not change application/test/workflow code; final-head CI must still be inspected.

## Database and rollout
One additive migration, `20261010051239_havato_private_gatherings.sql`, generated using the Supabase CLI before adding SQL. It adds `gatherings.visibility`, `gathering_invitations`, `life_moments.private_gathering`, constraints/indexes, restrictive RLS, private caller-checked helpers/definers and invoker RPC entry points. New client roles receive SELECT-only invitation grants; writes go through resource-authorized RPCs. No new auth schema, chat/checklist/photo/history tables, enum changes, data backfill beyond the public default, production application or deployment.

Before release: inspect the Havato target ledger/grants, apply the additive migration to designated staging, reload PostgREST, regenerate/diff hosted types, then deploy only with approval. Test actual moderation/private create/invite/inbox/RSVP/revoke/blocking/memories with synthetic adult accounts. Verify independent-connection last-seat races, real browser navigation, and notification/provider acceptance. PGlite is PostgreSQL execution but serializes one engine; no multi-connection concurrency proof is claimed. Keep RLS/markers if rolling back the UI. Never rollback by changing private rows to public.

## Remaining work / next increment
1. Staging acceptance above; full Phase 6 is not complete or released.
2. Assigned responsibilities (assignee, due/status, permissions) extending checklist; expense entry/splitting/settlement needs an explicit small data contract. No payment integration implied.
3. Shared event notes/album, broader guest history, repeat gathering, and host editing/cancellation UX remain gaps; personal completed memories/history already exist.
4. External invitations, delivery, non-member onboarding, invitation throttling and finer invitee access/expiry controls are deferred. Current invites appear only in My Gatherings for existing eligible members after moderation approval; RSVP closes at start. Revoked/blocked guests lose new database reads, but already received content cannot be recalled.
5. Private venue bookings and coordinates/self proximity check-in are not added: direct private places carry no venue/table linkage. Existing host attendance management remains; guest memory eligibility retains the existing checked-in participation requirement.
6. Phase 5 authentication/provider configuration stays deferred. PR #16 is not merged, deployed or modified.

No merge/deployment, hosted database changes, external emails or idealgathering.com operations.
