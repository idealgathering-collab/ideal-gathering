# Havato Web Push (Notifications Phases 1–2)

Scope: opt-in subscription registration/removal and secure self-test delivery on
`havato`. No product event triggers, chat push, preferences, analytics or Bazaar
work. Existing static/offline worker caching and install behavior are unchanged.

`PushNotificationEntry` is reused on authenticated `/pending` (members and venues)
and `/settings`. Signed-out pages do not show it. FA/EN copy uses the existing
language choice and theme. It inspects capability and an existing service-worker
subscription without prompting or writing. Enable calls `requestPermission`
directly from the tap, before any await, only with a ready worker and valid public
configuration. Denied permission explains browser/device settings; dismissal is
retryable. iOS outside Home Screen launch shows install guidance.

The existing authenticated Supabase browser client persists directly through
PostgREST. No new privileged endpoint or service-role client is needed. RLS is
the security boundary, including waiting users: clients cannot read, insert,
update, reassign or delete another account's subscription. Globally unique
endpoints prevent one browser endpoint belonging to multiple accounts. Upsert
is idempotent; one user can own multiple endpoints/devices. Only endpoint,
delivery keys, public application-server key, optional expiration, user UUID and
timestamps are retained. No user-agent, device identifier, IP or fingerprint.
Account deletion cascades subscriptions.

Subscription creation reuses a matching browser subscription; changed VAPID keys
cause explicit unsubscribe/re-registration. A missing backend row is repaired
on the next Enable tap. A new subscription is revoked if persistence fails or
the session changes; the UI never reports enabled before saving succeeds.
Unsubscribe deletes this account's endpoint first, then revokes the browser
subscription; failed deletion preserves the endpoint for retry. Sign-out events
(including other tabs) revoke the local endpoint. Revoked/stale hosted rows may
remain after sign-out/reinstallation, because there is no authenticated worker
  session or fingerprint; Phase 2 removes provider-confirmed 404/410 endpoints when sending.
No automatic subscription recreation occurs after sign-out or reinstall.

## Isolated schema rollout

Apply only `20261003090000_havato_push_subscriptions.sql` to verified Havato
project **ntmnpmdjfrbporcvafei**. Do not apply the branch's migration history to
Ideal Gathering production or use a broad production `db push`. This additive
migration creates `push_subscriptions`, four own-user RLS policies, minimal
grants, a user index, delivery-key constraints and an update timestamp trigger.
There is no backfill. Generated table types are derived from the executed
disposable schema by `tests/push-subscriptions.local.mjs --write-types` and
subsequently verified by that same script without the flag; existing unrelated
types are preserved.

Rollout 2026-10-03: applied this exact migration through the signed-in Havato SQL
editor and recorded version/name/statements in `supabase_migrations.schema_migrations`.
Confirmed RLS enabled and four policies. `tests/push-subscriptions.hosted.sql`
passed actual own-user insert/read/upsert/delete, multi-device and denied
cross-user read/insert/update/delete/reassignment/endpoint takeover. All synthetic
accounts/endpoints rolled back; no email or real push sent. Public VAPID build
configuration remains unset, so actual provider registration is not claimed.

Before enabling creation, verify the project identity, execute the additive
migration and verify its RLS/grants with two designated test users. Hosted RLS
verification is separate from disposable PostgreSQL evidence. If rollback is
needed, clear the public build key and rebuild first; retain rows/schema rather
than deleting subscription data. No destructive rollback is automated.

## Configuration and secret contract

- **`VITE_WEB_PUSH_VAPID_PUBLIC_KEY`**: public build-time Docker ARG/Vite variable,
  unpadded base64url P-256 public key (65 bytes beginning with `0x04`). Blank or
  invalid configuration disables Enable without permission prompts. Set in
  Darkube build arguments and rebuild; runtime-only values cannot change an
  already compiled client bundle.
- Keep the corresponding private key in Havato's encrypted server secret store.
  No private key is required or read by Phase 1. Do not generate a throwaway
  production pair, commit a private key, or put it in any `VITE_` variable/ARG.
- Phase 2 runtime names: **`WEB_PUSH_VAPID_PRIVATE_KEY`** (encrypted server secret),
  **`WEB_PUSH_VAPID_SUBJECT`** (owner-controlled `mailto:` or HTTPS contact),
  **`WEB_PUSH_VAPID_PUBLIC_KEY`** (matching public half). Sender validates their
  format and the actual P-256 keypair relationship. Do not rotate keys without
  re-registration. Never put the private half in any frontend variable.
- **`WEB_PUSH_TEST_USER_IDS`**: runtime comma-separated test-account UUIDs. Unset
  means the internal self-test endpoint returns 404, regardless of authentication.
- Existing `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` stay pointed at
  Havato; existing server Supabase credentials remain server-only.

Tests use an explicitly synthetic public-key-shaped fixture, never a live key.
No test sends a real push. Browser lifecycle fixtures do not prove physical
Android or iPhone subscriptions. iOS needs Home Screen launch and supported
OS/Web Push APIs; physical-iPhone success must be verified on an actual device.
See [WebKit's Home Screen permission requirements](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/).

## Phase 2 delivery and verification

`POST /api/push/test` verifies a Supabase bearer token with Auth `getUser`, requires
the exact Havato backend/origin and an allowlisted authenticated account, accepts
only `{ "lang": "en" }` or `{ "lang": "fa" }` (or `{}`), and targets only that
account's stored subscriptions. There is no client-chosen target, endpoint, title,
body or URL. No public test button/preferences page. An optional local operator
script `scripts/test-havato-push.mjs` reads the caller's session token on stdin,
never from command arguments. Do not paste tokens or passwords into chat.

The test path is limited to 20 subscriptions and one attempt per user/minute per
process; current one-replica Havato testing only. No distributed limiter, queue,
automatic retry/scheduler or product event pipeline is claimed. Unknown provider
hosts/path formats are skipped. HTTPS provider allowlist prevents arbitrary
database endpoint strings from becoming server-side requests. Logs and responses
do not contain keys, endpoints, tokens or provider response bodies.

Only provider 404/410 deletes stale rows, guarded by owner, endpoint and the exact
timestamp/keys sent. Refreshed/reassigned rows survive. Other errors retain rows;
failure counts are returned. `accepted` means provider acceptance, NOT delivery
or visible notification. Cleanup occurs during sending, not on a cron.

Payload v1: bounded title/body/tag, language EN/FA, a safe URL. Worker independently
validates payloads, uses Havato icons/badge, sets FA RTL, and shows a generic
visible fallback on malformed/empty pushes. Click closes the notification and
focuses/navigates an existing same-origin window or opens the app. URL whitelist:
`/`, `/pending`, `/settings`, without query/hash/credentials; everything else
falls back to `/`. Session/auth gates are not bypassed. Existing worker caches,
offline fallback, manifest and branding files are unchanged.

`scripts/generate-havato-vapid.ps1` uses standard `web-push` generation and stores
the private half as a Windows user-bound DPAPI SecureString in ignored
`env/.env.vapid.local`, refusing overwrite. Never commit or print that file's
decrypted material. Retain/back up the private half securely; the matching public
half must be configured both as Docker build ARG and server runtime variable.

[Phase 2 exact configuration and acceptance status](../tasks/HAVATO-notifications-phase2.md).
Real subscription and observed-device acceptance remain separate from unit/worker
fixtures. Event triggers remain Notifications Phase 3, preferences Phase 4.
