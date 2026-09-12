# Architecture

## CURRENT — inspected source
Baseline: `a37898970d63c9358c0592a7c81f07c7cbf2b828`. This describes repository code, not a live deployment audit.

| Area | Existing implementation |
| --- | --- |
| App | React 19, TypeScript, TanStack Start and TanStack Router; Vite 8; ESM package |
| Routing | `src/routes/`, `src/router.tsx`, generated `src/routeTree.gen.ts`; root shell `src/routes/__root.tsx` |
| UI | `src/components/`, shadcn/Radix primitives in `src/components/ui/`, Tailwind 4, Lucide icons, Sonner notifications |
| State/data | React state/hooks and TanStack Query; Supabase browser access plus TanStack server functions in `src/lib/*.functions.ts` |
| Backend | Supabase auth, PostgreSQL/RLS, storage and realtime; `supabase/migrations/` and account-deletion edge function |
| Server | `src/server.ts` SSR entry/error wrapper configured in `vite.config.ts`; `src/start.ts` |
| Build integration | `@lovable.dev/vite-tanstack-config`, Nitro default Cloudflare target and Lovable MCP Vite plugin |
| Localization | `src/i18n/`; existing multilingual/RTL styling must be preserved |
| Location | Leaflet/react-leaflet, geolocation and Nominatim helpers, city/neighborhood data including Yerevan |
| Verification | Vitest unit and opt-in hosted DB suites; ESLint, TypeScript and Vite build |

Package versions above are declared ranges at the inspected commit, not a claim about resolved or deployed versions. Both `bun.lock` and `package-lock.json` exist; tests README uses Bun.

## Repository map
- `src/routes/`: public, auth, member, owner/admin, venue and MCP/OAuth routes.
- `src/components/`: reusable gathering cards/rooms, onboarding, profile sectors, landing, venue and safety UI.
- `src/lib/`: domain rules, matching/preferences, access, profile projections, server functions and MCP tools.
- `src/integrations/supabase/`: browser/server clients, auth attachment/middleware and generated database types.
- `src/styles.css`, `components.json`: style tokens and component conventions.
- `supabase/`: config, 59 SQL migrations and `functions/delete-own-account/index.ts`.
- `tests/unit/`, `tests/db/`, `scripts/seo-check.mjs`: test and SEO checks.
- `.lovable/`: infrastructure metadata and historical plans. `roadmap.md` is the preserved private-beta checklist.
- `docs/`, `tasks/`: durable product/engineering decisions and executable task handoff added by this setup.
No root README or GitHub Actions workflow was present in the inspected tree.

## Request and trust boundaries
The authenticated route layout explicitly disables SSR and uses Supabase identity, roles and beta-access checks before member navigation. Owner/admin and venue accounts have distinct destinations.
Browser Supabase requests remain subject to database grants/RLS. Authenticated server functions use `requireSupabaseAuth`; privileged queries import `client.server.ts`. Such queries must enforce resource-level visibility themselves because service-role access bypasses RLS.
`getTableFit` computes private signals on the server and returns aggregates. Profile projections use separate functions; do not assume all profile endpoints have the same visibility contract.
The existing MCP tool routes expose gathering operations and must retain their authentication and operation rules.

## Constraints and findings
- Follow [route conventions](../src/routes/README.md). Do not add Next.js or Remix structure or manually edit the generated route tree.
- The Lovable Vite wrapper already installs core plugins. Duplicate plugin setup can break the app.
- Some Supabase integration files identify themselves as generated; use their owning configuration/generation flow when an approved change is required.
- [Database](DATABASE.md) records owner-helper/type drift and missing migration evidence. Do not treat generated types as proof of migration replay or production state.
- Tracked `.env` exists; values were not reproduced in this documentation. Review secret hygiene without exposing values.
- Hosted configuration, migration application state, storage bucket settings, build output and production behavior were not verified.

## PROPOSED operating direction
Keep this architecture and reuse its components. GitHub is authoritative, Codex implements approved specs, ChatGPT supports decisions/review, and Lovable primarily handles infrastructure/deployment. No framework migration, backend replacement or speculative Brain service is approved.

## IG-001 control boundary
The Owner control surface lives under the pathless `_control` route layout, separate from member and venue access gates while retaining the existing `/owner` URLs. Its layout verifies Owner status through an authenticated server function. Admin operations use a caller-scoped database permission check before any service-role query. The database's shared Admin role helper applies the same permission to existing RLS policies and triggers, so route visibility is not the security boundary.
