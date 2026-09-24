# IG-004 — Completed Gathering to Life Moment

## Status
Complete — 2026-09-24. Implemented on `codex/ig-004-gathering-to-life-moment`.
See [verification report](IG-004-verification.md) for exact checks, environment
limits and rollout requirements. No production migration, merge or deployment.

## Goal
Make completed real-world gatherings naturally become part of the user's Profile.

## Principle
Ideal already knows what happened, when, where, which gathering, who participated, and which venue was involved. The user should only add optional emotional context.

## Required workflow
1. Detect an eligible completed gathering.
2. Confirm the user was an eligible real participant using existing participation/attendance rules.
3. Offer a lightweight “Remember this?” flow.
4. Pre-fill title/activity, date, and venue/place.
5. Allow optional photo, short note, and visibility.
6. Save the Life Moment.
7. Prevent accidental duplicate automatic moments for the same user/gathering.

## UX direction
Keep the flow short. Do not introduce another long form.

## Acceptance criteria
- Eligible completed gathering can become a Life Moment.
- Duplicate automatic moments are prevented.
- Non-participants cannot create a gathering-derived moment pretending they attended.
- Flow works on mobile and desktop.
- Existing post-gathering rating/feedback remains functional.

## Out of scope
AI-written memories, mood detection, relationship inference.
