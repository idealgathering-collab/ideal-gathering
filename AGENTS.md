<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Ideal Gathering — Codex operating instructions

## Product and ownership
Mission: **No one should be alone.** Help people find the right people, for the right gathering, at the right moment. Typical real-world gatherings are 2–5 people; this is product direction, not a claim about today's enforced seat limit.
This is not a dating app, Meetup clone, swipe app, follower/like social network, or ticket marketplace. Do not introduce popularity mechanics as core behavior.

GitHub is the durable source of truth. Codex is the primary coding agent. ChatGPT supports product, UX, architecture, specification discussion and review. Lovable primarily supports infrastructure/deployment; preserve its working integration. Supabase supplies backend/auth/database/storage where currently used.

## Start every task
1. Read this file, applicable nested instructions, [current task](tasks/current.md), and its linked IG-XXX specification.
2. Inspect current branch, working changes and recent commits before editing. Preserve other work. Read the actual implementation, relevant tests, migrations and existing documentation.
3. Consult [product](docs/PRODUCT.md), [UX](docs/UX.md), [architecture](docs/ARCHITECTURE.md), [database](docs/DATABASE.md), [matching](docs/MATCHING.md), [design system](docs/DESIGN_SYSTEM.md), [roadmap](docs/ROADMAP.md), and [decisions](docs/DECISIONS.md) as relevant.
4. No major implementation task is approved until a product discussion becomes an IG-XXX spec and the user approves its scope. Drafting a spec does not approve it. Existing approval persists: do not repeatedly request it. This workflow setup authorizes documentation only.
5. Treat CURRENT as observed implementation, PROPOSED as unimplemented direction, and UNKNOWN as requiring verification. Record conflicts; do not silently invent schema or redesign the app.

## Implementation discipline
- Reuse existing components, helpers, routes, tokens and translations. Avoid unrelated refactors, dependency upgrades, file moves and whole-repo formatting.
- This is TanStack Start file-based routing. Follow [route conventions](src/routes/README.md); preserve `__root.tsx` and its Outlet. Do not create Next.js/Remix layouts or hand-edit `src/routeTree.gen.ts`.
- Preserve the Lovable Vite wrapper; do not duplicate its React, TanStack, Tailwind or Nitro plugins.
- Keep service-role credentials and privileged clients server-only. Validate inputs and authorize the requested resource before privileged reads/writes; route gating alone is insufficient.
- Protect secrets: never print, copy into docs, commit or expose credentials, tokens, private user records or environment values. A tracked `.env` exists; its presence is not permission to disclose its contents.
- Preserve privacy, blocking, beta access, email verification, capacity and moderation enforcement. Return minimum necessary profile/matching information.
- Use new ordered migrations, never rewrite applied migrations. Review constraints, RLS, grants, triggers, functions, indexes, backfills and rollback/recovery. Prefer additive changes; test against a disposable database before rollout. Separate enum additions from migrations using their new values. Regenerate types from verified schema through the established tooling.
- Do not deploy, alter live data or run destructive database cleanup merely to validate a documentation task.

## Checks
Use existing package conventions: `tests/README.md` uses Bun; both Bun and npm lockfiles exist. Do not regenerate either casually.
For implementation changes, run relevant unit tests (`bun run test`), lint (`bun run lint`), typecheck (`bunx tsc --noEmit`) and build (`bun run build`) as applicable. State exact commands and results, including pre-existing failures and blocked checks. Do not claim old roadmap test counts as a new test run.
Database tests are opt-in and mutate a hosted database: follow [test safeguards](tests/README.md), use a designated test environment and dedicated fixtures. Never infer authorization to use production credentials. There is no existing browser E2E suite.
For docs-only changes, check required files, links, factual references, preserved docs and that the diff contains documentation only. Do not add tests that merely mirror prose.

## Checkpoints and handoff
Work in small, coherent stages. Save completed files and update `tasks/current.md` after each stage with task ID, scope, branch, checkpoint, completed work, remaining work, checks, failures and exact next step. Commit/push to the task branch when authorized so GitHub retains the checkpoint; never force-push published history.
On resume, inspect those files and Git state, reconcile incomplete work, and continue without redoing verified stages. Do not assume a usage reset automatically resumes execution.
Use `tasks/TASK_TEMPLATE.md`; keep accepted specs in `tasks/IG-XXX-short-title.md`. On completion, move the spec and its report to `tasks/completed/`, link it from current.md, and update affected docs/decisions.

## Required completion report
Report: outcome; files changed and why; database changes (or none), migration and rollout status; tests; typecheck/lint/build results; failures; remaining issues/risks; and recommended next task. Distinguish code inspected from behavior actually tested, and committed branch work from merged/deployed work.

Codex instruction-file reference: [official OpenAI documentation](https://learn.chatgpt.com/docs/agent-configuration/agents-md).
