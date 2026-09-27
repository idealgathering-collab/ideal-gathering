# Portable deployment

GitHub is the source of truth. Supabase supplies Auth, database, Storage and
Realtime. The default Vite configuration uses standard TanStack Start, React,
Tailwind, path aliases and Nitro; it does not import the Lovable wrapper or MCP
Vite plugin. No Lovable editor, remix, account or credits are needed to build or
run this target. Existing MCP runtime handlers are deliberately preserved.

## Supported, verified target

Generic Node server, Nitro `node-server` preset. Use Node 24 LTS (verified with
24.19.0), Bun 1.4.2 and the committed `bun.lock`. No dependency upgrades or new
packages were needed. `package-lock.json` remains unchanged; npm installation
was not reverified in IG-009. Do not regenerate either lockfile incidentally.

```sh
bun install --frozen-lockfile
# Populate env/.env.local from env/.env.example, or inject VITE_* in your build job.
bun run build
# Supply the server-only environment through your process manager/hosting panel.
node .output/server/index.mjs
```

`bun run start` invokes the same Node entry. Deploy **all of `.output/`**, including
`.output/public`, server chunks and traced `server/node_modules`; do not copy only
the entry or only the static directory. The result supports SSR, server functions,
file routes and `src/server.ts` security/error handling. No source checkout,
Lovable packages installation or Bun runtime is needed on the destination server.
Use an HTTPS reverse proxy/process manager in front of Node; set `HOST` and `PORT`
through that provider. A static-only host cannot run this application.

This matches the [TanStack Nitro hosting path](https://tanstack.com/start/latest/docs/framework/react/guide/hosting).
Other Nitro adapters are possible but have not been configured or verified here;
do not upload this Node artifact directly as a Cloudflare Worker.

## Environment contract — names only

All `VITE_*` values are public and embedded **at build time**, including the SSR
bundle. Rebuild for a different backend, domain or brand. Runtime variables alone
cannot retarget browser requests. Never prefix a service-role or secret key with
`VITE_`. The config rejects recognizable privileged keys in the public key field.

| Variable | Where | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | build; required | Target Supabase endpoint, including self-hosted endpoints |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | build; required | Public publishable key or legacy anon JWT |
| `VITE_SITE_URL` | build; required operational setting | This deployment's canonical HTTPS origin; use the staging origin for staging |
| `VITE_OAUTH_PROVIDER` | build | `supabase` by default; optional `lovable` compatibility mode |
| `SUPABASE_URL` | server runtime; required | Same backend as the compiled public URL |
| `SUPABASE_PUBLISHABLE_KEY` | server runtime; required | Same public key as the browser build; authenticated RLS requests |
| `SUPABASE_SERVICE_ROLE_KEY` | server runtime; required for privileged features | Server-only credential for that same backend |
| `HOST`, `PORT` | server runtime | Listener address/port |
| `VITE_BRAND_NAME`, `VITE_BRAND_SHORT_NAME` | build; optional | Shared UI/metadata/manifest names |
| `VITE_BRAND_LOGO_URL` | build; optional | Local public asset path or your own HTTPS asset URL |
| `VITE_BRAND_TAGLINE`, `VITE_BRAND_DESCRIPTION` | build; optional | Root metadata copy |
| `VITE_BRAND_THEME_COLOR` | build; optional | Six-digit hex color for manifest/meta and primary CSS token |

`VITE_SUPABASE_PROJECT_ID` is no longer required: MCP derives its issuer from the
configured Supabase URL instead of inventing a `*.supabase.co` hostname.
No server credential is injected into Vite configuration or committed to examples.
Plain Node does not automatically load `env/.env.local`: supply runtime variables
in the host's secret store/process manager, or an explicitly selected untracked
Node `--env-file` outside the public artifact. Do not place secrets in `.output/public`.

The old tracked root `.env` is removed. This prevents accidental selection of the
production project and Bun's automatic root-env loading. Portable builds read
`env/.env`, `env/.env.local` and mode variants through Vite, plus injected process
variables. Only the blank `env/.env.example` is tracked. The prior local settings
were retained in ignored `.env.lovable.local` in the working checkout; they are
not part of the release or a staging credential source.

## Supabase on another host

Keep existing migrations, RLS and authorization rules. Configure the target
Supabase Auth Site URL and allowed redirect URLs for the new app origin, including
the existing login/invite/password-recovery flows. Enable Google OAuth directly
in Supabase and configure its callback in Google's console to retain the Google
button without Lovable's OAuth broker. Email/password still uses Supabase.
SMTP/email delivery must be configured and verified on staging. Provision the
existing Storage buckets/policies and account-deletion Edge Function for the target
backend; source is under `supabase/`. Confirm maps, public font/CSS services,
Realtime and Storage CORS/URLs from the hosted origin.

The environment values must all identify the **same isolated backend**. Compare
browser network requests, server settings and MCP issuer before any staging write.
No migration or test in the portable build runs against a backend.

## Optional Lovable hosting compatibility

```sh
bun run dev:lovable
bun run build:lovable
```

These explicitly select `vite.lovable.config.ts` and mode `lovable`; provide that
host's public settings via its build environment or ignored `.env.lovable.local`.
They retain the original wrapper, MCP generation, server entry and platform target;
OAuth defaults to Lovable in this config unless explicitly overridden. Never
combine the portable plugin stack with this wrapper. Configure a Lovable build
to use this optional command before switching a connected deployment to this
branch. Actual hosted Lovable configuration has not been changed or verified.
The existing MCP plugin's Windows `routesDir` assertion is outside this optional
path's verified platform support; it does not affect the default portable build.

| Retained Lovable code | Reason |
| --- | --- |
| `@lovable.dev/vite-tanstack-config` | Optional dev/build config only; platform build/preview conveniences |
| `@lovable.dev/mcp-js` Vite plugin | Optional Lovable config only; route generation/editor integration |
| `@lovable.dev/mcp-js` runtime | Existing `/mcp`, discovery/invoke and OAuth metadata routes use its handlers; preserving API behavior is in scope |
| `@lovable.dev/cloud-auth-js` | Dynamically loaded only for explicitly selected Lovable OAuth compatibility |
| Preview storage, error reporting, frame permissions | Existing editor compatibility; non-Lovable hosts use local storage, optional error hook is a no-op |

Retaining the runtime SDK is not a hosting or credit dependency. Local smoke
checks verify MCP issuer discovery and anonymous denial without a Lovable service.
Seven existing visual assets now live in `public/assets`; their descriptors use
local URLs, so rendering no longer requires `/__l5e/` or a Lovable asset proxy.

## Future Havato configuration

`src/config/brand.ts` is a small boundary used by existing logo imports, translated
brand labels, root metadata, SEO origins/names, the manifest and the primary theme
hook. Set brand/environment variables and build the **same core** for a separate
domain/backend; no application fork is required. `brandText` is a per-language
override map for later editorial copy. Defaults preserve Ideal Gathering.
This is not a complete Havato rebrand: product/story/legal/support copy, social
images and favicon variants still need explicit review/assets when that brand is
commissioned. No routes, membership rules or matching behavior were redesigned.

## Isolated staging — exact remaining action

No safe hosting credential/target or isolated Supabase credentials are available
in this checkout. No hosted deployment or hosted journey is claimed.

1. Create an **empty, separate** Supabase project. Reconcile prerequisites and run
   the committed migrations in order there, preserving enum transaction boundaries.
   Deploy required Edge Functions and configure buckets, Auth/SMTP/redirects.
   Never run the disposable PostgreSQL fixture setup against a hosted project.
2. Provision a separate Node 24 staging service on your server/provider. Check out
   PR #13's exact revision (it includes the IG-001–008 stack). Set the public build
   variables to that isolated backend and staging domain; run the build above.
3. Upload the complete artifact, set the matching server runtime credentials in
   the host's secret store, start Node behind HTTPS, and record URL/revision.
4. Verify backend identity, then execute the hosted smoke matrix in
   [IG-009 verification](../tasks/IG-009-verification.md) with synthetic accounts.
   Hosted Auth/email, uploads/signing, maps, privacy and full journeys remain pending.

Leave PR #13 unmerged and production untouched. Existing production schema/ledger
drift requires separate reconciliation before any future release. Neither a local
build nor synthetic tests establish public-beta readiness.

## Reproduce the artifact smoke check

Build with `VITE_SUPABASE_URL=http://127.0.0.1:54321`,
`VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_ig009_local_fixture`,
`VITE_SITE_URL=http://localhost:4173` and optionally
`SUPABASE_SERVICE_ROLE_KEY=ig009_server_only_sentinel` as process variables. These
are dummy fixtures, not credentials. Run `bun run build`, then
`node scripts/portable-smoke.mjs`. Do not deploy that fixture artifact as staging.
The script starts/stops a loopback server, verifies SSR/security headers, local
assets, manifest, MCP issuer/auth denial and checks browser bundles for the server
sentinel and legacy production default. It does not simulate successful hosted
Auth/Storage or test the database. Windows sandbox restrictions may require normal
filesystem/process access for Nitro's dependency tracer.
