# Automated tests for core product flows

Testing infrastructure only. No app behavior, UI, or copy changes.

## What already exists

- `bun run test` — Vitest unit suite (`tests/unit/`): geolocation, attendance window/error classification, join-error classification, matching, feedback rules.
- `bun run test:db` — opt-in integration suite (`tests/db/`) against the hosted database, with a tagged-fixture harness (`[test-<runId>]`), signed-in anon clients so RLS/triggers apply, service-role only for setup/teardown, children-first teardown plus a stale-row sweep, serial file execution.

The plan extends both suites rather than introducing a new framework, and adds a small Playwright layer for two end-to-end flows.

## Layer 1 — Unit (Vitest, fast, always run)

Pure logic already extracted or trivially extractable. New files under `tests/unit/`:

- `create-gathering-schema.test.ts` — the zod schema and location-key parsing (`venue:<biz>:<table>` vs `saved:<id>`) used by the create-gathering form: required location, subject length bounds, seats 2–30, past-date rejection. Requires extracting the schema + a `parseLocationKey` helper into `src/lib/create-gathering-rules.ts` and importing it from the route (behavior-preserving refactor, no UI change).
- `attendance-window.test.ts` additions — boundary cases at exactly −30 min and +24 h, and the full `classifyAttendanceError` table (`CHECKIN_TOO_EARLY`, `CHECKIN_WINDOW_CLOSED`, `GATHERING_CLOSED`, `CHECKIN_TOO_FAR`, `NOT_CHECKED_IN`, `ATTENDANCE_ALREADY_SET`, `LOCATION_REQUIRED`, forbidden, unknown).
- `table-fit-blocking.test.ts` — `scoreTables` excludes blocked users from member counts and scores; a table whose only other member is blocked yields no fit rather than a bogus 100%.
- `join-errors.test.ts` additions — `23505` → `already_joined`, `GATHERING_FULL` → `full`, `GATHERING_CLOSED` → `closed`, unknown → `other`.

## Layer 2 — Database integration (Vitest, opt-in `test:db`)

New files under `tests/db/`, reusing `harness.ts`. Harness additions: a third signed-in account (admin) and a venue-owner account, plus fixture helpers for saved locations, blocks, and messages.

- `capacity.test.ts` — join succeeds up to `seats`; the seat-filling insert past capacity raises `GATHERING_FULL`; duplicate join by the same user raises the unique-violation path; joining a `cancelled` / `rejected` gathering raises `GATHERING_CLOSED`. Includes one concurrency case: two simultaneous joins on the last remaining seat — exactly one succeeds.
- `attendance.test.ts` — check-in before the 30-min window → `CHECKIN_TOO_EARLY`; after end+24 h → `CHECKIN_WINDOW_CLOSED`; check-in from `FAR_AWAY` → `CHECKIN_TOO_FAR`; missing coordinates when the gathering is geocoded → `LOCATION_REQUIRED`; checkout without check-in → `NOT_CHECKED_IN`; re-setting an already-set timestamp → `ATTENDANCE_ALREADY_SET`; attempts to change `user_id` / `gathering_id` / `joined_at` → `ATTENDANCE_IMMUTABLE_FIELDS`; another attendee updating someone else's row → `ATTENDANCE_FORBIDDEN`; happy path inside the window at the venue coordinates succeeds and stamps `checked_in_by`.
- `approvals.test.ts` — state machines and who may drive them:
  - Gatherings: a non-admin host cannot change `status` (`prevent_gathering_status_change_non_admin`); an admin can move `proposed` → `approved` / `rejected`.
  - Businesses: an owner cannot self-approve (`prevent_business_status_change_by_owner`); an admin can.
  - Saved locations: owner inserts and the row lands `pending`; owner cannot flip `status`; admin can approve and reject with a reason; only approved locations are selectable by the owner's approved-location query.
  - Venue tables: label uniqueness (case-insensitive) and the active-gathering lock (`TABLE_LOCKED`, `TABLE_CAPACITY_LOCKED`).
- `blocking.test.ts` — with a block in place, chat messages are hidden in both directions through the RLS-scoped anon clients (blocker→blocked and blocked→blocker), and reports insert clamps `status` to `open` for non-admins while admin resolution is permitted.
- `auth-roles.test.ts` — the `handle_new_user` trigger: a signup with `account_type: "venue"` gets the `venue` role and a profile row; a plain signup gets `user`; an invalid `account_type` falls back to `user`; `user_roles` is not writable by the authenticated role (no self-promotion to admin). Uses service-role `auth.admin.createUser` for throwaway accounts, deleted in teardown.

`getTableFit` blocking exclusion is covered at the unit level (Layer 1) since the server function's data-gathering is a thin admin query around `scoreTables`.

## Layer 3 — End-to-end (Playwright, opt-in)

Two flows only, run against the local dev server with `bun run test:e2e`:

1. **Signup → onboarding → create gathering at a saved location.** New user signs up, completes onboarding, adds a saved location (pre-approved via service role to keep the test deterministic), creates a gathering, lands on the detail page.
2. **Join flow.** A second account signs in, opens that gathering from Explore, joins, sees the seat count decrement, and sees the duplicate-join guard on a second attempt.

Setup: add `@playwright/test`, a `playwright.config.ts` pointing at `http://localhost:8080` with `webServer` reuse, and `tests/e2e/`. Accounts are created and torn down via service role with the same `[test-<runId>]` tagging discipline. E2E is excluded from `bun run test` so the default suite stays fast and offline.

## Scripts

- `bun run test` — unit only (unchanged default, no network).
- `bun run test:db` — DB integration (unchanged gating: `TEST_DB_ENABLED=1` + credentials).
- `bun run test:e2e` — Playwright (skips with a clear message when credentials are absent).

## Env vars needed for the opt-in suites

Existing: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `TEST_HOST_EMAIL/PASSWORD`, `TEST_ATTENDEE_EMAIL/PASSWORD`.
New: `TEST_ADMIN_EMAIL/PASSWORD` (an account holding the `admin` role) and `TEST_VENUE_EMAIL/PASSWORD` (a `venue` account). Both must be dedicated test accounts.

## Scope and cost estimate

| Layer | New/edited files | Est. tests | Effort |
| --- | --- | --- | --- |
| Unit | 4 files + 1 small extraction | ~30 | small |
| DB integration | 5 files + harness additions | ~35 | medium-large |
| E2E | config + 2 specs + fixtures | 2 flows | medium |

Roughly a single focused build session end to end; the DB layer is the bulk of it. The only production-code change is the behavior-preserving extraction of the create-gathering zod schema and location-key parser into `src/lib/create-gathering-rules.ts`.

## Deliberately out of scope

UI snapshot tests, component render tests, i18n coverage, notification delivery, MCP endpoints, and exhaustive validation edge cases.

## Open questions

1. Can you provide (or should I create via service role) the dedicated `admin` and `venue` test accounts?
2. Playwright is not currently a dependency — OK to add it as a devDependency, or would you rather keep the suite DB-only for now?
