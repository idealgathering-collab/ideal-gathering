# Havato Notifications Phase 4 — preferences and controls

Status: Phase 4 code and infrastructure COMPLETE; final real-device acceptance deferred.
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

140 focused checks pass: 129 logic/store notification unit tests plus 11 actual
React/Radix DOM interaction tests (FA/EN labels/direction, save/error/retry,
account transitions, denied/unsupported, subscription/unsubscription and language).
85 disposable SQL checks pass: 27 preferences/RLS/defaults/constraints/types,
38 existing event/security/scheduling and 20 Phase 1 subscription/RLS/type checks.
35 worker/install/PWA checks pass. TypeScript and focused implementation/test lint
pass. Windows build reaches Nitro then reproduces prior
`tslib/modules/package.json` realpath EPERM. Published implementation-head Linux
CI passes frozen Bun install, 140 unit/DOM checks, 65 SQL checks, PWA checks,
TypeScript/focused lint, container build and stateless startup. No application
dependencies or lockfiles changed; jsdom is installed only in scratch/CI.
Local browser preview has Windows process/network restrictions: actual visual
mobile wrapping/layout is not claimed. Responsive classes inspected and portable
fixture builds; physical FA/EN mobile layout remains on final device checklist.

Applied migration only to Havato `ntmnpmdjfrbporcvafei`, after project/prerequisite
inspection and disposable SQL checks. Transaction includes ledger version/name/
statements and PostgREST reload; SQL Editor reports success. Hosted columns match.
Hosted readback confirms RLS enabled, three own policies, no anonymous access,
authenticated SELECT/INSERT/UPDATE but no DELETE, service SELECT but no UPDATE.
Ledger version/name `20261003150000` / `havato_notification_preferences` verified.
No actual notification or hosted user preference fixture was created.

## Published code and live rollout

Implementation: `2550a5d1bc50459ee026b372724a00c9fbdc5e08` on `havato`.
Connected GitHub publication was needed because Windows Git's credential helper
could not run; published tree `dd2ccc44bb502366293b12cb576a5347393da328`
exactly matches the tested local tree, including line endings.
[Linux container/startup CI](https://github.com/idealgathering-collab/ideal-gathering/actions/runs/37130613955)
passed. [Darkube implementation build](https://console.hamravesh.com/@havato/darkube/app/b1544805-3e87-4110-b0ba-4b8fb723e103/build_list/20b59a9d-3a5c-4925-8bb4-a463365aae5b)
reports pushed image `2550a5d1-b15448`, deployment `OK`, build completed
successfully, app healthy. Live auth, settings and manifest HTTP 200 carry
`x-havato-notifications-phase: 4`; manifest remains Havato/start `/`.
Live worker HTTP 200 matches unchanged repository bytes. The actual served
`push-notification-entry-DfTdzvfh.js` bundle contains preference persistence,
English/Persian controls and notification-language choice. No push request sent.
Authenticated live preference writes/physical push are intentionally left for
the final acceptance pass; DOM/SQL fixtures are not claimed as hosted auth/device proof.

## Exact checks

Local Node commands use the existing modules with workspace TEMP/TMP:
`node node_modules/vitest/vitest.mjs run tests/unit/push-delivery.test.ts tests/unit/push-adapter.test.ts tests/unit/web-push.test.ts tests/unit/push-events.test.ts tests/unit/notification-preferences.test.ts tests/unit/notification-preferences-store.test.ts` (129 pass).
`HAVATO_TEST_JSDOM=<scratch jsdom/lib/api.js> node node_modules/vitest/vitest.mjs run tests/unit/notification-controls.ui.test.ts` (11 pass).
`node tests/notification-preferences.local.mjs <pglite/dist/index.js>` (27),
`node tests/push-events.local.mjs <pglite/dist/index.js>` (38),
`node tests/push-subscriptions.local.mjs <pglite/dist/index.js>` (20).
`node --test tests/pwa-push.test.mjs tests/pwa-service-worker.test.mjs tests/pwa-install.test.mjs` (35).
`node node_modules/typescript/bin/tsc --noEmit` passes.
Focused ESLint on changed implementation/tests passes; preview's Fast Refresh
warning fixed by exporting its fixture component. `git diff --check` passes.
`vite build` fails only at recorded Windows Nitro realpath restriction;
Linux frozen dependency/container/startup verification passes (linked above).

## Files changed

- `src/components/notification-preferences-controls.tsx`, `src/components/push-notification-entry.tsx`: one simple settings card and separate device registration.
- `src/lib/notification-preferences.ts`, `src/lib/notification-preferences-store.ts`: category/default contract and own partial persistence.
- `src/lib/push-events.server.ts`, `src/server.ts`: authorized delivery-time preferences/language and deployment marker.
- `supabase/migrations/20261003150000_havato_notification_preferences.sql`, `src/integrations/supabase/types.ts`: additive ownership schema and verified types.
- `tests/unit/notification-preferences.test.ts`, `tests/unit/notification-preferences-store.test.ts`, `tests/unit/notification-controls.ui.test.ts`, `tests/notification-preferences.local.mjs`: focused logic/storage/DOM/SQL checks.
- `tests/notifications-preview/vite.config.ts`, `fixtures.tsx`, `main.tsx`, `index.html`: isolated actual-component visual fixture, no product route.
- `.github/workflows/havato-container.yml`, `tests/README.md`: repeatable checks with scratch DOM dependency.
- `docs/PUSH_NOTIFICATIONS.md`, `tasks/current.md`, this archived `tasks/completed/HAVATO-notifications-phase4.md`: architecture/checkpoint/acceptance record.

No Phase 4 code/migration work remains. Prior delivery limitations remain:
claimed attempts may be lost on crashes/provider timeouts/read failures, no
automatic retry; reminders require server availability; ten recipients per minute.
Suppressed claimed events are not replayed. App/header language remains browser-local;
notification language is an explicit independent saved setting.

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
