# IG-002 — Final verification

Date: 2026-09-19. Status: **complete for the approved implementation scope**.
Branch: `codex/ig-002-profile-data-ownership`, based on IG-001 completion
`c78968c`. Review/merge and production rollout are separate; nothing deployed.
Implementation checkpoint `a0f72aa` is pushed in ready-for-review
[PR #6](https://github.com/idealgathering-collab/ideal-gathering/pull/6), stacked
on IG-001 PR #5. The follow-up documentation commit records this review link.

## Outcome and changed files

- [Ownership map](../../docs/PROFILE_DATA_OWNERSHIP.md): every profile/preference
  field, read/write inventory, compatibility precedence, privacy, rollout/recovery.
- Profile/onboarding routes and new profile-data helper: one atomic self-save
  RPC, changed fields only, load ordering/retry, no swallowed save failure or
  completion marker after partial failure. Private identity never loads from a
  public card. Empty/null choices are intentional. No navigation redesign.
- Profile-card/public loaders and gathering-preferences helper: canonical
  preferences only, no legacy fallback or obsolete dual-save helper. Public
  intentions remain visible; raw behavioral preferences remain private. Legacy
  public style slots now return null (public card previously discarded them).
- Style component: existing tile layout/icons/translations accept current
  onboarding tokens as well as preserved legacy tokens. No visual redesign.
- New additive migration, narrow generated-type reconciliation, native/API/unit
  tests/config, test instructions and database/UX/matching/decision documents.
  Matching weights, admin/owner/venue architecture and dependencies unchanged.

## Database evidence

Used only the previously designated synthetic native PostgreSQL 17.5 database
`ig001_disposable` at 127.0.0.1:55439, with its checked disposable marker, plus
PostgREST 12.2.3 at 127.0.0.1:55440. The IG-001 fixture had applied all 60 prior
migrations; this task applied 20260919150000_profile_preference_ownership.sql.
No hosted credentials were read or production migration executed.

First run passed with the preference table absent. Subsequent runs tested the
existing table. Migration creates only if absent, inserts missing canonical
rows, preserves all existing canonical rows/timestamps and all legacy columns,
adds self-only grants/RLS including a restrictive privacy policy, and defines
the transactional invoker RPC. Known legacy size buckets map 3/4/5; unknown
sizes stay in their archival column, and text styles are not semantically guessed.

29 named native checks passed, plus expected-denial assertions: existing-user
backfill; explicit empty/null precedence; unknown legacy preservation; own and
cross-user RLS; anonymous denial; a deliberately broad existing policy unable to
widen access; invalid/privileged patch fields rejected; profile/onboarding
ownership; retained identity/traits; no fabricated skipped preferences; new-row
defaults; rollback of identity/onboarded_at after a forced preference constraint
failure. Temporary test policy/constraint was removed in the same transaction.

The PostgREST cache initially predated the new RPC. A restart attempt also lacked
the native DLL PATH. Both were resolved; subsequent starts use the new local
Start-PostgREST.ps1 launcher. Final launcher check returned HTTP 200 and cache
counts 19 relations, 26 relationships, 6 functions. A dedicated API test resolves
and executes save_my_profile_data with both typed arguments.

## Exact final checks

Commands below run at repository root; `<runtime>` is the marked loopback-only
scratch runtime described in tests/README.md. Bun 1.4.2, Node 24.19.0, Vitest
4.1.11, TypeScript 5.9.3, Windows x64; no application dependency/lockfile changes.

| Check/command | Result |
| --- | --- |
| `node tests/profile-postgres.verify.mjs <runtime>` | Exit 0; 29 native checks pass. Final rerun tested existing table; earlier first run verified missing-table creation. |
| `Start-PostgREST.ps1 -Restart` from runtime | Exit 0; HTTP 200 and current cache above. |
| `IG002_RUNTIME=<runtime> node node_modules/vitest/vitest.mjs run --config vitest.profile.config.ts` | Exit 0; 9/9 tests pass. Real clients/HTTP RPC/RLS and profile/public/matching/recommendation handlers. |
| `IG001_RUNTIME=<runtime> node node_modules/vitest/vitest.mjs run --config vitest.owner.config.ts` | Exit 0; 42/42 owner/admin handler/route regression tests pass after migration. |
| `bun run test` | Exit 0; 192/192 unit tests, 17 files. Includes 7 new save/changed-field/skip/error cases and existing matching/recommendation tests. |
| `node node_modules/typescript/bin/tsc --noEmit` | Exit 0 after final generated-type changes; no diagnostics. |
| `node node_modules/eslint/bin/eslint.js <changed TS/TSX/MJS files> --format json --output-file <scratch>/ig002-lint-final.json` | Exit 1 only for 760 pre-existing generated-types formatting errors; 0 warnings. All other changed sources, new helper/tests/config are clean. Final generated-types-only rerun: same 760/0. |
| Same lint on eight existing changed files at `c78968c` | Exit 1; 875 errors/1 warning. Both copies normalized to LF for a like-for-like comparison; generated types had the same 760 errors. |
| `node node_modules/vite/bin/vite.js build` | Exit 1 at Lovable MCP Windows path validation, before application compilation. |
| Same build in detached baseline `c78968c` using identical dependencies | Exit 1 at the same assertContains check: slash-normalized Vite root versus backslash Windows routesDir. No unrelated tooling workaround. |
| `node node_modules/vitest/vitest.mjs run --config vitest.db.config.ts` without opt-in | Exit 0; 45 hosted tests skipped, **not passes**. No hosted mutations. |
| `node tests/owner-postgres.types.mjs <runtime>` | Exit 0; public schema regenerated using Supabase postgrest-typegen 0.2.2. Non-failing pg concurrent-query deprecation warning. |
| `git diff --check` | Exit 0. |

Lint's changed-file list: src/components/profile/style.tsx;
src/integrations/supabase/types.ts; src/lib/{gathering-preferences,
profile-card.functions,profile-data,public-profile.functions,public-profile}.ts;
src/routes/_authenticated/{onboarding,profile}.tsx;
tests/unit/profile-data.test.ts; tests/profile-integration/ownership.test.ts;
tests/profile-postgres.verify.mjs; vitest.profile.config.ts.

Generated type diff reviewed: adopted only save_my_profile_data and six
NonNullable<Json> declarations for preference intentions/gathering_types in
Row/Insert/Update, reflecting the verified NOT NULL columns. An AST-normalized
comparison confirms the whole preference-table and RPC signatures match output.
Unrelated global nullability/PostgREST-version differences were not adopted.

## Acceptance and practical limits

All IG-002 data-ownership acceptance criteria are satisfied locally: documented
single sources; consistent transactional editors; canonical matching/card/public
reads; existing-user compatibility; no deleted data or contradictory dual-save;
no widened private exposure; relevant tests pass. Spec/report archived and
IG-003 is next. Do not implement it as part of this change.

UI initialization/retry and navigation branches were inspected and typechecked;
they were **not browser E2E tested**. Application integration bypasses framework
dispatch/auth middleware but executes real database queries and RPC. The local
auth/storage scaffolding is not hosted Supabase Auth, email, storage or deployed
server rendering. No supported Linux/container runtime is available for the
build; the baseline Windows blocker remains. Full hosted/browser/deployment
validation belongs to staging rollout, not a claimed result here.

Temporary PostgREST and PostgreSQL services were stopped after verification.
Synthetic runtime/fixtures and the launcher remain outside the repository for
future authorized test runs; no secrets or runtime dependencies were committed.

Intentional same-field simultaneous edits remain last-writer-wins. Unknown
legacy vocabulary is preserved rather than guessed. Real target schema/ledger
drift must be checked before deployment; apply migration before new clients and
verify cache refresh. Follow ownership-map recovery guidance. No merge, live
data alteration, venue/dashboard redesign, Life Profile or IG-003 work.
