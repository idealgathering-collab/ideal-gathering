# IG-006 — Public / Other-User Life Profile

## Status
Approved for implementation planning.

## Goal
Make the existing other-user profile show the shared version of the same Life Profile.

## Product principle
Own profile and other-user profile are one profile concept with different permissions.

## Visible when permitted
Avatar, name, city, bio, interests, social style, selected/shared Life Moments, selected/shared gatherings, and appropriate shared places.

## Never expose
Private notes, private Life Moments, exact private location, DOB, raw private ratings, private behavioral signals, hidden matching data, or internal admin/owner data.

## Required implementation
Update the existing people/public profile experience and loaders rather than creating a parallel profile system. Preserve report/block behavior and privacy rules.

Do not add followers, public like counts, or popularity scores.

## Acceptance criteria
- Visiting another user shows the shared Life Profile.
- Private moments are never shown.
- Blocked-user behavior still works.
- Public-profile loaders return only intended fields.
- Mobile and desktop layouts work.
- Existing matching/profile-card behavior remains compatible.
