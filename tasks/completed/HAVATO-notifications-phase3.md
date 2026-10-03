# Havato Notifications Phase 3 — product event delivery

Status: Phase 3 code and infrastructure complete; real-device acceptance deferred. User explicitly approved Phase 3 implementation, publication
and Havato deployment on 2026-10-03. Baseline `0fb6f92a0e6c1479ee2ec5938d607b6c78227c8a`.
Branch `havato`. This approval supersedes the historical Phase 2 acceptance gate:
finish notification code phases first; defer real-device acceptance until afterward.

## Approved scope and implementation

Reuse Phase 2 delivery, including provider restrictions and snapshot-safe 404/410
cleanup. No preferences UI, Bazaar/TWA/APK, unrelated refactor, or Ideal Gathering
production/Supabase access. Existing authorization/business writes are unchanged.

Database AFTER triggers capture committed successful joins (confirmation to joining
member), approved gathering detail/time/location changes and approval transitions,
cancellations (host/current attendees), beta launch and profile readiness (ready
members/approved venue owners), venue approval/rejection (current venue owner), and
the existing `gathering_messages` INSERT path (other current room members).
No gathering-invitation or join-request schema exists; these are deliberately
deferred rather than invented. Unredeemed beta invitation emails, invitation codes
and new email/sign-up notifications are deferred: no safely identified subscribed
account at that point. Invitation redemption that advances a ready profile is
covered by the profile readiness trigger when beta access is actually available.

## Templates and privacy

Typed server-only EN/FA templates contain generic event copy. No names, subjects,
addresses, message bodies, invitation codes, rejection reasons or client-selected
title/body/URL. Existing browser-local language cannot be trusted/read by server;
production uses Havato's Persian default. English builders are ready. No new
language/preference system. Existing safe `/` and `/pending` destinations retain
auth/beta gates; worker and offline/install/cache behavior are unchanged.

## Data, targeting and rollout

Applied only `20261003120000_havato_push_events.sql` to Havato project
`ntmnpmdjfrbporcvafei`, after prerequisite inspection and disposable SQL checks.
Hosted metadata confirms six capture triggers, RLS enabled, no authenticated
table/claim/recheck privileges, service-role claim allowed, and migration ledger
recorded. PostgREST schema reload notified. No hosted fixture/product writes.
New event table has no client privileges or RLS policies; private trigger helpers
and service-only claim RPC. No backfill or changes to existing product RLS.
Event recipient IDs come from committed rows, never client push input.
Dispatch checks current email verification, existing beta/member/venue access,
room membership, current venue ownership/status, gathering state, host blocking,
sender blocking and current message existence. Pending venue decisions may notify
their verified owner before launch; they reveal only a generic review result.
Zero subscriptions are normal. Events store only IDs, kind, state/time snapshot
and timestamps, never product text. Deleted accounts cascade events.

## Scheduling and dedupe

Existing long-running Nitro/Node server starts one unref'ed 60-second interval
and an initial pass when loaded. Havato backend identity and valid matching
VAPID configuration are required before starting. No public dispatcher endpoint,
new service, cron secret or external scheduler. Every pass creates reminders for
approved future gatherings inside a single lead window (default 60 minutes,
optional `WEB_PUSH_REMINDER_LEAD_MINUTES`, integer 1–1440). Server must be running;
downtime catches up only before start. Rescheduling creates a new reminder identity.
Unique event key + recipient prevents duplicates; host/attendee UNION avoids
overlapping membership duplicates. Message ID keys identify the persisted write;
other committed transitions get one UUID shared across recipients. Reminder key
uses gathering ID + start epoch. Database SKIP LOCKED atomically marks at most ten
rows per pass claimed BEFORE delivery; process overlap guard avoids timer pileups.
Claims are terminal, no automatic retry: crashes/timeouts can lose a notification,
but do not repeat it. This is at-most-one application attempt, not exactly-once
provider/device delivery. Chat expires after five minutes; reminders expire at
start, other events after one day. Event history retained seven days; bounded
batch throughput is appropriate for the current small beta, not bulk campaigns.

## Verification checkpoint

38 disposable PostgreSQL checks passed against actual migration SQL with synthetic
product/helper scaffolding. Includes implemented triggers, scope, stale states,
blocking, access, email verification, client grants, schedule and repeat claims.
Hosted authorization/real browser push is separate; never claim it from mocks.
111 focused unit tests (including 20 Phase 3 tests), 35 PWA/worker/install checks,
TypeScript and focused lint pass. Windows Vitest temporary rename restriction was
resolved by setting TEMP/TMP to a workspace scratch directory; no repo tooling
change. Windows production build reaches Nitro packaging and reproduces the known
EPERM asynchronous realpath restriction. Frozen dependency/Linux container CI
passed for both published implementation and normalization heads. npm ci was unavailable because the
existing npm lockfile lags package.json; preserved both lockfiles and reused the
Phase 2 installed modules locally. Linux uses the authoritative frozen Bun graph.

Recovery: pause timer by removing server VAPID configuration (preserve encrypted
private-key backup); remove only the new capture triggers if needed. Retain event
table/history rather than destructive cleanup. No broad migration replay.

## Remaining

No Phase 3 code or rollout work remains. Provider/device acceptance remains
intentionally deferred until the code phases finish.
Phase 4: notification controls/preferences and delivery selection, followed by
explicit supported Android/iPhone subscription/provider/display/click acceptance
across Phases 2–3. Physical-device acceptance intentionally deferred by the user.

## Published implementation and rollout

Implementation: `856ee1aba0017bc31abbb7fd348e34b4b49b13c9`.
Line-ending preservation: `8478e6122d6fbf5b79791be6c5fa7dce311bed3a`.
Both published Linux CI runs pass; [current implementation-head run](https://github.com/idealgathering-collab/ideal-gathering/actions/runs/37122540901)
includes frozen Bun dependencies, focused tests, Docker build and stateless startup.
Darkube [build b06414bf-04d4-4e4f-8939-142dad48ba54](https://console.hamravesh.com/@havato/darkube/app/b1544805-3e87-4110-b0ba-4b8fb723e103/build_list/b06414bf-04d4-4e4f-8939-142dad48ba54)
shows image `8478e612-b15448`, deploy OK and build completed successfully; app healthy.
Live auth returned HTTP 200 with `x-havato-notifications-phase: 3`; manifest and
worker returned 200 with Havato branding. Disabled self-test returned 404 JSON.
A later browser check loads the Persian Havato sign-in page correctly. Repeat
shell HTTP checks encountered local DNS resolution failure; no full repeated
HTTP suite or final live worker byte comparison is claimed. Worker source is
unchanged and its focused regression checks pass. No actual push was sent.

Changed files: `src/lib/push-delivery.server.ts` (shared sender),
`src/lib/push-events.server.ts` (templates/dispatcher), `src/server.ts` (timer),
`src/integrations/supabase/types.ts` (verified RPC shapes),
`supabase/migrations/20261003120000_havato_push_events.sql` (events/security),
`tests/unit/push-events.test.ts`, `tests/push-events.local.mjs`,
`.github/workflows/havato-container.yml`, `env/.env.example`,
`docs/PUSH_NOTIFICATIONS.md`, `tasks/HAVATO-notifications-phase2.md`,
`tasks/current.md`, and this archived completion record.

No preferences/final acceptance/Bazaar work started. Phase 4 remains notification
preferences and controls, then real Android/iPhone subscription, provider, display
and click acceptance across Phases 2–3, explicitly deferred by the user.
