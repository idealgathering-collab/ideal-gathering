# Havato PWA Phase 2 — Step 4

Approval: explicit user request, 2026-10-02; iPhone/iOS install setup and testing only, publish to `havato` and verify existing Darkube auto-deploy.
Baseline: `6cf68a20757dc8765f712f4f31820b621639bef9`.
Status: published and deployed; focused local/live checks pass. Physical iPhone acceptance remains pending.

## Scope and implementation

The existing controller recognizes iPhone/iPad/iPod user agents and touch-capable MacIntel iPads. It uses both display-mode and Apple's navigator.standalone. iOS receives an accessible Havato-specific dialog, never a native Android prompt. Other iOS browsers receive the same explicit instruction to open Safari. Ordinary Safari cannot reliably discover whether an installation already exists; Home Screen/standalone launch hides the CTA and instructions. No persisted installed flag was introduced.

Added apple-mobile-web-app-capable=yes, apple-mobile-web-app-title from brand.shortName, and apple-mobile-web-app-status-bar-style=default. Existing viewport-fit=cover, 180px apple-touch-icon, manifest Havato name/short_name, standalone display and root start_url are preserved. Existing root route and role-aware redirects are unchanged; an anonymous launch opens the public Havato start page.

Clarified English/Farsi Safari Share > Add to Home Screen > Add instructions, including the page menu where required and keeping Open as Web App enabled if shown. Sources: [Apple Home Screen instructions](https://support.apple.com/en-euro/guide/iphone/iph42ab2f3a7/ios) and [Apple web-app metadata](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html).

No install-controller, service-worker, manifest, icon, theme, backend/auth/waitlist/venue/admin/owner, native-app, production or push changes. No dependency/lockfile changes.

## Focused checks

- `node --test tests/pwa-install.test.mjs tests/pwa-service-worker.test.mjs`: 17 passed. Added realistic Safari/Chrome/Firefox iOS UA coverage, independent Apple standalone coverage, and runtime standalone hiding. Existing Android one-use prompt, appinstalled, dismissal/error and worker checks pass.
- `node node_modules/typescript/bin/tsc --noEmit`: passed.
- `node node_modules/eslint/bin/eslint.js src/routes/__root.tsx src/components/landing/havato-install.tsx --rule 'prettier/prettier: off'`: passed, retaining the previously documented formatting exclusion.
- `git diff --check`: passed.
- Local actual application with dummy backend, Edge Chromium iPhone 390px emulation: English/Farsi LTR/RTL, instructions open/Escape close, runtime hiding, standalone initial hiding, metadata, root start page, zero overflow and zero page errors pass.
- Live pre-publication Android Chromium normal-profile emulation: real native beforeinstallprompt emitted, actual CTA visible, zero CDP installability errors. Physical Android was already accepted by the user before this step.
- Apple 180px and approved 192/512/1024px PNG dimensions, MIME and hashes verified; worker matches repository after newline normalization.
- Reused existing dependencies with identical package-lock SHA256; no reinstall or lockfile regeneration. Broad database/product tests intentionally excluded. Supported Linux build is provided by existing havato container CI after publication; no redundant known-blocked Windows packaging run.

## Remaining Step 4 acceptance

Implementation `0b0ba3d0abd7410838e1d3c0cc9f31822ec62b37` is published and live verification passed. The user must test on a physical iPhone: open Havato in Safari, install through Share > Add to Home Screen > Add (Open as Web App on if shown), confirm Havato name/approved icon, launch without Safari chrome at the correct Havato page, verify Farsi/RTL and confirm no install CTA/instructions. WebKit on Windows and overridden standalone signals do not reproduce SpringBoard installation, Safari share sheets, actual status bar/safe-area behavior or authenticated installed launch.

Stop after Step 4. All later Phase 2 steps and color/push changes remain deferred.

## Published checkpoint and WebKit verification

Implementation `0b0ba3d0abd7410838e1d3c0cc9f31822ec62b37` is published to `havato`. [Linux container build and stateless startup CI](https://github.com/idealgathering-collab/ideal-gathering/actions/runs/36993116890) passed.

Local WebKit 26.5 with iPhone 13 emulation passed all four English/Farsi browser/standalone cases, actual dialog open/Escape dismissal/runtime hiding, metadata, root launch, 390px no overflow, and zero page errors. Screenshots visually reviewed, including Farsi and mixed English menu labels. Windows WebKit required ignoring certificate errors in the isolated test context for external font stylesheets; normal Chromium validated live HTTPS without this override. One initial development-server module import failure during generated-route reload was reproduced as a Vite reload artifact; a stable rerun passed. Generated route file restored; no generated-code change committed.

No physical iPhone or iOS Simulator is available on this Windows host. WebKit emulation is not physical Safari/Home Screen validation.
## Live rollout verification — 2026-10-02

Darkube automatically built the exact implementation commit; its build detail/history shows success and havato-test remains healthy. Public rollout was first observed at 10:16 UTC (13:46 Asia/Tehran). Dashboard build: https://console.hamravesh.com/@havato/darkube/app/b1544805-3e87-4110-b0ba-4b8fb723e103/build_list/a9a2a80b-af9c-4e81-b112-25d16d6fc0d7.

Live https://havato-test.darkube.ir passed WebKit iPhone emulation in English/Farsi, normal browser/simulated Home Screen state: actual updated bilingual dialog, Escape dismissal, runtime CTA/dialog hiding, initial standalone hiding, correct document/dialog direction, 390px no overflow, and zero page errors. Manifest root start_url, Havato name/short_name, standalone display, Apple title/capability/default status bar, viewport and touch-icon references are correct. All approved 180/192/512/1024px PNGs return HTTP 200/image/png and match repository bytes; worker content is unchanged after Windows newline normalization.

Post-rollout normal-profile Edge Chromium with Pixel 7 emulation emits a real native beforeinstallprompt, shows the actual CTA, reports zero CDP installability errors, and has an active service-worker registration. The Android controller source is unchanged. Native prompt consumption, pending/one-use behavior and installed suppression remain covered by focused tests; no new physical Android test is claimed.

Only the physical iPhone acceptance checklist above remains before Step 4 is fully complete. No later phase work was started.