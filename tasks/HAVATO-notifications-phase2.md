# Havato Notifications Phase 2 — secure delivery infrastructure

Status: Infrastructure configured, published and deployed; real-provider/device acceptance blocked on owner sign-in. Overall Phase 2 is not marked complete.
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
Saved and read back the setting on a freshly loaded settings page: exact retained
public key matches. The CI editor prepended rather than appended the new row;
early incomplete edits did not persist. Filled the actual new row and verified
all three original arguments plus the public key persisted before rebuilding.
The runtime entries also persisted on a freshly loaded page: public half matches
and private half is listed exclusively as a masked encrypted secret.
Existing runtime Supabase variables are unchanged. Test account allowlist remains
unset deliberately: there is no signed-in Havato test account in this browser.

## Database/RLS impact

No migration, schema/grants/RLS change, hosted DB test or synthetic account write.
Existing Phase 1 ownership policies unchanged. Sender scopes privileged reads
and conditional deletes explicitly; adapter unit test asserts these selectors.
Prior hosted RLS passes are historical evidence, not a new Phase 2 run.

## Checks and remaining acceptance

- Focused unit sender/config/URL/egress/auth/rate/error/adapter tests and Phase 1
  subscription lifecycle regression checks: 91 passed in three files.
- Worker receive/display/click and existing install/offline suite: 35 passed.
  These are isolated worker fixtures, not provider/device receipt.
- Focused lint for server and the two new unit files: passed.
- TypeScript: passed locally after pinning the TanStack versions already in Bun
  lock; no source repair or tracked dependency upgrades were needed.
- Local Vite build using a dummy backend: passed using task-local filesystem
  compatibility helpers. Browser output scan found no server/private material.
  Local process listened; HTTP from a separate command timed out in this sandbox.
- Windows Bun temporary directory access fails with EBADF; npm fallback uses
  task-local filesystem compatibility helpers (untracked). Initial npm-ci refused
  the already-stale npm lockfile. It was not broadly regenerated.
- Local fallback dependency drift initially produced an unchanged `__root.tsx`
  router type mismatch; locked-version Linux CI is the authoritative check.
- Added only the Web Push dependency graph to authoritative Bun lock from
  registry metadata/integrities. Exact-commit Linux CI run `37113320146` passed:
  frozen install, the focused checks, TypeScript, lint, Docker build, stateless
  non-root startup, Havato health/manifest, and existing server-secret sentinel scan.
- Implementation `278dc99a4470a2611ce5778508661262c8070d3d` committed and pushed to
  `havato`. Initial Darkube build `8f82123c-3d42-497e-bf13-28312d60bcdb` completed
  successfully, including deploy. Live auth HTTP 200; new worker push/click code
  present; disabled internal endpoint returns HTTP 404 JSON `Not found`.
  That first image's served notification chunk did not yet contain the public
  key. An early repeat build used the unchanged persisted settings; a final
  rebuild followed after the new argument was correctly saved and freshly read back.
- Real app `/pending` redirects to sign-in: no logged-in Havato account is
  available. No browser permission request/subscription was performed by the agent.
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

## Final infrastructure/live checkpoint — 2026-10-03

- Darkube build `90552293-7717-4dd5-bb0a-aa5c4c707f32` for implementation
  `278dc99a4470a2611ce5778508661262c8070d3d` completed build/push/deploy successfully.
  Image tag `278dc99a-b15448`, digest
  `sha256:4f65f86373dc8252ca74666e356aaca3c25041fe551c6969edb8c3080e480bba`.
- Live auth returns HTTP 200. Live
  `assets/push-notification-entry-D_nzYsBX.js` returns HTTP 200 and contains the
  exact retained matching public key (value intentionally omitted).
  The other intermediate emitted filename is not a live asset; no success claim
  relies on it. Public key is now genuinely compiled in, not just an editor value.
- Live `/sw.js` matches committed worker source after newline normalization.
  Live manifest still names Havato; cache/install/offline source unchanged.
  No authenticated waiting/venue acceptance or physical install was re-run.
- Live `POST /api/push/test` returns 404 JSON `Not found` while test allowlist is
  unset. This confirms disabled runtime behavior, not authenticated send success.
- VAPID build/runtime configuration is no longer a blocker. Only
  `WEB_PUSH_TEST_USER_IDS` still needs a designated authenticated test account.
- No real provider subscription, subscription DB persistence, actual provider
  acceptance, OS notification display or actual click has been verified.
- One precise owner action to resume acceptance: sign in to a designated Havato
  test account in the retained browser tab. Do not send a password/session token
  in chat. The agent can then configure the account allowlist and coordinate
  explicit notification permission and real-device self-test verification.
- This verification update is published separately from implementation. Its
  auto-deployment contains identical application code; final chat reports the
  subsequent documentation head and its observed deployment status.

## Phase 3 boundary

Superseded by explicit user authorization on 2026-10-03: implement Notifications
Phase 3 now, complete code phases first and defer real-device acceptance until
afterward. [Current Phase 3 scope and checkpoint](completed/HAVATO-notifications-phase3.md).
The historical gate below no longer blocks Phase 3.

Product event triggers (invites, reminders, chat, approvals) remain entirely
unimplemented. Do not begin them or Phase 4 preferences until this real-device
Phase 2 acceptance gate is resolved and separately authorized.
