# Havato home implementation and verification

Implemented on `havato-home-reference` from latest remote Havato baseline
`9ed231600072fd9e42423d4fe03e5baab5be3cff`, verified before editing.
No merge or deployment. No production data writes or schema/config changes.

## Exact changes

- `src/components/landing/havato-waitlist.tsx`: reference-style cafe hero and
  signup card, approved logo, FA/EN buttons using the existing language provider,
  real in-page navigation and mobile menu, two use-case cards, six-feature strip,
  trust row, seven activity examples, FAQ, existing user/venue/auth/legal links,
  existing conditional PWA install component. Retains original submit function,
  state/duplicate guard and `joinHavatoWaitlist(form, row => supabase.from("waitlist").insert(row))`.
- `src/components/landing/havato-waitlist.css`: responsive desktop/mobile layout,
  semantic orange/cream tokens, curved hero boundary, cards, accessible focus,
  email direction and readable wrapping at narrow widths.
- `src/components/landing/havato-home-copy.ts`: FA/EN use cases, feature labels,
  trust guidance, activity labels, FAQ, and staged feature availability wording.
- `public/assets/havato-home-{cafe,family,friends,activities}.webp`: four new
  supporting assets generated with the built-in imagegen tool from the supplied
  reference. 540,774 bytes total. No logo generation or logo byte changes.
- `tests/landing-preview/{index.html,main.tsx,fixtures.tsx,vite.config.ts}`:
  actual component and language provider with a synthetic Supabase adapter and
  router links; success/existing/failure query controls, no production access.
- `docs/UX.md`, `tasks/current.md`, completed IG-010 scope and this report:
  implementation, adaptations, checks and release handoff.

## Preserved contracts

No changes to `src/lib/havato-waitlist.ts`, the Supabase clients/configuration,
waitlist table/schema/RLS, migrations, auth flow, beta gates, index-route redirect,
language persistence, approved logo assets, PWA worker/manifest/icons, or install
controller/component. No idealgathering.com or main-branch work.

## Production adaptations

1. The mockup's email-only form retains name and consent because the existing
   storage validation requires name and the current signup requires legal consent.
2. Existing complete approved logo is shown uncropped; the mockup's horizontal
   logo was not recreated or substituted.
3. Mobile uses three-by-two planning features and a wrapped category grid to keep
   labels readable, rather than shrinking six features into one row.
4. The mockup is actual semantic UI, without its decorative phone frame. Menu,
   section links, FAQ and calls to action work with keyboard/accessibility controls.
5. Supporting hero/illustrations/photos were recreated from the reference as
   optimized text-free assets; no baked-in UI or text.
6. Features roll out in stages, safety is not guaranteed, and joining the waitlist
   does not promise immediate beta access. Privacy links, existing auth paths and
   conditional app installation remain available below the content.

## Verification

- `node node_modules/vitest/vitest.mjs run tests/unit/havato-waitlist.test.ts tests/unit/branding.test.ts`:
  9/9 pass. Uses workspace-local TEMP/TMP to avoid Windows temporary-file rename restrictions.
- `node node_modules/typescript/bin/tsc --noEmit`: passes, including preview fixture.
- `node node_modules/eslint/bin/eslint.js src/components/landing/havato-waitlist.tsx src/components/landing/havato-home-copy.ts tests/landing-preview`:
  clean, zero errors/warnings after fixture formatting.
- Actual Chromium at widths 320, 375, 390, 700, 768, 1024, 1440 in both FA and EN:
  all 14 configurations pass. No overflow or page errors; expected cards/tools/
  categories present; image loading, RTL/LTR, menu and FAQ verified. Desktop and
  mobile screenshots visually inspected in both languages.
- Seven interaction checks pass: default FA/persisted EN, native required/email/
  consent validation, exact normalized insert payload and busy/double-submit guard,
  translated success, existing-email handling, backend error with retained values
  and successful retry, and preserved user/venue auth links. All inserts intercepted
  by the fixture; no live backend write or email delivery test claimed.
- Full `node node_modules/vitest/vitest.mjs run`: 415 pass, 16 fail, 11 skipped.
  The same 16 failures reproduced on unchanged baseline across life-profile,
  life-summary, member-profile, venue-value rendering tests (29 baseline checks:
  13 pass, 16 fail). No related source changes in this task.
- Full lint: 2727 errors/13 warnings at the first run before removal of one new
  preview fast-refresh warning. Baseline full lint: 2728 errors/12 warnings.
  Final focused lint clean; global pre-existing formatting/errors remain.
- `node node_modules/vite/bin/vite.js build` with synthetic public settings:
  client and SSR bundles compile; final Nitro packaging fails at the recorded
  Windows `EPERM realpath node_modules/tslib/modules/package.json`. Build is not
  claimed fully passing. No runtime or production credential changes.
- `git diff --check`: passes. Lockfiles and dependencies unchanged.

## Reproduce preview

Run `node node_modules/vite/bin/vite.js --config tests/landing-preview/vite.config.ts`.
Open the local address it prints. Query `?lang=en`, `?result=existing`, or
`?result=failed` exercises localized/error states. The preview always uses its
synthetic adapter and must not be used as a deployment configuration.

## Remaining release work

Review the draft targeting only Havato. Validate final server packaging on Linux
before merging/releasing. Existing unrelated test/lint failures are separate
maintenance work. Real production signup, email delivery, physical mobile/PWA
installation and production deployment were not performed.
