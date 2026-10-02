# Havato — stationary approved logo

Status: COMPLETE — published and live verified 2026-10-02.
Approval: User request 2026-10-02, logo behavior/consistency only; commit/publish to havato and verify Darkube. Phase 2 remains complete; no Phase 3.
Branch: havato. Baseline: ca58f01ff24fc862752ee68334608a40a8de6542.

## Objective and existing implementation

Remove old rotating-logo behavior and display the complete approved illustration/wordmark. The shared animate-logo-spin utility applied logo-idle-spin (360 degrees every 24 seconds, continuously) in SiteHeader, SiteFooter, auth and venue dashboard. Other logo images inherited the previous circular crop. All visible logo sources already resolve through logoAsset.url to the approved /havato-logo.png. No stale asset reference was found in active app code.

## Changes and constraints

Removed the spin utility, its keyframe and reduced-motion selector. Removed rounded-full from all 14 shared/route logo image treatments and the footer's extra tinted background/padding. Retained existing 32/36/40px image boxes, spacing and object-contain; added shrink-0 to preserve their boxes in flex layouts. The public waitlist already uses a static, uncropped responsive 43/55px logo and is unchanged.

No new logo, asset redraw, theme/layout redesign, backend/auth/waitlist/product logic, routes, install behavior, worker, manifest, icons, dependencies or lockfiles changed. No Ideal Gathering production access or database changes/migrations. Existing generic activity spinners and non-logo decorative animations remain; no logo animation remains. The unused emblem-glow utility has no logo usage.

## Focused verification

- node node_modules/vitest/vitest.mjs run tests/unit/branding.test.ts tests/unit/deployment-config.test.ts: 16 passed.
- node node_modules/typescript/bin/tsc --noEmit: passed.
- ESLint on 14 changed TSX files, existing prettier/prettier formatting rule disabled: six pre-existing no-explicit-any errors in owner.$section.tsx; each rule/message/line/column compared with baseline, no new errors.
- git diff --check: passed. Vite development CSS/component compilation passed.
- Actual local browser: public waitlist desktop and 390px mobile, EN desktop and FA mobile sign-in, mobile pending/loading view, shared public header/footer on /terms. Logo images loaded; computed animationName none, transform none, borderRadius 0px, objectFit contain; existing sizes retained. Screens visually inspected. Pending/loading was exercised without an account; not an authenticated backend lifecycle test.
- Source inspection: venue loading uses a generic Loader2, not the logo; no separate animated logo splash. Standalone starts at the unchanged root route and uses the same logo. Physical installed-device launch not rerun for this presentation-only change.
- Manifest and approved favicon/Apple/app-icon assets unchanged in the diff; no active old-logo references found.

## Publication

Implementation published as 3db0825e2ab6dd3d5945926ad2bb77af311773e5. The GitHub connector published the exact tested local tree c771f5f62ab669b8ee2159553222e2da0985110a with a non-forced fast-forward; local unpublished 61d4c19 was reconciled to the identical remote tree.

[Exact-commit Darkube build](https://console.hamravesh.com/@havato/darkube/app/b1544805-3e87-4110-b0ba-4b8fb723e103/build_list/a5a9942c-61f6-4b05-bc9b-b573d51a7d2f) reports image pushed, deployment OK and build completed successfully; app healthy. [Live Havato](https://havato-test.darkube.ir/) verified after rollout: read-only existing venue session on desktop/mobile, public mobile FA waitlist, shared public header/footer; computed logo animationName none, transform none, borderRadius 0px, objectFit contain. Live /auth?mode=signin, /pending, /terms and /waitlist?lang=en return 200; logo markup is uncropped and all loaded stylesheets lack logo-idle-spin/animate-logo-spin. Full live auth/pending visual checks are covered by local browser checks; the existing logged-in browser was preserved.

Live approved website logo and favicon/192/512/Apple/1024px icon bytes exactly match repository files. Manifest retains standalone root entry and orange/cream launch colors. Physical installed-device launch was not rerun; no distinct standalone logo implementation exists. No remaining logo animation. Generic activity spinners and unrelated decorations intentionally remain.

Completion update changes documentation only; application tree is identical to the verified deployment. Stop here; no Phase 3.
