# IG-007 — Life Summary & Activity Insights V1

## Status
Complete on 2026-09-26 under the user's explicit IG-007 request.
See [verification report](IG-007-verification.md). Implemented and verified locally;
not merged or deployed. Supported-platform build and hosted staging remain release checks.

## Accepted V1 implementation scope — 2026-09-26
Own profile only. Use an exact rolling 720-hour window for completed gatherings
that started in the window and moments saved (created_at) in the window, including
private/manual/older memories saved recently. Show persisted activity categories
and three half-open 240-hour gathering buckets, oldest first. No row-count cap
may silently truncate totals. Use a caller-scoped invoker RPC with no target ID,
existing beta/verification/host/check-in/block rules and aggregate-only output.
Keep the separately bounded IG-005 history/timeline unchanged.

Deliberately omit people-met (attendance does not prove interpersonal contact),
place-visit totals (venue references/labels can change; no historical location
snapshot), and first-time experiences (no explicit field). Do not derive any
of these from saved locations, profile city, browsing or free text. Replace the
old two-number snapshot with the compact EN/RU/FA summary and useful empty state.
No private metrics on IG-006. No IG-008 work in this task.

## Goal
Use existing real activity to make the Life Profile feel alive without AI-generated conclusions.

## Final V1 metrics
- Completed approved gatherings the caller hosted or checked in to.
- Own Life Moments saved, including private moments.
- Persisted category counts with a safe uncategorized fallback.
- Three 10-day gathering counts within the rolling last 30 days.

The explicit implementation request supersedes the original proposed metric menu
and multiple calendar windows. People, places and first-time counts are omitted
for the reasons above. No AI or inferred outcomes.

## Rules
- Use persisted real data.
- Do not invent or estimate social outcomes.
- Do not count people without reliable evidence; no people metric is implemented.
- Avoid productivity-style pressure, streaks, rankings, or comparison.
- Metrics support reflection, not competition.

## Acceptance criteria
- Profile displays correct activity summaries.
- Empty/new-user states are useful.
- Aggregation logic is tested.
- Counts do not expose other users' private information.
- Metrics are not publicly ranked.

## Out of scope
AI personality interpretation, yearly AI stories, automated life coaching, social scores.
