# Current task

## Approval state
**No major implementation task is approved until a product discussion is converted into an IG-XXX spec and its scope is approved by the user.**
No implementation spec is currently approved. Workflow setup authorized documentation only.

## Completed checkpoint
Workflow documentation is complete on `codex/project-workflow`, based on `a37898970d63c9358c0592a7c81f07c7cbf2b828`.
[Completion report](completed/workflow-setup.md) records evidence, changes, checks and unresolved findings.
Incremental checkpoints: `2b54edd` (operating instructions/product/template), `ffb3eee` (reference docs), followed by this completion handoff.
Review/merge status: branch work prepared for review; not merged or deployed by this setup. Inspect the linked branch/PR state on resume.

## Recommended next discussion — IG-001 candidate, not approved
Owner bootstrap correctness and owner-related schema types.
Evidence: latest bootstrap migration calls a public role helper removed by earlier migrations; current types omit owner and owner RPCs. See [database findings](../docs/DATABASE.md).
Proposed bounded outcome: verify on a disposable test target, use the intended role helper safely, preserve admin compatibility, reconcile types and cover authorized/unauthorized/bootstrap cases. Do not broaden into an access-system rewrite.
Next action: discuss expected owner behavior, turn the outcome into `tasks/IG-001-owner-bootstrap.md` using [template](TASK_TEMPLATE.md), and record scope approval before implementation.
Separate candidates: missing preference migration evidence; onboarding partial-save feedback; profile field ownership; seat-size policy; beta navigation; typography consistency.

## Working loop
Discuss in ChatGPT → write IG-XXX spec → user approves scope → Codex inspects/implements → checks and completion report → review → next task.
Choose the next unused ID from active/completed tasks. Save accepted specs under `tasks/`; archive completed specs/reports under `tasks/completed/`.
On interruption, record completed files, branch/commit, checks/failures and exact remaining step here. On resume inspect Git state and continue without redoing completed work. Existing approval persists.
