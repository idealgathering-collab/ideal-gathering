# IG-006 — Other-User Member Profile + Privacy

## Status
Complete in the task branch, 2026-09-26. Not merged or deployed.
See [verification](IG-006-verification.md) for exact evidence and limits.

## Approval and goal
The user's explicit IG-006 request supersedes the old public-profile wording.
Transform the existing people route into an in-app Member Profile for trust around
real gatherings, related visually to IG-005. No public internet discovery or /life
route, followers, feeds, ranking, AI summaries, venue work, Pulse or IG-007 metrics.

## Access rule
Both accounts must be verified, beta-authorized members. They must share an
approved gathering as host or registered participant; after it ends (two-hour
fallback when ends_at is absent), participants require check-in. Blocks in either
direction between members or with that gathering's host invalidate the relevant
connection. Staff have no member-RPC bypass. Own links redirect to /profile.
No new join-request relationship is invented. Missing/unrelated/blocked/unavailable
profiles use the same safe state.

## Data and UI
Identity: name, scoped signed avatar, city, bio, interests. Canonical intentions
remain compatible with cards; compact social style uses canonical energy, size,
conversation and stranger comfort. A generic shared-gathering sentence reveals
no hidden history. The existing shared-moment RPC supplies up to 12 recent moments
explicitly visible on the profile, with title/date/optional signed photo only.
Never include DOB or birth year, private notes/moments, detailed location, source
gathering IDs, hidden attendance, contact details, ratings or ownership metadata.

Reuse IG-005 tokens, existing report/block actions and the IG-003 shared-read
policy. Support mobile stack, desktop columns, EN/RU/FA, RTL, accessible dialogs,
focus restoration, loading/empty/unavailable/error states. No edit controls on
other profiles. Remove public-social metadata; retain noindex/nofollow/noarchive.

## Completion
Implemented and verified as described in the report. Additive migration applied
only to the marked disposable local database. Supported-platform build and staging
Auth/Storage/navigation checks remain release requirements. IG-007 is next and
was not started.
