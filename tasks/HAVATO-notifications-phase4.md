# Havato Notifications Phase 4 — preferences and controls

Status: implementation and migration complete; final checks/publication/deployment pending.
User-approved scope on 2026-10-03, branch `havato`, baseline
`b67462367e0c0fabf5e508a80eb8194db0ee64e8`.

## Approved problem and scope

The production push events have no user controls. Add a simple Settings section
with account-wide master/categories, separate device subscription controls,
Persian/English copy, ownership-scoped persistence and delivery-time selection.
Keep all existing product state, authorization, sender/provider cleanup, worker,
install/offline, branding and event capture unchanged. No Ideal Gathering production,
final real-device acceptance, Bazaar/TWA/APK or unrelated refactor.

## Implementation and UX

Extend the existing `PushNotificationEntry`, replacing obsolete pre-release copy.
One master and four category switches reuse semantic tokens/Radix Switch, with
44px label rows, wrapping copy, Persian RTL and English LTR. Categories remain
available without a local subscription because choices apply across devices;
master-off disables category edits but preserves choices for re-enabling.
Loading failures expose retry rather than pretend enabled defaults; failed saves
retain the last confirmed values. Account changes clear stale controls; concurrent
saves are blocked. Existing permission/subscribe/unsubscribe, denied/unsupported
states and iOS Home Screen instructions remain. Device-off does not set master-off.

Categories: reminders; gathering changes/cancellations/join confirmations; chat;
account readiness/beta launch and venue approval/rejection. Every boolean defaults
true, including absent rows, preserving current delivery for existing/new users.

## Data/security/language

Additive `20261003150000_havato_notification_preferences.sql`: one row per auth
user, five non-null booleans, checked `fa`/`en` language (default Persian), FK
account deletion cascade. Authenticated own SELECT/INSERT/UPDATE policies enforce
ownership on both old/new rows. No anonymous access or client delete (deleting a
row must not silently reset an opt-out); service role has SELECT only. No backfill,
new secrets, privileged preference writer or modifications to existing RLS.
Partial upserts preserve unrelated preferences, including changes on other devices.
Database types checked from actual disposable schema using the existing Phase 1
bounded schema-fragment approach, and compared with hosted column metadata.

Preferences are read after current event-recipient authorization, immediately
before shared push delivery. Master/category-off skip only push delivery; event
records/product writes remain untouched. Already queued events get the latest
choice. Read errors fail closed. Zero subscriptions/stale cleanup remain unchanged.
Suppressed claimed events are terminal, consistent with existing at-most-one
attempt behavior; they are not replayed when preferences are re-enabled.

Explicit Settings notification-language choice persists FA/EN for server templates.
UI/header language remains browser-local and independent; no broad localization
sync/refactor. Absent preference row uses Persian. No product/private details in copy.

## Verification/rollout checkpoint

129 focused notification unit tests; 26 preference SQL checks before adding the
schema-derived type check; 38 existing event SQL and 35 worker/install/PWA checks
pass. TypeScript and focused implementation lint pass. Windows build reaches Nitro
then reproduces prior `tslib/modules/package.json` realpath EPERM. Linux CI is the
authoritative container/startup gate. Local browser/preview and persistent runtime
have Windows process/network restrictions; actual visual mobile/RTL acceptance
is not claimed. DOM controls suite and portable fixture preview added for focused
verification; pending results must be recorded before completion.

Applied migration only to Havato `ntmnpmdjfrbporcvafei`, after project/prerequisite
inspection and disposable SQL checks. Transaction includes ledger version/name/
statements and PostgREST reload; SQL Editor reports success. Hosted columns match.
Hosted grant/RLS readback, publication, CI and Darkube/live verification pending.
No actual notification or hosted user preference fixture was created.

Recovery: revert application code before removing schema; retain preferences to
preserve user opt-outs. Do not drop preference rows or alter unrelated migrations.

## Exact final real-device acceptance checklist (separate task)

- Android installed PWA: launch, sign in, Settings, explicit enable permission,
  subscription persisted to the correct user/device, reopen/reload registration.
- iPhone/iPad: normal browser Home Screen guidance, supported iOS Home Screen PWA
  launch, explicit permission, subscription persistence/reopen.
- Designated test account only: enable the existing allowlisted self-test briefly;
  verify actual provider acceptance, OS display/icon/badge, FA/RTL and EN copy.
- Tap with existing/closed app: safe destination, focus/open behavior, auth/beta
  gates; no duplicate window or leaked lock-screen product details.
- Production fixtures: successful join; approval/update/cancellation; reminder;
  persisted chat message; beta/account readiness; venue approval/rejection. Verify
  correct eligible recipients, privacy, dedupe and stale/access/blocking rejection.
- Master-off on one device suppresses every production category on all devices;
  re-enable restores future delivery. Toggle each category off/on, verify only that
  category is suppressed/allowed; queued events respect changes before dispatch.
- Verify persisted FA/EN push-language selection across devices and Persian
  fallback for users without a row.
- Device unsubscribe leaves other device subscriptions/account categories intact;
  no further push to that device; subscribe again, logout/account switch, reinstall.
- Denied/dismissed/unsupported/offline/error states: no repeated prompt, retry works;
  real mobile FA/EN keyboard, focus, wrapping and RTL layout.
- Stale endpoint 404/410 cleanup remains correct; zero subscriptions is a no-op.
- Remove temporary self-test allowlist, verify disabled endpoint and record evidence.

Stop after code rollout. No checklist action above is performed in Phase 4.
