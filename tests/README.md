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
