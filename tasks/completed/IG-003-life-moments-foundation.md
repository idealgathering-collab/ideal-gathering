# IG-003 — Life Moments Foundation

## Status
Complete — 2026-09-20, within the approved backend/data-foundation scope.
See [verification](IG-003-verification.md) and
[model/privacy contract](../../docs/LIFE_MOMENTS.md). Review/merge/deployment are
separate. IG-004 is the next task and has not started.

## Goal
Create the minimum backend structure required for real experiences to become part of the user's Profile.

## Product rule
The Life Profile is the Profile. Do not create a separate `/life` product.

## Scope
Introduce a minimal `life_moments` model, prioritizing gathering-generated moments for beta.

## Proposed data
- id
- user_id
- gathering_id nullable
- title
- note nullable
- photo_path nullable
- happened_at
- visibility
- created_at
- updated_at

Avoid duplicating gathering data that can safely be derived through gathering_id.

## Security requirements
- Users own their moments.
- Other users cannot edit them.
- Private moments are never exposed through public-profile loaders.
- Privileged server reads return minimum required fields.
- Photos follow existing private/signed-URL storage patterns.

## Required implementation
1. Add additive migration.
2. Add constraints, indexes, grants/RLS.
3. Update generated types.
4. Add data/server helpers.
5. Add appropriate tests.

## Acceptance criteria
- User can create, edit, hide/delete own Life Moment.
- Another user cannot mutate it.
- Private moments are not exposed.
- Gathering-linked moments safely reference an existing gathering.

## Out of scope
AI summaries, monthly stories, recommendation nudges, friendship graphs, automated travel history.
