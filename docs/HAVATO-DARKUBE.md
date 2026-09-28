# Havato on Darkube

Deploy only `idealgathering-collab/ideal-gathering`, branch `havato`.
Never merge this branch into, or repoint, Ideal Gathering production.

## Container contract

- Dockerfile: `./Dockerfile`; context: `.`; Node 24; Bun 1.4.2 frozen lockfile.
- Build: `bun run build`. Start: `node .output/server/index.mjs`.
- Listener: `0.0.0.0:3000`; Darkube service port: `3000`.
- Readiness: `/auth?mode=signin` (plain `/auth` redirects to this URL).
- Leave Darkube command/args empty so the image command is used.
- One replica; smallest test plan: 500 MB / 250 millicores. No volume.
- Files, database, Auth and Realtime belong in a separate Havato Supabase project.
- Docker CI verifies the runtime with a read-only root filesystem and temporary `/tmp`.

## Settings

Public **Docker build arguments**: `VITE_SUPABASE_URL`,
`VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SITE_URL`.
The last must be the actual temporary Darkube HTTPS origin. A value entered only
as a runtime variable cannot configure an already-built browser bundle.
Confirm Darkube's build-argument mapping before creating the app.
The Dockerfile selects direct Supabase OAuth. Havato branding is the branch default.

Runtime variables: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` for the same project;
`SUPABASE_SERVICE_ROLE_KEY` in Darkube's **encrypted secret** section, runtime only.
Never place that secret in Docker ARG, frontend variables, source, image layers,
logs or shared screenshots. HOST/PORT default to `0.0.0.0` / `3000` in the image.

Proposed temporary URL: `https://havato-test.darkube.ir` (available in the setup
form, not provisioned). Do not add `havato.app` yet.
The temporary branch blocks indexing with robots.txt and root noindex metadata.
The SVG mark is provisional. Historical story/support/legal copy still contains
the existing contact address and needs owner review before public launch.

## Fresh Supabase backend

Create a **new, empty** Havato project. Do not copy production data or repoint the
existing project. `supabase/config.toml` now uses local ID `havato`; it contains no
production project reference. Verify the new remote reference explicitly before
linking, migrating, or deploying functions.

The historical migration `20260821001412_4fb8b295-d028-4e51-be44-d8c821cc9076.sql`
is a data-only smoke test tied to two old account IDs. It is not suitable for a
fresh hosted project. Preserve the original history; explicitly record it as
not applicable in the fresh-project rollout rather than creating those old users.
Apply actual schema migrations in order with enum transaction boundaries kept.
The local harness supplies synthetic platform/user scaffolding and is NOT a
hosted Supabase provisioning script.

Verify storage buckets/policies, Realtime, Auth email delivery, and the
`delete-own-account` Edge Function. Add only the new temporary origin to this
new project's Auth settings. Google sign-in requires the owner's OAuth provider
credentials/configuration. Bootstrap the owner's identity only after the owner
has signed up and verified their account; do not seed an arbitrary administrator.

## Publication gates

No hosted success is claimed by fixture builds. Before public launch, run real
email/password and Google Auth, reset/invite flows, profiles, gatherings/join,
venue profile/dashboard, admin, owner, private Storage and account deletion on
the isolated project. Keep existing beta and role gates. Paid Darkube provisioning
requires the owner's approval even if account credit is already present.
