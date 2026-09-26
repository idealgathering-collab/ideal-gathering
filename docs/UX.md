# UX

## IG-005 own Life Profile — 2026-09-24

`/profile` now opens on identity, a bounded real-data life summary, private-aware
moments timeline, eligible completed gatherings, current gathering places and
About. Mobile stacks sections; desktop expands the activity area to columns.
Profile editing lives in a responsive dialog with existing fields and saves.
Account controls remain in a disclosure section; global navigation is unchanged.
Own timeline editing reuses the optional photo/note/visibility editor, even when
the source gathering is unavailable. Loading/errors never imply zero activity.
Counts and places explain their limits; no lifetime statistics or inferred visits.
EN/RU/FA copy and mobile RTL are supported. The separate IG-006 member view is
documented below.
See [contract](LIFE_MOMENTS.md) and [verification](../tasks/completed/IG-005-verification.md).

## IG-004 completed gathering memory — 2026-09-24

Gathering detail now offers an optional Remember this? card after attendance and
safety actions, before the existing room. Only an eligible completed gathering
or the caller's existing saved moment produces a card. A compact dialog prefills
known facts; private-by-default save works without photo or note. Existing moments
open for editing, duplicate retries recover the saved version, and photo failures
retain the text record. No automatic modal interrupts feedback/check-in; their
flows are unchanged. Supported language copy includes Persian RTL. See the
[flow contract](LIFE_MOMENTS.md) and [verification](../tasks/completed/IG-004-verification.md).

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
- IG-002 resolves swallowed onboarding save failures: preferences, quiz and completion save atomically; failure keeps the user in the existing flow with an error. Editors wait for successful initialization and offer load retry.
- IG-002 defines [profile/preference ownership](PROFILE_DATA_OWNERSHIP.md). Existing screens remain in place; changed-field saves preserve unrelated edits from the other flow.
- Typical group size is 2–5 but the creation validator permits 2–30. Decide policy before altering limits.
- Existing beta roadmap still lists pending-screen mobile tabs and route-level venue gating as unfinished; preserve those as candidates, not newly verified defects.
- Distinguish direct joining of approved gatherings from any future host-reviewed join-request workflow; do not invent a request table or claim one exists.
- Check signed-out, waitlisted, onboarded, member, venue, admin and owner paths separately. Client navigation checks do not substitute for server authorization.

## Acceptance expectations for approved UX changes
Specify loading, empty, validation, permission-denied, partial-save, retry and success states; accessible labels and keyboard/focus; mobile layout; translations/RTL; and private/public field visibility.
Exact date of birth, raw private ratings and location coordinates require explicit visibility decisions. Avoid exposing another person's private signals through matching explanations.
Future Live Gathering, Emergency Button and Community Aid require separate research/specifications. Existing chat/check-in stays intact.

## IG-006 in-app Member Profile — 2026-09-26

The existing people route now shows identity, interests/compact social style,
a generic shared-gathering context, up to 12 shared moments and About. It uses the
IG-005 card tokens and mobile stack/desktop columns, with EN/RU/FA copy. No editing,
match score or message shortcut is presented. Self routes return to IG-005.
Loading is distinct from an empty shared timeline. Missing, blocked, unrelated
and failed loads use the same generic unavailable state. Report/block reuse the
existing actions and dialogs; closing restores focus, and a successful block
removes the viewed profile. Metadata has no public-social description and uses
noindex/nofollow/noarchive. These are authenticated application pages.

## IG-007 own recent-life summary — 2026-09-26

The own profile shows completed gatherings and saved moments in the last 30 days,
persisted activity categories and three simple 10-day gathering counts. It replaces
the old list-length snapshot, leaving identity/editing and history cards intact.
The private label and expandable counting explanation distinguish complete period
totals from the capped history below. Empty is a warm invitation with the existing
My Gatherings link; loading and retryable errors never imply zero activity.
Mobile stacks the periods; desktop uses three columns. EN/RU/FA labels, dates,
numbers and RTL are supported. No people/place estimates, scores or comparisons.
