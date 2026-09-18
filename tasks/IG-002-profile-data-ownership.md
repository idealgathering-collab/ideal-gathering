# IG-002 — Profile Data Ownership Cleanup

## Status
Approved for implementation planning.

## Goal
Define one reliable source of truth for each profile and gathering-preference field before expanding Profile into the Life Profile.

## Problem
Profile-related information is split across `profiles` and `user_gathering_preferences`, and some concepts overlap. Current profile/onboarding loaders and saves use both.

## Scope
Create and enforce a clear ownership map without losing existing user data.

## Intended ownership
### profiles
Stable identity/public profile information: display name, avatar, cover, bio, DOB, nationality, gender, city, country, neighborhood, interests, social links, and intentional personality/profile traits.

### user_gathering_preferences
Gathering behavior/preferences: intentions, gathering types, preferred group size, social energy, conversation style, spontaneity, stranger comfort.

## Required implementation
1. Audit every profile/onboarding read.
2. Audit every profile/onboarding write.
3. Remove contradictory save behavior.
4. Make profile-card loaders read the agreed source.
5. Preserve existing data.
6. Do not delete legacy columns unless necessary and safely migrated.
7. Add tests for the ownership mapping.

## Acceptance criteria
- Each editable field has one defined source of truth.
- Profile editing and onboarding no longer fight each other.
- Matching reads the intended preference source.
- Existing profiles continue loading.
- No user data is lost.
- Public/private exposure is preserved.

## Out of scope
Life Moments, Life timeline UI, new onboarding, profile visual redesign.
