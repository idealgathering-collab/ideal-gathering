# Current task

IG-001: [Owner Control Center foundation](IG-001-owner-control-center.md).
Approved by Farzin's explicit Codex request on 2026-09-11.
Branch: codex/ig-001-owner-control-center. Baseline: 4cee6c5.
Checkpoint: inspection and approved bounded spec complete. Checks not yet run.
Next: additive DB boundary, shared server guards, independent Owner routes and Admin access panel; then tests and completion evidence.
No migration applied, merge or deployment. Schema replay hazards remain in docs/DATABASE.md.

Checkpoint 2: additive migration and server guards implemented; Owner routes moved to independent _control layout, Admin access panel added. 41 disposable PostgreSQL checks passed. Existing 161 unit tests passed before new guard tests. Baseline build reproduces Lovable Windows path error; baseline lint has 37,521 errors / 14 warnings. Route tree regenerated using installed TanStack generator (also resolves existing missing venue registration route types). Fixing an existing status type error in moved Owner directory. Next: finish unit/handler checks, final typecheck/lint, docs and PR. No live DB changes.
