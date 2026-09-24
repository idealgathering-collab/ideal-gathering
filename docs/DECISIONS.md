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

### IG-D018 — Accepted: own Life Profile with bounded factual activity (2026-09-24)

Source: user-approved IG-005. Transform `/profile` and retain its existing profile
editor behind an explicit dialog. Reuse canonical field ownership, existing
moment helpers/editor and IG-004 gathering eligibility checks. Do not count the
old card's past bookings as attendance. Label recent snapshot counts and current
places precisely; no all-time metrics, inferred visits, new tracking or shared
profile redesign. Consequences: timeline is bounded to 100 moments and gathering
context to the 12 latest started approved hosted/12 joined candidates; no new
migration, and older records remain stored. IG-006 will separately address other
users. See [verification](../tasks/completed/IG-005-verification.md).

### IG-D016 — Accepted: minimal personal Life Moments (2026-09-20)

Source: user-approved IG-003 implementation. Use one personal record owned by a
profile, with an optional gathering FK and unique owner/gathering constraint.
Keep title/date as minimal history rather than copying location/participants;
unlink on gathering deletion instead of erasing the personal record or preventing
event deletion. Validate ended approved gatherings and host/checked-in eligibility
at insertion. Manual records remain supported without an automatic flow.

Raw rows and notes stay owner-only; a bounded authenticated, block-aware projection
serves shared metadata. Private media is owner-scoped; shared viewers receive only
authorized server-signed URLs. No Profile redesign or second profile system.
Consequences: short-lived issued links persist until expiry, and private orphan
cleanup plus real Storage transport checks remain rollout work. See
[contract](LIFE_MOMENTS.md) and [IG-003 verification](../tasks/completed/IG-003-verification.md).

### IG-D015 — Accepted: profile and preference ownership (2026-09-19)

Source: user-approved IG-002 implementation. Profile/onboarding previously read
overlapping fields and could partially save or overwrite unrelated answers.
Identity and personality belong to profiles; gathering behavior belongs to
user_gathering_preferences. Both editors use atomic changed-field patches.
Existing canonical rows win; missing rows receive an insert-only legacy backfill.
Legacy columns remain archival. This avoids destructive removal and ongoing
dual-write/fallback ambiguity while preserving private data boundaries.
Consequences: migrate before shipping the new RPC client; same-field concurrent
edits remain last-writer-wins. See [ownership map](PROFILE_DATA_OWNERSHIP.md) and
[IG-002](../tasks/completed/IG-002-profile-data-ownership.md). This resolves the
preference/overlap observations above; their historical evidence is retained.

### IG-D017 — Accepted: passive gathering memory prompt (2026-09-24)

Source: user-approved IG-004. Gathering facts should not require re-entry, and
memory saving must not interrupt attendance, safety or ratings. Place an optional
card on completed gathering detail, opening the existing dialog primitive with
prefilled core facts and optional personal context. Reuse IG-003 create/update and
private media helpers; retain its trigger and unique index as final authority.
A small invoker RPC supplies authorized context without widening shared moments.
Keep venue/place live rather than copying new sensitive historical fields.
Recover duplicate retries without overwriting the saved personal version.
Consequence: users reach this flow by reopening gathering detail; no notification,
new history feed, automatic creation, or Profile redesign. Actual Storage transport
and application deployment verification remain staging checks. See
[contract](LIFE_MOMENTS.md) and [IG-004 verification](../tasks/completed/IG-004-verification.md).

Append a stable ID, status (Proposed/Accepted/Superseded/Deferred), source/approval, problem, decision, rationale, alternatives, consequences and affected task/docs. Link superseded entries rather than erasing history.
