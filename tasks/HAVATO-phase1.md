# Havato Phase 1 — Public waitlist

Status: Implementation complete; branch deployment verification pending.
Approval: User request on 2026-09-30, Phase 1 only; existing Darkube havato auto-deploy authorized.
Branch: havato. Baseline: dd4d058cc8c200656784e46f35bfa89e995b5870.

Responsive cream/orange public homepage and /waitlist share a Farsi-first form, optional English, existing brand.logoUrl, reference café imagery, trust points, user sign-in, venue sign-in and legal links. Reference-only population numbers were omitted. Name/email matches the existing required waitlist contract; phone collection requires a separate backend decision. No authentication, role, access, schema, migrations, deployment settings or production changes.

Checks: 19 focused unit tests pass (waitlist, branding, deployment configuration); TypeScript noEmit passes; new/rewritten code passes ESLint. Existing i18n/root checks have zero errors with legacy formatting rule disabled and two existing Fast Refresh warnings. Desktop 1440px and mobile 390/320px inspected; no mobile horizontal overflow; FA/EN changes copy and direction. Local fixture confirms submission and confirmation; failure state checked. Explore redirects unsigned visitors to sign-in; unchanged authenticated and product-access gates inspected for dashboard/create gathering and inactive accounts.

Hosted persistence: verified public backend differs from historical Ideal Gathering production project reference before writing one synthetic QA entry. Insert 201 and repeat insert 409 confirm persistence only on isolated Havato. Synthetic entry uses a reserved example.invalid email and QA name; no real user data inspected.

Build: client and SSR compilation complete; final local Nitro packaging hits the previously documented Windows EPERM readlink C:/Users/ASUS. Existing havato-container Linux CI will supply the supported production-build check. Exact remaining action: push this checkpoint, inspect container CI, verify Darkube serves the new FA/EN page and both auth entries. No Phase 2 implementation.

Phase 2 remains PWA/service worker, app icons, installability, offline fallback and real Android/iPhone testing.
