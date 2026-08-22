# Tests

## Unit (default)

```bash
bun run test        # one-shot
bun run test:watch  # watch mode
```

Pure logic only — no network, no database. Covers distance/formatting, the
check-in window and error classification, join-error classification,
compatibility scoring, and feedback eligibility.

## Database integration (opt-in)

These tests run against the real hosted database, so they are **not** part of
`bun run test`. They skip themselves unless every variable below is set:

```bash
TEST_DB_ENABLED=1 \
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_PUBLISHABLE_KEY=... \
TEST_HOST_EMAIL=... TEST_HOST_PASSWORD=... \
TEST_ATTENDEE_EMAIL=... TEST_ATTENDEE_PASSWORD=... \
bun run test:db
```

Safeguards:

- Two dedicated test accounts (host + attendee). Assertions run through
  signed-in anon clients so RLS and triggers actually apply; the service-role
  client is used only for fixture setup and teardown.
- Every created row is tagged `[test-<runId>]` in a visible text column.
- Teardown runs in `afterAll`/`finally`, children before parents, and a global
  sweep removes any `[test-` rows older than one hour left by a crashed run.
- Files run serially so the seat-capacity trigger is not raced.
