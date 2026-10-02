# Havato Phase 2 — approved finish pass

Approval: explicit user request, 2026-10-02. Branch `havato`; baseline `36d328be7d6e22a5c6e5d7d6fd80d83291310e73`.
Scope: approved app palette migration, Step 5 session/reopen verification, Step 6 final PWA checks, publish and verify existing Darkube deployment. Stop before Phase 3.

## Implementation

Shared CSS semantic tokens use primary #E87524, primary dark #D96C1F, primary light #F3A15C; background #FBF3EA, card/popover #FFF9F2, secondary/muted/accent #F5E7D8; foreground #2B1F1A, muted foreground #6F5A4F; border/input #E8D8C8, ring primary; gold #D9A441, success #4F7A5A, warning #C28A2E, destructive/error #B94B3F, info #557A8C. Sidebar follows these surfaces/text. Legacy cosmic/plum aliases map to approved colors, preserving components/layouts. Primary button text uses dark text for contrast on orange. Photo-overlay text remains white.

Minimal remaining purple classes/values in profile/public/pending/invite/preview components replaced; old dark backdrop now uses palette surfaces. Public waitlist CSS uses shared tokens. Root no longer permits an old environment override to replace the approved primary. Browser/manifest/offline colors match the app. Icons unchanged. Worker cache advances v1 to v2 to refresh the precached offline page; worker caching policy unchanged.

No session/auth/backend/rules/waitlist/venue/admin/owner behavior change, database writes, migrations, push additions or native packages. No Ideal Gathering production access. Existing sessionStorage-only invite/admin-preview choices and unsaved form state retain their original lifetime; they are not account sessions or durable drafts.

## Local verification

- `node --test tests/pwa-install.test.mjs tests/pwa-service-worker.test.mjs`: 17 passed.
- `node node_modules/vitest/vitest.mjs run tests/unit/branding.test.ts tests/unit/deployment-config.test.ts tests/unit/profile-card.test.ts tests/unit/profile-data.test.ts`: 48 passed. Default brand-color expectation updated.
- `node node_modules/typescript/bin/tsc --noEmit`: passed.
- Focused ESLint on changed TS/TSX with `--rule 'prettier/prettier: off'`: 8 pre-existing no-case-declarations errors in profile-completion.ts; exact original-file comparison confirms same lines/rules. Formatting exclusion retained from earlier PWA checks. No unrelated lint cleanup.
- Chromium real persistent browser profile: entire process closed/reopened, actual app and SDK restore synthetic signed-in/waitlisted sessions and saved EN/FA language. Root launch returns to pending when beta closed; settings remains authenticated when access allowed. Standalone signal simulated. Session expiry unchanged. Worker control, update check, offline navigation, reconnect and restored auth passed. Development worker registered explicitly because production-only registration is intentional.
- Representative visual checks: public waitlist, authenticated dashboard/profile/settings, Farsi pending/reopened standalone and bilingual offline. All backend requests intercepted with synthetic fixtures; no live login or production backend operation is claimed. Profile server-function data sections use the existing empty/error states because fixtures do not supply a real backend.

## Remaining publication checks

Publish implementation, confirm Linux container build, verify final live manifest/assets/colors/worker/install eligibility/CTA and WebKit. Record exact commit and rollout results here. Android physical-device success is user-provided existing evidence. User explicitly waived physical iPhone acceptance; record as accepted residual risk, not a closure blocker.
