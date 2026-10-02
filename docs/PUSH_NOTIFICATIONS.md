# Havato Web Push foundation (Notifications Phase 1)

Scope: opt-in subscription registration/removal only, on `havato`. No sender,
push-event handler, event triggers, chat push, preferences, analytics or Bazaar work.
The existing static/offline service worker and install behavior are unchanged.

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
session or fingerprint; Phase 2 must remove expired/410 endpoints when sending.
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
- Reserved Phase 2 names: **`WEB_PUSH_VAPID_PRIVATE_KEY`** (server secret),
  **`WEB_PUSH_VAPID_SUBJECT`** (server contact, `mailto:` or HTTPS). These are
  documented names only; this phase does not implement a sender consuming them.
  Phase 2 should read the matching public key server-side from
  **`WEB_PUSH_VAPID_PUBLIC_KEY`**. Do not rotate keys without re-registration.
- Existing `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` stay pointed at
  Havato; existing server Supabase credentials remain server-only.

Tests use an explicitly synthetic public-key-shaped fixture, never a live key.
No test sends a real push. Browser lifecycle fixtures do not prove physical
Android or iPhone subscriptions. iOS needs Home Screen launch and supported
OS/Web Push APIs; physical-iPhone success must be verified on an actual device.
See [WebKit's Home Screen permission requirements](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/).

Phase 2 remains secure VAPID configuration and delivery, worker visible-message
handling/click behavior, sender egress/endpoint validation, expired/revoked
endpoint cleanup and sending verification. Event triggers remain Phase 3.
