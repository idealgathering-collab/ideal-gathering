# Havato Notifications Phase 1 — push foundation

Status: foundation code/schema deployed; real-provider enablement awaits public VAPID configuration.
Approval: explicit user request 2026-10-03, Notifications Phase 1 only.
Branch: `havato`; baseline `0a3c8bd`. Existing product phases accepted complete.

Scope: capability detection, user-action-only permission entry on authenticated
waiting/settings pages, service-worker subscribe/unsubscribe, own-user backend
storage/RLS and public VAPID configuration. Reuse auth/worker/install/theme.
No sends/triggers/chat/preferences/analytics/Bazaar or production changes.

Architecture, exact configuration names, schema/grants and rollback guidance:
[push foundation contract](../docs/PUSH_NOTIFICATIONS.md).

Implementation: direct authenticated PostgREST upsert/read/delete, unique endpoint
and owner RLS, minimal delivery metadata, multi-device support, persistence failure
rollback, session guards and sign-out endpoint revocation. Schema is additive,
without backfill. Generated new table types from executed disposable schema.

Checks: 68 focused unit tests (web-push, Havato Phase 3, waiting registration,
OAuth, venue beta corrections and deployment config), 17 unchanged PWA
install/worker tests, 20 actual disposable PostgreSQL
migration/ownership/constraints/types checks pass. TypeScript passes. Final
focused lint passes with zero errors/warnings; new code passes normal formatting
lint, touched legacy files use the existing formatting-rule exclusion. Windows client/server compilation succeeds, final
Nitro packaging hits the pre-existing EPERM realpath on tslib/modules/index.js.
Existing Linux container CI must verify publication. Actual reusable component
rendering passed Chromium desktop and Android emulation: no initial prompt,
tap-only permission, subscribe/save, unsubscribe/delete, failed-save rollback,
retry without re-prompt, FA/RTL and no horizontal overflow. Screenshots visually
inspected. Auth and Web Push APIs plus backend responses were isolated fixtures;
no physical-device or real provider subscription success is claimed. Full-route
local dev preview hit the baseline React CJS/SSR environment error; standalone
component preview passed after workspace-only Vite runtime/path setup repairs.

Published implementation `cb1aafb7174e7347203f0163320dd969c5a3212a` on `havato`.
API-created tree exactly matches the reviewed staged tree. Exact-commit Linux
container build/stateless startup passed in Actions run 37071466599. Darkube
console confirms deployed image cb1aafb7-b15448, healthy and Running, build
86b8e1cf-ea86-4be7-9eac-df20eff50b91. Live sign-in HTTP 200/Havato confirmed.

Browser access recovered after the user signed in to this chat's pages. Verified
Havato project name/ref before applying the exact additive migration there and
recording its version/name/statements in the hosted ledger. RLS enabled/four
policies confirmed. Hosted SQL effective-authenticated-role ownership tests pass
own CRUD, duplicate/multi-device and denial of cross-user read/insert/update/
delete/reassignment/endpoint takeover. All synthetic users/endpoints rolled back;
no existing account changes or email/push delivery. Initial editor inspection
replacement affected only Monaco's current line; duplicate DDL was rejected and
rolled back. Explicit select-all replacement fixed the inspection, with final
schema/ledger and test success verified.

Public `VITE_WEB_PUSH_VAPID_PUBLIC_KEY` is absent from the verified Havato Darkube
build arguments. No private pair was generated, configured or exposed. This
phase supplies the hooks, as the user requested; actual browser push-provider
subscribe/unsubscribe is not claimed. No sending implementation or Phase 2 work.

Remaining enablement: supply the public half of a securely retained real VAPID
pair in Havato Darkube build arguments, rebuild and verify actual provider
registration/removal. Server private credentials stay in encrypted secrets;
Phase 1 does not consume them. Do not claim end-to-end physical-device success.
Notifications Phase 2 remains sending/worker delivery and stale-endpoint cleanup;
events/chat/preferences remain excluded. Stop here.

## Final live verification

Live Chromium desktop and Pixel 7 emulation at havato-test.darkube.ir passed:
HTTP 200, new notification entry/denied-permission status, disabled Enable, zero
initial prompts, zero installability errors, unchanged manifest/worker/icon bytes
and orange/cream metadata, FA/RTL without overflow, offline fallback and online
session restoration. Auth/REST and empty PushManager lookup used isolated
fixtures; no live account/subscription writes. Headless browser notification
permission remained denied even when an ephemeral test context requested a grant;
this is not physical-device acceptance or actual push-provider registration.
Earlier expected-missing-key assertions were corrected to match the observed
denied-permission state. Live implementation and exact-commit Darkube status
are confirmed. Public key configuration and real-device/provider verification
remain enablement requirements. No sending work started.
