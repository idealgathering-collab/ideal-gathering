# Havato PWA Phase 2 — Step 4

Approval: explicit user request, 2026-10-02; iPhone/iOS install setup and testing only, publish to `havato` and verify existing Darkube auto-deploy.
Baseline: `6cf68a20757dc8765f712f4f31820b621639bef9`.
Status: focused verification in progress; physical iPhone acceptance remains pending.

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
- Apple 180px and approved 192/512/1024px PNG dimensions, MIME and hashes verified; worker matches repository byte-for-byte.
- Reused existing dependencies with identical package-lock SHA256; no reinstall or lockfile regeneration. Broad database/product tests intentionally excluded. Supported Linux build is provided by existing havato container CI after publication; no redundant known-blocked Windows packaging run.

## Remaining Step 4 acceptance

Finish WebKit emulation and publish/live verification. Then the user must test on a physical iPhone: open Havato in Safari, install through Share > Add to Home Screen > Add (Open as Web App on if shown), confirm Havato name/approved icon, launch without Safari chrome at the correct Havato page, verify Farsi/RTL and confirm no install CTA/instructions. WebKit on Windows and overridden standalone signals do not reproduce SpringBoard installation, Safari share sheets, actual status bar/safe-area behavior or authenticated installed launch.

Stop after Step 4. All later Phase 2 steps and color/push changes remain deferred.
