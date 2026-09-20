# IG-003 — Final verification

Completed 2026-09-20 for the approved backend/data-foundation scope.
Branch: `codex/ig-003-life-moments-foundation`, based on IG-002 `72b214a` / PR #6.
No production migration, merge or deployment. IG-004 has not started.

## Delivered

- Additive migration `20260919210000_life_moments_foundation.sql`: minimal table,
  owner/profile and optional gathering FKs, timestamps, bounded title/note/date,
  private/profile visibility, immutable ownership/source, partial unique linked
  moment constraint and read/FK indexes.
- Linked insertion checks an ended approved event and host/checked-in eligibility;
  captures the event date. Title/date survive event edits/deletion; no copied
  location/participant data. Manual null-gathering records remain supported.
- Own-only raw rows, strict column grants, beta/email/member checks, block-aware
  shared RPC without notes/source IDs/attendance/location, private media bucket
  with restrictive boundaries, unique owner/moment image paths and no overwrite.
- `life-moments.ts`: strict input schemas and scoped photo paths.
  `life-moments.functions.ts`: own/shared loaders, create, update/hide, delete,
  signed upload preparation. All DB mutations use the caller's authenticated
  client. Shared photo signing uses a server-only client only after the safe
  projection authorizes the path, with a 60-second expiration.
- Generated table/RPC types, unit/native/API tests and native Storage catalog
  scaffolding. [Contract and rollout guidance](../../docs/LIFE_MOMENTS.md),
  database/product/decision documentation and task/test handoff updated.

No Profile UI, /life route, automatic conversion, timeline, summary, matching
model, venue feature or owner/admin architecture changes. Dependencies, lockfiles
and Lovable tooling are unchanged.

## Environment and fidelity

Designated synthetic PostgreSQL 17.5 database ig001_disposable on
127.0.0.1:55439; marker checked before test operations. Existing IG-001/002 schema
was retained. PostgREST 12.2.3 used only 127.0.0.1:55440 and the verified
Start-PostgREST.ps1 launcher. Readiness returned HTTP 200; cache contained 20
relations, 27 relationships and 7 functions, including the new shared RPC.

The full draft additive migration was applied locally. During development its
two hardened function bodies were reloaded from the same unpublished migration;
final comparison verified all six installed function bodies equal the final
migration source. No earlier migration file was rewritten. Public types were
regenerated after final tests, and AST-normalized comparison confirmed the two
adopted table/RPC signatures match. Unrelated generator differences were excluded.

The local fixture implements minimal Auth/Storage SQL catalogs and real roles,
grants, triggers and RLS. Native tests exercise storage.objects policies and
bucket metadata, not a Storage HTTP service. API tests execute real PostgREST,
Supabase SDK DB queries, validators and handlers; framework/auth middleware and
Storage signing HTTP responses are simulated. Thus no claim of browser, hosted
Supabase Auth, actual upload, signed-token validation or deployed SSR E2E.

## Exact results

Windows x64; Bun 1.4.2, Node 24.19.0, TypeScript 5.9.3, Vitest 4.1.11.
Commands ran at repository root. `<runtime>` denotes only the marked local scratch
runtime from tests/README.md; no hosted credentials were read.

| Command/check | Result |
| --- | --- |
| `node tests/life-moments-postgres.verify.mjs <runtime>` | Exit 0; 61 native checks passed. |
| `<runtime>/Start-PostgREST.ps1 -Restart` | Exit 0; HTTP 200 and current schema cache confirmed. |
| `IG003_RUNTIME=<runtime> node node_modules/vitest/vitest.mjs run --config vitest.moments.config.ts` | Exit 0; 15 API/handler tests passed. Storage transport limitation above. |
| `bun run test` | Exit 0; 212 tests passed in 18 files, including 20 new input/path tests. |
| `node tests/profile-postgres.verify.mjs <runtime>` | Exit 0; all 29 IG-002 native regression checks passed after IG-003. |
| `IG002_RUNTIME=<runtime> node node_modules/vitest/vitest.mjs run --config vitest.profile.config.ts` | Exit 0; all 9 profile/onboarding/card/privacy/matching API regressions passed. |
| `IG001_RUNTIME=<runtime> node node_modules/vitest/vitest.mjs run --config vitest.owner.config.ts` | Exit 0; all 42 owner/admin handler/route regressions passed. |
| `node node_modules/typescript/bin/tsc --noEmit` | Exit 0; no diagnostics. |
| `node node_modules/eslint/bin/eslint.js <changed code/test files> --format json --output-file <scratch>/ig003-lint-final.json` | Exit 1 only for 760 unchanged generated-types formatting errors; no warnings. All new code/test/config and modified native setup files have zero findings. |
| `node node_modules/vite/bin/vite.js build` | Exit 1 at the known baseline Lovable MCP Windows routesDir/root separator assertion before application compilation. |
| `node node_modules/vitest/vitest.mjs run --config vitest.db.config.ts` without opt-in | Exit 0; 45 hosted tests skipped, not passes. |
| `node tests/owner-postgres.types.mjs <runtime>` | Exit 0; Supabase postgrest-typegen 0.2.2 generated public types. Existing pg concurrent-query deprecation warning was non-failing. |
| Type/function source comparisons | Two generated signatures match; six installed migration function bodies match. |
| `git diff --check` | Exit 0. |

Targeted lint files: src/lib/life-moments.ts, src/lib/life-moments.functions.ts,
src/integrations/supabase/types.ts, tests/unit/life-moments.test.ts,
tests/life-moments-postgres.verify.mjs, tests/moments-integration/life-moments.test.ts,
tests/owner-postgres.setup.mjs and vitest.moments.config.ts.
IG-002's verified baseline already had exactly 760 generated-type findings and
the same build failure. No package/lockfile/Vite-config differences from 72b214a.
Docker/Podman unavailable; WSL reports not installed. No unrelated build workaround.

Native coverage includes create/read/edit/delete, unauthorized mutations,
ownership/timestamp grants, anonymous/unverified/waitlisted/venue denials, safe
shared projection, blocks both ways, private notes, missing/ineligible/future/
cancelled/unchecked gathering links, one successful duplicate claim across two
separate connections, manual multiples, historical preservation, size/visibility
constraints, media scope/bucket limits and policies under a deliberately broad
test policy. It also verifies existing join/check-in/check-out, avatar and venue
read/edit/table workflows, and hiding after beta closes. Test-only broad storage
policy was removed in finally. Synthetic records remain local for reproducibility.

## Completion and remaining rollout limits

All IG-003 foundation acceptance criteria are satisfied locally. Spec and report
are archived; IG-004 is next, not included here. Ready for review stacked on PR #6;
review/merge/deployment remain separate.

Before deployment, verify target migration/storage drift and real Storage
upload/sign/expiration with dedicated staging users. Already issued server photo
URLs can remain usable for up to 60 seconds after hiding/blocking/deletion. Moment
deletion intentionally leaves private orphan bytes; an authorized retention/cleanup
process is needed before production media lifecycle rollout. No unrestricted
public bucket or public photo URL is introduced. See the contract for recovery.

Build and actual Storage/browser/hosted Auth E2E remain environment limitations;
they are not reported as passes. No live data was altered.
Final cleanup confirmed both disposable service ports (55439/55440) are closed.
Synthetic runtime data and the launcher remain outside Git for later test runs.
