# Havato Notifications Phase 1 — push foundation

Status: implementation verified locally; hosted rollout pending.
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

Hosted migration/public VAPID build key are NOT configured or verified. User
confirmed existing signed-in sessions, but browser control twice timed out and
computer-use initialization/retry timed out. No hosted accounts/subscriptions
were written and no private key was created or exposed. Subscription code is
safely disabled when the public key is absent.

Next: publish only havato; verify exact-commit
Linux CI and live bundles/PWA health. Restore supported browser access, confirm
Havato project identity, apply the tested additive migration there, configure
the public half of a retained VAPID pair in Havato Darkube build arguments and
verify hosted own-user registration/removal. Do not label Phase 1 fully complete
until those hosted steps close. Stop before Notifications Phase 2.
