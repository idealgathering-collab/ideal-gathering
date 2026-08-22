# Automated testing setup

Two layers: fast pure-logic unit tests that run offline, and a small, opt-in integration suite that exercises the database triggers and RLS rules. No CI yet — everything runs from a local script.

## Layer 1 — Vitest unit tests (default, offline)

Add `vitest` as a devDependency plus a minimal `vitest.config.ts` (node environment, `vite-tsconfig-paths` so `@/` resolves, `include: ["tests/unit/**/*.test.ts"]`). Add scripts: `test` (unit only), `test:watch`, and `test:db` (integration, described below).

Files and what gets asserted:

- `tests/unit/geolocation.test.ts` — `haversineKm` (zero distance, known city-pair distance within tolerance, antimeridian/negative longitudes), `formatDistance` (sub-1 km rounds to 10 m steps, 1–10 km keeps one decimal, >10 km rounds to integer, locale formatting for `tr`/`fa`).
- `tests/unit/attendance.test.ts` — `checkinWindow` (opens 30 min before start; closes 24 h after `ends_at`; falls back to start + 2 h when `ends_at` is null) and `classifyAttendanceError` for every trigger message it maps, plus the `unknown` fallback.
- `tests/unit/matching.test.ts` — `traitsFromRow` (null/partial rows return null), `averageTraits`, `fitScore` (identical traits score highest, opposite traits lowest, symmetry).
- `tests/unit/join-errors.test.ts` — `classifyJoinError` for `23505`, `GATHERING_FULL`, `GATHERING_CLOSED`, and unknown.

One structural note: `classifyJoinError` lives in `src/lib/gatherings.ts`, which imports the Supabase browser client at module scope. To keep the unit test free of env/network setup, either stub `@/integrations/supabase/client` with `vi.mock` in that test file, or move the pure classifier + `JoinError` into a small `src/lib/join-errors.ts` that `gatherings.ts` re-exports. The extraction is cleaner and is my recommendation.

Server-function handlers (`getTableFit`, `listPendingFeedback`) are wrapped by `createServerFn`, so their handlers are not directly callable in a unit test. Rather than mocking the Supabase admin client, extract the decision logic into pure helpers and test those:

- `scoreTables({ myTraits, membersByGathering, traitsByUser, blockedWith })` → the fit array (covers: nobody else rated → `fit: null`, blocked member → `hasBlocked: true` with no score, self excluded, host counted as a member).
- `isFeedbackPending({ now, startsAt, endsAt, status, checkedOutAt, joinedAt })` → boolean (covers: checked out early → pending; window still open and not checked out → not pending; window closed → pending; cancelled/rejected → never; older than the 14-day TTL → never).

The server functions then call these helpers, so behaviour is unchanged and the rules become testable.

## Layer 2 — Database trigger / RLS integration tests (opt-in)

This is the real gap: `guard_attendance_update` (self vs host path, window bounds, the 100 m `private.meters_between` check), `enforce_gathering_capacity` (the `FOR UPDATE` seat check), `prevent_saved_location_status_change_by_owner`, `prevent_locked_table_change` (venue table edit/delete lock), and `set_gathering_city`.

There is only one hosted database — no local Postgres and no separate test project — so these tests must run against the real instance. They are therefore **not** part of `bun test`; they run only via `bun run test:db` and skip themselves automatically when the required env vars are absent.

Approach per test: create the whole fixture graph inside the test (business → venue table → gathering → attendee rows), act, assert, then delete everything in a `finally` block. Assertions target the raised exception codes (`GATHERING_FULL`, `CHECKIN_TOO_EARLY`, `CHECKIN_TOO_FAR`, `TABLE_LOCKED`, `ATTENDANCE_FORBIDDEN`, …), which is exactly the contract the client code classifies against.

Safeguards against damaging live data:

- **Dedicated test users.** Two or three pre-created accounts (host, attendee, non-member) whose credentials come from env vars. Tests sign in with the anon client so RLS actually applies — that is the point of the exercise. A service-role client is used only for teardown, never for the assertion path.
- **Tagged rows.** Every created row carries a recognisable prefix, e.g. `subject`/`label`/`name` starting with `[test-<runId>]` where `runId` is a per-run UUID. Nothing without that prefix is ever written or deleted.
- **Teardown in `finally`,** deleting by the run tag, children before parents, with a `globalTeardown` sweep that removes any `[test-` rows older than an hour left behind by a crashed run.
- **Guard rail at startup.** The suite refuses to run unless `TEST_DB_ENABLED=1` and the test-user env vars are present, and it asserts the test accounts exist before creating anything.
- **No admin-role tests that mutate real records.** Admin-path coverage (host override on attendance, status changes) uses only test-owned rows.
- **Serial execution** (`--no-file-parallelism`) so the capacity trigger's seat maths isn't confused by concurrent fixtures.

Concrete cases:

| Trigger | Cases |
| --- | --- |
| `enforce_gathering_capacity` | fill a 1-seat gathering, second join raises `GATHERING_FULL`; join on a cancelled gathering raises `GATHERING_CLOSED` |
| `guard_attendance_update` | self check-in 2 h before start → `CHECKIN_TOO_EARLY`; in-window check-in 5 km away → `CHECKIN_TOO_FAR`; in-window check-in at the venue coords → succeeds; second check-in → `ATTENDANCE_ALREADY_SET`; check-out without check-in → `NOT_CHECKED_IN`; another attendee updating someone else's row → `ATTENDANCE_FORBIDDEN`; host marking an attendee ignores the proximity rule |
| `prevent_saved_location_status_change_by_owner` | owner flipping `status` to `approved` raises; owner editing label/address succeeds |
| `prevent_locked_table_change` | delete a table tied to a future non-cancelled gathering → `TABLE_LOCKED`; lower capacity below booked seats → `TABLE_CAPACITY_LOCKED`; both succeed once the gathering is cancelled |
| `set_gathering_city` | insert with a `business_id` copies the business city; blank city normalises to null |

## Not worth automating yet

- Component/DOM tests (Testing Library) and end-to-end browser flows — the UI is still moving; the payoff is low relative to maintenance.
- i18n key-coverage checks across EN/TR/FA.
- Map picker, Nominatim geocoding, and anything depending on browser geolocation.
- Auth/email flows (sign-up, verification, password reset) — managed by the platform.
- SEO/meta snapshot tests; the existing `scripts/seo-check.mjs` already covers that ground.
- CI. Once local tests are green and stable, a GitHub Actions job running only the unit layer would be a few lines — but not in this change.

## Technical summary

- devDependency: `vitest`. Config: `vitest.config.ts` with `vite-tsconfig-paths`, node environment, unit include path.
- Scripts: `"test": "vitest run"`, `"test:watch": "vitest"`, `"test:db": "TEST_DB_ENABLED=1 vitest run --config vitest.db.config.ts --no-file-parallelism"`.
- New pure modules for testability: `src/lib/join-errors.ts`, plus exported `scoreTables` and `isFeedbackPending` helpers extracted from `matching.functions.ts` and `feedback.functions.ts` (behaviour unchanged; the server functions call them).
- Integration suite needs env vars for the test-account credentials and a service-role key for teardown; you would add these locally — they are not required for the default `test` script.
