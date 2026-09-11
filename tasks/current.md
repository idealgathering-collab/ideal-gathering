# Current task

## Approval state
**No major implementation task is approved until a product discussion is converted into an IG-XXX spec and its scope is approved by the user.**
This setup authorizes documentation only. Do not change product functionality, database schema, dependencies or deployment settings.

## Workflow setup checkpoint
Branch: `codex/project-workflow`
Inspected baseline: `a37898970d63c9358c0592a7c81f07c7cbf2b828`
Status: In progress — operating instructions, product direction and task template saved.
Completed: repository inventory; existing instructions/roadmap/test conventions; core route, style, matching and schema inspection.
Remaining: save architecture, UX, database, matching, design system, roadmap and decisions; validate documentation diff and references; publish completion report.
Checks: Git clone unavailable because local Git lacks its HTTPS helper. GitHub connector inspection succeeded. No application checks or database operations run.
Next step: finish reality-first reference docs, preserving existing `roadmap.md`, route/test READMEs and Lovable plans.

## Next implementation
None approved. Recommended first discussion: reconcile owner bootstrap with the existing private role helper and generated schema types, then produce a bounded IG-001 spec. See the upcoming DATABASE.md findings before deciding scope.

## Working loop
Discuss in ChatGPT → write an IG-XXX spec using [template](TASK_TEMPLATE.md) → user approves scope → Codex inspects and implements → checks and completion report → review → next task.
Choose the next unused ID from active and completed tasks. Save durable checkpoints here; on resume inspect branch/Git state before continuing.
