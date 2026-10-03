# Havato Notifications Phase 2 — secure delivery infrastructure

Status: Implementation complete; publication and live verification in progress.
Approval: User request on 2026-10-03, Notifications Phase 2 only.
Branch: `havato`; baseline `8b49c7cde351b10bf30454076e428ec1e824dc21`.

## Scope and architecture

Existing authenticated subscription UI/store, Havato Supabase project
`ntmnpmdjfrbporcvafei`, and static/offline worker retained. No Ideal Gathering
production access/change, event triggers, notification preferences, Bazaar/TWA,
or unrelated refactor. New Node server-only `web-push` delivery adapter uses the
existing service-role client; the browser never imports it or receives private keys.

`POST /api/push/test` is internal, absent (404) unless runtime
`WEB_PUSH_TEST_USER_IDS` explicitly lists designated test-account UUIDs. It
verifies the bearer token with Supabase Auth `getUser`, enforces same Havato
Origin and the exact isolated backend, then fetches only that authenticated
user's subscription rows. Request accepts only optional `lang: en|fa`; no client
target IDs, endpoints, arbitrary content or URLs. One attempt per minute per
allowed user per process; at most 16 allowlisted accounts and 20 subscriptions.
The current single-replica test deployment fits this bound. Distributed rate
limiting/queues are not claimed and require design before product triggers.

Provider egress accepts only recognized FCM, Mozilla, Apple and WNS HTTPS
hosts/path shapes, no credentials/ports/arbitrary hosts; unknown providers are
skipped, never deleted. Standard library encryption/VAPID, TTL 300 seconds,
10-second provider timeout. JSON response gives aggregate accepted/removed/
failed/skipped counts, no endpoint/key/user details. Provider acceptance does
not prove device receipt. Logs contain fixed error codes and numeric status only.

404/410 responses delete only the authenticated owner's exact sent snapshot,
including endpoint, update timestamp and all subscription keys. Concurrent
refresh/reassignment cannot be deleted by this stale response. Other failures,
obsolete VAPID registrations, unknown endpoints and cleanup errors retain rows.
Cleanup happens when sending, not via a new cron or background sweep.

Worker shows a visible Havato notification for versioned validated EN/FA payloads
and a generic fallback for empty/malformed pushes. Existing icons/badge, FA RTL,
bounded title/body/tag. Payload cannot override assets or arbitrary data.
Clicks close the notification, focus a matching app window, otherwise navigate
and focus an existing same-origin window, or open a safe app URL. Only `/`,
`/pending`, `/settings` without queries/fragments are allowed; foreign/scheme/
credential/untrusted routes fall back to `/`. Authentication still applies.

## Configuration checkpoint

Generated a real matching pair with `web-push.generateVAPIDKeys`. Private half
retained in user-bound Windows DPAPI-encrypted ignored `env/.env.vapid.local`;
never printed, committed, put in a Docker ARG or copied into client code.
The helper refuses automatic overwrite/rotation. Tool security contexts required
an RSA-OAEP encrypted transfer, not a plaintext intermediate private-key file.

Darkube app verified: Havato organization, app `havato-test`, repository
`idealgathering-collab/ideal-gathering`, branch `havato`, app ID
`b1544805-3e87-4110-b0ba-4b8fb723e103`.
Configured runtime `WEB_PUSH_VAPID_PRIVATE_KEY` in encrypted secrets and
`WEB_PUSH_VAPID_PUBLIC_KEY`, `WEB_PUSH_VAPID_SUBJECT` in runtime variables.
Subject uses the owner-controlled Havato HTTPS app URL, no invented mailbox.
Configured matching public `VITE_WEB_PUSH_VAPID_PUBLIC_KEY` as Docker build ARG.
Saved settings; exact new-code deployment verification remains below.
Existing runtime Supabase variables are unchanged. Test account allowlist remains
unset deliberately: there is no signed-in Havato test account in this browser.

## Database/RLS impact

No migration, schema/grants/RLS change, hosted DB test or synthetic account write.
Existing Phase 1 ownership policies unchanged. Sender scopes privileged reads
and conditional deletes explicitly; adapter unit test asserts these selectors.
Prior hosted RLS passes are historical evidence, not a new Phase 2 run.

## Checks and remaining acceptance

- Focused unit sender/config/URL/egress/auth/rate/error tests and Phase 1 lifecycle
  regression checks run locally; final exact count recorded after final validation.
- Worker receive/display/click and existing install/offline suite: 35 passed.
  These are isolated worker fixtures, not provider/device receipt.
- Focused lint run; final result recorded after final validation.
- Windows Bun temporary directory access fails with EBADF; npm fallback uses
  task-local filesystem compatibility helpers (untracked). Initial npm-ci refused
  the already-stale npm lockfile. It was not broadly regenerated.
- Local fallback dependency drift initially produced an unchanged `__root.tsx`
  router type mismatch; locked-version Linux CI is the authoritative check.
- Added only the Web Push dependency graph to authoritative Bun lock from
  registry metadata/integrities; frozen install/container CI must confirm it.
- Current live app remains healthy at baseline before publishing. Real app
  `/pending` redirects to sign-in: no logged-in Havato account is available.
- Real provider subscription/persistence: NOT VERIFIED. No actual notification
  sent, received, displayed or clicked; no physical Android/iPhone claim.
- Owner verification action: sign in to a designated Havato test account on a
  real supported browser/device, allowlist that account UUID in runtime
  `WEB_PUSH_TEST_USER_IDS`, enable notifications by explicit user tap, and run
  the self-only test. Do not supply credentials/session tokens in chat.

## Safe manual test path

After subscription enablement, send its current account's session token via
stdin to `node scripts/test-havato-push.mjs [fa]` from a private local terminal.
Never put it in command arguments, source or chat. Record aggregate provider
status separately from observed OS notification and click behavior. Verify
subscribe/save/unsubscribe/remove against the live backend, without fixtures.
Clear the test allowlist after verification; sender then returns 404 again.

## Phase 3 boundary

Product event triggers (invites, reminders, chat, approvals) remain entirely
unimplemented. Do not begin them or Phase 4 preferences until this real-device
Phase 2 acceptance gate is resolved and separately authorized.
