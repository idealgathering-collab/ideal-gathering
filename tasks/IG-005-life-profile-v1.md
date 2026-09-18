# IG-005 — Life Profile V1

## Status
Approved for implementation planning.

## Goal
Transform the current Profile into the main representation of a person's real life while preserving existing identity and matching information.

## Core rule
There is no separate Life page. Existing `/profile` becomes the Life Profile.

## Preserve
Avatar, display name, city, neighborhood, bio, interests, intentions, social/gathering preferences, relevant traits, and useful profile completion/editing.

## Target structure
1. Profile identity
2. Life summary
3. Moments timeline
4. Gatherings
5. Places where reliable
6. About/profile details

Heavy editing should not dominate the main profile experience.

## Own-profile behavior
Owner sees all permitted personal information, private moments, edit controls, and privacy controls.

## Acceptance criteria
- Existing `/profile` becomes the Life Profile.
- No `/life` route is introduced.
- Existing profile editing remains accessible.
- Life Moments render correctly.
- Empty states exist.
- Mobile and desktop work.
- Existing profile information is preserved.
- No unrelated navigation redesign.

## Out of scope
AI life analysis, yearly stories, repetition warnings, recommendation-engine changes.
