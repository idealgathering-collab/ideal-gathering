# IG-009 — Portable Deployment, Staging & Beta Readiness

Status: Portable implementation/local verification complete; hosted staging pending access.
Owner: Farzin
Approval: Revised scope explicitly approved 2026-09-27. This replaces the earlier Lovable-first staging/promotion direction.
Branch: codex/ig-009-staging-beta; existing draft PR #13, stacked on #12.

## Objective
GitHub is the source of truth. Supabase remains auth/database/storage/backend.
Make the existing TanStack Start/Vite application independently deployable with
Nitro to a generic Node server. Lovable remains an optional hosting target; no
Lovable credits, editor or remix are required for development or staging.
The shared core must support a future Havato deployment through a small brand
and environment boundary, without duplicating or redesigning the product.

## Approved requirements
1. Audit Lovable wrapper, MCP plugin and runtime integrations; document each retained dependency.
2. Standard Vite/TanStack Start/Nitro build preserving routes, SSR, Tailwind,
   aliases, public environment injection and src/server.ts. Retain an explicit
   optional Lovable config without registering duplicate plugins.
3. Environment-driven Supabase; no production defaults for independent builds.
   Keep service-role credentials server-only; document names without values.
4. Minimal shared brand name/logo/domain/text/theme configuration, preserving
   Ideal Gathering defaults and existing translations/product behavior.
5. Document install/build/start/deploy for generic Node using existing Nitro.
6. Verify production artifact and local HTTP behavior without Lovable build tooling.
7. Deploy only to a safely isolated non-Lovable staging app/backend if access exists.
   Otherwise verify the local artifact and record precise manual provisioning steps.
8. Preserve all production records and historical migration evidence. No production
   writes, migration replay, merge or deployment. No synthetic hosted-test claims.
9. Preserve temporary venue activation 2–5 cap. No IG-010 or Matching V2.
10. Run unit tests, typecheck, targeted lint and portable production build; record
    exact commands/results and honest hosted-verification limitations.
11. Push checkpoint to existing branch/PR #13, update its body, leave unmerged.

## Acceptance and handoff
- [x] Standard independent build and standalone Node artifact verified.
- [x] Public/server environment contract and optional Lovable path documented.
- [x] Minimal brand/config boundary tested.
- [x] Unit/type/lint/build results recorded.
- [x] Isolated hosted staging verified, OR explicit access blockers and manual steps recorded.
- [ ] Existing PR updated with portable deployment checkpoint.

## Safety and rollout
No schema changes are planned. Existing migrations remain immutable. Use an empty
isolated Supabase project for eventual staging; never copy production records.
Prior ledger/schema drift and the complete hosted smoke matrix remain in
[verification](IG-009-verification.md). Hosted Auth/email/Storage/maps/privacy
journeys are pending until an isolated target exists. No promotion is authorized
by this revised task. Keep the spec active while actual beta validation remains.
