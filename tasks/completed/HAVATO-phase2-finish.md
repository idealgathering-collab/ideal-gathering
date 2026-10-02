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

## Final acceptance — COMPLETE, 2026-10-02

Implementation published to `havato` as `af01dbfb4aa2db4d38540fa3bd2f228f2994f6e5`. Connected GitHub API published the exact local tree `871215b9589dc0cb29e01151fcb7e8326f7df6c2` with a non-forced fast-forward because this host has no usable Git push credentials. Local unpublished checkpoint c501e9f was reconciled to the identical remote file tree; it is not a deployed commit.

[Linux container build/startup CI](https://github.com/idealgathering-collab/ideal-gathering/actions/runs/36997161867) passed. [Darkube exact-commit build](https://console.hamravesh.com/@havato/darkube/app/b1544805-3e87-4110-b0ba-4b8fb723e103/build_list/bdd52c43-d042-40d2-aa31-12951376c4dc) reports image pushed, deployment OK, build completed successfully; app healthy. Final live [Havato](https://havato-test.darkube.ir) returns HTTP 200 and the approved palette.

Step 5: final live deployed app/SDK tested with synthetic browser-only backend fixtures. Entire Chromium browser process closed/reopened in EN/FA, authenticated settings and root waitlisted redirect preserved. Simulated standalone suppresses install UI. Auth user and existing expiry unchanged. Worker-controlled offline/reconnect restores authenticated route. A separate persistent profile was prepared against the actual previous v1 deployment, closed, then reopened after v2 deployment: worker upgraded, v1 cache removed, same waitlisted session/expiry and saved Farsi/RTL retained. No session/auth fix needed.

Step 6: real native beforeinstallprompt eligibility and zero CDP installability errors in desktop Chromium and Pixel 7 Android emulation. Actual CTA visible while eligible and hidden after simulated appinstalled/standalone signals. Controlled v2 worker, bounded static cache, offline fallback/reconnect pass. Live manifest root start_url, Havato name/short_name, standalone mode and launch colors correct. Approved 180/192/512/1024px icons return 200/image/png and match repository bytes; live worker/offline files match after newline normalization. No push code added (source/diff checked).

Local WebKit iPhone 13 EN/FA browser/standalone metadata, guidance, Escape dismissal and initial/runtime suppression pass at 390px without overflow or page errors. Live WebKit metadata/guidance checks also completed; isolated Windows WebKit ignores certificate errors for external fonts, while Chromium validates live HTTPS normally. Early harness failures were navigation/hydration timing and Windows WebKit persistent-profile behavior; corrected readiness checks passed. Chromium supplies the reliable full-process persistence/worker-upgrade evidence.

Representative actual app screens verified locally and in the final live build: public waitlist, authenticated dashboard/profile/settings, Farsi pending, reopened standalone pending, bilingual offline; authenticated data uses intercepted fixtures only. Profile server-function sections exercised existing empty/error states, not complete backend journeys. Source inspection confirms remaining old purple UI values/classes replaced by palette aliases. Existing artwork/photo content and trait/status categorization were not redesigned.

Android: rely on user-confirmed real-device install/standalone evidence plus final tooling checks; no new physical-device run claimed. iOS: physical iPhone install/Home Screen acceptance explicitly skipped by user and accepted as residual risk. Windows WebKit cannot reproduce SpringBoard, Safari share sheet, safe area/status bar or iOS storage lifecycle. Real-account server expiry/revocation and OS eviction retain existing Supabase/platform behavior; no live account credentials were used or session lifetime extended.

Phase 2 is COMPLETE within this accepted evidence/limitation. Phase 3 was not started. Closure publication changes documentation only; application code is identical to the verified deployment.
