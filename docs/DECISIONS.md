# Decisions

Initial accepted decisions below come from the user's workflow brief and referenced Ideal Gathering discussion. Observations are labeled separately; they do not silently change product policy.

| ID | Status | Decision and consequence |
| --- | --- | --- |
| IG-D001 | Accepted | Mission: “No one should be alone.” Optimize meaningful real-world connection. |
| IG-D002 | Accepted direction | Typical gatherings are 2–5 people. Current limits differ; changes require a spec. |
| IG-D003 | Accepted | Not dating, Meetup/swipe/follower/like mechanics or a ticket marketplace. No core popularity system. |
| IG-D004 | Accepted | GitHub is the durable source of truth; save decisions, specs and progress there. |
| IG-D005 | Accepted | Codex is primary coding agent; ChatGPT supports product/UX/architecture/spec discussion and review. |
| IG-D006 | Accepted | Supabase remains backend/auth/database/storage where applicable; preserve actual integration. |
| IG-D007 | Accepted | Lovable primarily supports infrastructure/deployment. Preserve synchronization and published history. |
| IG-D008 | Accepted | Beta prioritizes onboarding, profiles/social signals, gathering loop, Cell group quality, venue support and trust/privacy. |
| IG-D009 | Deferred | Live Gathering, Emergency Button, Community Aid and advanced Brain research are later-phase. |
| IG-D010 | Accepted | Inspect and reuse the implementation. No unrelated refactors or invented redesign/schema. |
| IG-D011 | Accepted | Major implementation requires an IG-XXX spec derived from product discussion and approved scope. This setup changes docs only. |
| IG-D012 | Accepted | Use safe incremental migrations, protect secrets, run relevant checks and report failures/remaining issues. |
| IG-D013 | Accepted | Group quality outranks simple similarity; current deterministic Cell is distinct from future Brain research. |
| IG-D014 | Accepted | Incremental saved checkpoints make interrupted work resumable; reinspection is required, not a restart from zero. |

## Observations awaiting decisions
- Creation form 2–30, original database check 1–50, versus typical 2–5 product direction.
- Owner bootstrap references a removed public helper; generated types omit owner/new RPCs. Proposed first fix requires verification and an approved spec.
- Preference table exists in generated types and application usage but no creation migration was found among the 59 committed migrations.
- Existing profile fields and preference-table fields overlap; choose ownership before a Profile V2 change.
- Typography comments/tokens/base rules disagree; preserve current rendering until a scoped decision.
- Existing chat/check-in/ratings remain; later-phase naming does not authorize deleting them.

## Adding a decision
Append a stable ID, status (Proposed/Accepted/Superseded/Deferred), source/approval, problem, decision, rationale, alternatives, consequences and affected task/docs. Link superseded entries rather than erasing history.
