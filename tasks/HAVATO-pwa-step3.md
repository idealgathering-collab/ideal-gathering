# Havato PWA Phase 2 — Step 3

Status: Published and live browser verification passed; physical Android installation remains unverified.
Approval: user request, 2026-10-01, Step 3 only; commit/push havato and allow existing Darkube auto-deploy.
Branch: havato. Baseline: e462a85f061d9fb65e24814fe5cda4eabfb0b3c3.

## Objective and evidence

User reports desktop installation works but Android currently offers only a shortcut. Provide an in-app native install entry and diagnose Android eligibility without unrelated changes.

Confirmed gap: no beforeinstallprompt capture or install CTA existed. Live https://havato-test.darkube.ir serves HTTPS landing/start URL and manifest with HTTP 200, application/manifest+json, standalone display, root start URL (therefore inferred root scope), name/short_name, and valid 192/512 PNG icons with image/png and exact dimensions. /sw.js returns HTTP 200 with JavaScript MIME and the unchanged Step 2 worker. No manifest-level Android blocker found. The user's device-specific shortcut cause is not established by these checks. Chrome engagement/installed state and Android WebAPK provisioning need device evidence. Requirements consulted: https://web.dev/articles/install-criteria and https://web.dev/learn/pwa/installation.

## Implementation / UX

Eager root import initializes one browser-only install controller before React mounts, retains the native event across routes, prevents default promotion and publishes eligibility through useSyncExternalStore. The public home/waitlist component adds only a secondary bilingual Install Havato button under the existing introduction. Hidden until native eligibility; pending prompt disables duplicate taps; prompt called synchronously from the tap before awaiting choice; consumed events are never reused. Dismissal/error clears eligibility, and a later fresh event can reoffer. appinstalled and standalone/fullscreen/minimal-ui/window-controls-overlay suppress the CTA. No persistent installed flag that would incorrectly survive uninstall. Acceptance alone never claims installation.

iPhone/iPad use a minimal existing accessible dialog describing Safari > Share > Add to Home Screen > Add; no native Android prompt attempt. Browsers without an install event get no misleading shortcut fallback. Already installed state outside standalone relies on Chromium withholding beforeinstallprompt; iOS cannot reliably detect an existing installation from an ordinary Safari tab.

## Constraints / data

Step 1 manifest/icons and Step 2 service worker/caching/offline behavior are unchanged. No backend, database, migration, auth, waitlist submission, venue/admin/owner changes. No production Ideal Gathering changes, APK, push notifications, full iPhone testing or dependency/lockfile changes.

## Focused checks

- node --test tests/pwa-install.test.mjs tests/pwa-service-worker.test.mjs: 14 passed. Covers early capture, one-use synchronous prompt, dismissal, appinstalled, standalone transitions, iPhone/iPad and prompt error; existing nine worker tests preserved.
- node node_modules/typescript/bin/tsc --noEmit: passed.
- node node_modules/eslint/bin/eslint.js src/lib/pwa-install.ts src/components/landing/havato-install.tsx src/components/landing/havato-waitlist.tsx src/routes/__root.tsx --rule 'prettier/prettier: off': passed (same formatting-rule exclusion as Step 2).
- node --check public/sw.js and git diff --check: passed.
- Isolated local Edge/Chromium on actual application, dummy backend only: Android-size and desktop CTA hidden before eligibility, simulated native event captured/prevented, one prompt invocation, disabled pending state, appinstalled suppression; iPhone instructions open/close; standalone hidden; all four modes have no overflow or page errors. Mobile screenshot reviewed. These simulated events do not prove WebAPK installation.
- Live pre-publication Chrome with fresh non-incognito persistent profiles: desktop and Android emulation both report zero Page.getInstallabilityErrors and emit a real beforeinstallprompt event; manifest parser reports no errors, inferred root scope/id and standalone display. Desktop has an active root worker; Android first-load registration was still activating during the snapshot, with active control already confirmed in the preceding isolated mobile context. No physical Android/WebAPK claim. An earlier incognito run correctly reported only in-incognito; repeated with normal profiles to verify native eligibility.
- Existing Linux container CI builds on push; no broad repo test/audit or redundant local Windows production build.

## Remaining acceptance criteria

- Verify published frontend, unchanged manifest/icons/worker, live native install event and desktop/mobile Chromium diagnostics.
- Observe Darkube public rollout; distinguish it from dashboard deployment status.
- Physical Android Chrome: tap Install Havato, complete a proper app installation, launch standalone from the home screen, and confirm CTA absent. Investigate device/Chrome/WebAPK errors if it still produces a shortcut. No physical Android device is attached here. Stop after Step 3.

## Publication and final live verification

Implementation commit: 2992f4b00e6f57a259da99c3f6a1d039daa8234b, pushed to havato through the authenticated GitHub connector. Linux container build/startup verification passed: https://github.com/idealgathering-collab/ideal-gathering/actions/runs/36893531923. Public Darkube auto-rollout observed: updated controller and CTA in live bundles, all 20 inspected script responses HTTP 200.

Post-rollout Chrome with fresh normal persistent profiles: desktop and Android emulation both emit a real beforeinstallprompt, show the actual Install Havato button, invoke the browser's native prompt once when tapped and disable the button while waiting. Both report zero CDP installability errors, secure context, active root service-worker control and no horizontal overflow. /manifest.webmanifest and 192/512 icons return correct MIME and HTTP 200; /sw.js is byte-for-byte unchanged after newline normalization; /auth?mode=signin and /waitlist return HTTP 200. No form submissions or backend changes. Darkube dashboard status was not inspected; deployment is confirmed from publicly served code and browser behavior.

Confirmed defect addressed: missing in-app install event handling/CTA. No site-side Android eligibility failure was reproduced, including before the change. Physical-device shortcut behavior is therefore still unexplained; Android emulation cannot test Android's WebAPK creation. Remaining exact next step: physical Android Chrome installation using the live CTA, then launch from the home screen and confirm standalone display and no CTA. No APK, notifications, full iOS testing or later phase work.
