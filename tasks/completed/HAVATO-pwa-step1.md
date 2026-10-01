# Havato PWA Phase 2 — Step 1

Approval: user request, 2026-10-01; foundation verification/correction only, commit/push to havato and verify existing Darkube deployment. Baseline f795c0e165a53349b0f26f8c8f142d1dce7f32b6.

The deployed manifest already has Havato name/short name, public root start_url, standalone display and approved 192/512/1024 PNG icon references. Favicon 32px and Apple touch icon 180px links are correct. Existing icons are preserved byte-for-byte.

Correction: install/browser metadata uses the existing public wordmark orange #ed531c and landing background #fff6e9, replacing purple #6b21a8 and older cream #fffbf5. Shared PWA color constants keep manifest and root theme metadata consistent without changing application CSS or brand.themeColor.

Checks: focused script executes the manifest GET response with route-registration stubs and checks content type, names, start URL, display, colors and 192/512 references. Checks all five PNG signatures/dimensions, root meta/icon/manifest references, landing palette correspondence and syntax diagnostics for the three changed TypeScript files. git diff --check passes. No broad test suites or full build requested/run.

Publication/live verification: pending at commit preparation. Verify cache-busted /manifest.webmanifest and /waitlist on https://havato-test.darkube.ir, then all five PNG URLs against repository SHA256, dimensions and MIME. Do not equate GitHub CI with Darkube control-panel status.

No service worker, push notifications, homepage/layout/auth/backend/waitlist/venue/admin/owner behavior, database, deployment configuration or Ideal Gathering production changes. Stop after Step 1. Step 2 remains service worker and basic caching/offline fallback.
