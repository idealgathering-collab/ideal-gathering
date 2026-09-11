# UX

## CURRENT flow map
Evidence baseline: `a37898970d63c9358c0592a7c81f07c7cbf2b828`. Source inspection, not end-to-end validation.

| User journey | Existing entry points and behavior |
| --- | --- |
| Entry/access | Landing, `/waitlist`, `/invite`, `/auth`, `/pending`; beta-access helpers and role-specific homes |
| Onboarding | `/_authenticated/onboarding.tsx`: welcome → how → preference intro/preferences → quiz intro/quiz/result; prior preferences load for editing |
| Completion | Onboarding writes `onboarded_at` before dashboard navigation; failed completion write shows error and prevents navigation |
| Profile | `/_authenticated/profile.tsx`: profile card plus editing of identity, bio, location, interests, social links, photo and preferences; saved locations |
| Discovery | `/dashboard`, `/explore`, recommended rows, type/city/area/sort controls and table-fit displays |
| Create/join | `/create-gathering`, `/gatherings/$id`; venue table or saved-location selection; proposal/approval and attendee membership rules |
| Gathering support | Room messaging/checklists, attendance/self-check-in, post-gathering feedback |
| Trust | Report dialog, blocked-users settings, moderation functions and admin surfaces |
| Venue/operator | Venue auth/register/dashboard; separate admin and owner surfaces |

Route files are in [src/routes](../src/routes/README.md). Supporting UI is in `src/components/`; pure rules and server functions are in `src/lib/`.

## Accepted experience direction
Support a calm path from “I would like company” to a small real gathering. Make purpose, timing, location, available places and participation status understandable. Prioritize group comfort over popularity and pairwise attraction.
Reuse existing flows; do not impose a new onboarding or profile design without a spec. Treat preferences/personality as helpful signals, not labels of human worth.

## Known gaps and questions for specifications
- Onboarding intentionally catches quiz/preference save failures as non-blocking while still attempting completion. Discuss whether users need explicit partial-save/retry feedback; no change is approved.
- Multiple profile/preference representations exist; define which field each editor owns before changing saves.
- Typical group size is 2–5 but the creation validator permits 2–30. Decide policy before altering limits.
- Existing beta roadmap still lists pending-screen mobile tabs and route-level venue gating as unfinished; preserve those as candidates, not newly verified defects.
- Distinguish direct joining of approved gatherings from any future host-reviewed join-request workflow; do not invent a request table or claim one exists.
- Check signed-out, waitlisted, onboarded, member, venue, admin and owner paths separately. Client navigation checks do not substitute for server authorization.

## Acceptance expectations for approved UX changes
Specify loading, empty, validation, permission-denied, partial-save, retry and success states; accessible labels and keyboard/focus; mobile layout; translations/RTL; and private/public field visibility.
Exact date of birth, raw private ratings and location coordinates require explicit visibility decisions. Avoid exposing another person's private signals through matching explanations.
Future Live Gathering, Emergency Button and Community Aid require separate research/specifications. Existing chat/check-in stays intact.
