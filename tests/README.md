# Tests

## Unit (default)

```bash
bun run test        # one-shot
bun run test:watch  # watch mode
```

Pure logic only — no network, no database. Covers distance/formatting, the
check-in window and error classification, join-error classification,
compatibility scoring, preference ranking, and feedback eligibility.

## Database integration (opt-in)

### Isolated owner-bootstrap regression

`node tests/owner-bootstrap.local.mjs <absolute path to @electric-sql/pglite/dist/index.js>`
executes the committed owner migrations and private role helper in a disposable,
in-memory PostgreSQL engine. Supply PGlite from a scratch installation; it is not
an application dependency. No `.env` or hosted credentials are read. The fixture
covers only owner-role prerequisites, grants and own-role RLS, not full migration
replay, real Supabase authentication or concurrent database connections. Verify
two simultaneous admin claims on a designated disposable Supabase/PostgreSQL
target before rollout: exactly one succeeds, the other returns false, both retain
admin, and one owner row remains. Never clear existing owners on a live target.

### Native owner verification (no hosted credentials)

Use a **new disposable local PostgreSQL cluster**, listening only on
`127.0.0.1:55439`, and PostgREST on `127.0.0.1:55440`. Install `pg` and
`@supabase/postgrest-typegen` in an external scratch runtime directory; the
application's dependencies/lockfiles must remain unchanged. The setup script
creates `ig001_disposable` and refuses to overwrite an existing database.

1. `node tests/owner-postgres.setup.mjs <absolute path to pg/lib/index.js>`
   installs platform scaffolding plus all committed product migrations. This
   must NEVER be pointed at an existing or hosted cluster.
2. Configure PostgREST with database URL
   `postgres://authenticator@127.0.0.1:55439/ig001_disposable`, public schema,
   anon role, loopback host, port 55440, and a randomly generated local JWT secret.
   Save that same secret in `<runtime>/test-jwt-secret`; never commit it.
3. `node tests/owner-postgres.verify.mjs <runtime>` creates synthetic accounts,
   checks signed RPC/RLS/admin flows and ten observed concurrent claim waits.
   It requires no existing owner and retains fixtures for the next step.
4. Set `IG001_RUNTIME=<runtime>` and run
   `node node_modules/vitest/vitest.mjs run --config vitest.owner.config.ts`.
   Framework dispatch is bypassed, but all role and data queries use real HTTP.
5. `node tests/owner-postgres.types.mjs <runtime>` writes generated public types
   into scratch for review; it never overwrites application types.
6. Stop both temporary servers after verification. Re-running setup requires
   a fresh cluster; scripts do not drop arbitrary databases or owner rows.

Recorded environment, commands, scaffolding limits and results are in
[IG-001 verification](../tasks/completed/IG-001-verification.md).

### Native profile ownership verification (IG-002)

Reuse the marked disposable native cluster described above; no hosted
credentials are read. Install pg/typegen only in the scratch runtime. The script
refuses databases without the disposable marker and retains synthetic fixtures.

1. `node tests/profile-postgres.verify.mjs <runtime>` applies the IG-002 migration
   and checks backfill, existing-row precedence, RLS, atomic saves and rollback.
   The first run on the IG-001 checkpoint tested creation with the table absent;
   subsequent runs test compatibility with an existing table and new fixtures.
2. Refresh the local PostgREST cache. On this Windows runtime always use
   `<runtime>/Start-PostgREST.ps1 -Restart`, which supplies its native DLL PATH,
   checks readiness and confines process replacement to this runtime. A newly
   provisioned runtime needs its equivalent launcher/libraries. Never launch the
   bare executable without those dependencies.
3. Set `IG002_RUNTIME=<runtime>` and run
   `node node_modules/vitest/vitest.mjs run --config vitest.profile.config.ts`.
   This confirms RPC schema-cache resolution, real HTTP/RLS saves and profile,
   public-card, matching and recommendation readers. Run step 1 again before
   rerunning this stateful suite. Only framework dispatch/auth middleware is
   bypassed; actual clients, SQL/RPC, role grants and policies execute.
4. `node tests/owner-postgres.types.mjs <runtime>` regenerates public types into
   scratch. Review only schema-derived changes. Run unit/type/lint checks and
   stop temporary services when finished. No browser E2E or hosted Auth claim.

### Existing hosted suite (opt-in safeguards)

These tests run against the real hosted database, so they are **not** part of
`bun run test`. They skip themselves unless the project credentials are set:

```bash
TEST_DB_ENABLED=1 \
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_PUBLISHABLE_KEY=... \
bun run test:db
```

The suite provisions its own host, attendee, admin and venue accounts through
the service-role Auth Admin API on first run (and keeps their passwords in
sync afterwards). Set `TEST_HOST_EMAIL` / `TEST_HOST_PASSWORD` and the
matching `TEST_ATTENDEE_*`, `TEST_ADMIN_*`, `TEST_VENUE_*` variables only when
you want fixed, pre-existing accounts instead.

There is no Playwright/E2E layer: coverage is unit (Layer 1) plus database
integration (Layer 2).

Safeguards:

- Dedicated test accounts only. Assertions run through
  signed-in anon clients so RLS and triggers actually apply; the service-role
  client is used only for fixture setup, account provisioning and teardown.
- Every created row is tagged `[test-<runId>]` in a visible text column.
- Teardown runs in `afterAll`/`finally`, children before parents, and a global
  sweep removes any `[test-` rows older than one hour left by a crashed run.
- Files run serially so the seat-capacity trigger is not raced.
