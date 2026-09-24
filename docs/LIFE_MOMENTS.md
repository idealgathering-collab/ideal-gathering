# Life Moments foundation

IG-003 foundation completed 2026-09-20; IG-004 gathering flow completed 2026-09-24.
IG-005 turns the existing `/profile` into the own Life Profile; no `/life` route.

## Own Life Profile (IG-005)

The main profile shows identity, a simple recent-activity summary, saved moments,
eligible completed gatherings, reliable current place labels and About. Editing
opens in a responsive dialog, preserving the existing canonical profile saves.
Account/settings/saved locations remain accessible in a disclosure section.

The timeline uses `loadOwnLifeMoments({limit: 100})`, newest first. Private notes
are only in this own view; visibility/note/photo editing reuses the IG-004 editor,
including manual/detached records. Failed photo signing no longer hides own text.
Active views refresh signed photos every 45 seconds; unavailable media gets a
text fallback. The shared helper's projection and fail-closed behavior are unchanged.

`loadOwnLifeGatherings({})` takes no target-user ID. It uses the authenticated
client/RLS to get the 12 latest approved started hosted and 12 joined bookings,
deduplicates, and reuses `get_gathering_moment_context` for each. Only authorized
ended hosted/checked-in gatherings survive, with account/block checks retained.
These bounded counts are explicitly labeled as this view, never lifetime totals.
The old profile card's booking-based story is not used as attendance evidence.
Place labels are current live context, explicitly not historical visits. Saved
locations do not contribute. No new schema, metrics, tracking, public-profile
UI, or matching changes. See [IG-005 verification](../tasks/completed/IG-005-verification.md).

## Completed gathering flow (IG-004)

The existing `/gatherings/$id` page offers a passive **Remember this?** card below
its attendance/safety actions and above the room. It never opens automatically
or replaces feedback/rating. Reopening a completed gathering is the entry point;
while the page stays open, eligibility refreshes every 30 seconds. Not now hides
the invitation for that visit. There is no new history feed or notification.

A compact responsive dialog prefills the gathering title, date/time and available
venue/place. Saving needs no typing. One JPEG/PNG/WebP photo (up to 5 MiB), a note
(up to 2,000 characters), and visibility are optional; private is the default.
Notes always remain private, including when the moment is shown on a profile.
English, Russian and Persian copy uses the existing language/RTL system.

Additive migration `20260924120000_gathering_moment_context.sql` exposes the
authenticated-only `get_gathering_moment_context` RPC. It is SECURITY INVOKER,
retains source RLS, reuses `private.can_use_life_moments`, and returns only the
requested eligible gathering's id/title/date/place. Eligibility follows IG-003:
approved, ended (missing end defaults to start + two hours), and the caller is
the host or a checked-in attendee. Joining or checking out early is insufficient.
Blocked host/viewer pairs receive no live context. This read-only prefill does
not replace the existing insert trigger or unique index as final authority.

`loadGatheringLifeMoment({gatheringId})` performs an exact caller-owned lookup;
it does not scan a limited timeline or return anyone else's personal data. An
existing record can be edited, even if its source is no longer eligible for new
creation. Its historical title/date are retained; place is live authorized
context only, not a new location snapshot. Photo signing failure leaves the
saved text editable, with an attached-photo indication.

`createLifeMoment` now also returns `alreadyExists`. A unique-conflict retry
returns the caller's existing linked record without overwriting note, visibility
or photo. The editor loads that version and asks the user to edit explicitly.
The database continues rejecting duplicate direct inserts.

Media uses only the IG-003 signed-upload flow. The record saves first, then a
unique private object uploads and its scoped path is attached. A photo failure
keeps the saved record and shows retry/continue-without-photo; it does not create
a second moment. Existing orphan retention and real Storage staging checks below
remain required. The dialog preserves a failed-save draft and disables controls
while saving; background refresh failures do not discard an open editor.

## Model

Migration: `20260919210000_life_moments_foundation.sql`.

| Field | Contract |
| --- | --- |
| id | Generated UUID primary key; immutable. |
| user_id | Required profiles FK; owner fixed at creation; profile deletion cascades. |
| gathering_id | Optional gatherings FK; immutable to clients; event deletion sets null. |
| title | Required trimmed personal caption, 1–160 characters. |
| note | Optional private text, at most 2,000 characters; never in shared projection. |
| photo_path | Optional private bucket path scoped to owner/moment/random UUID. |
| happened_at | Finite past/present timestamp. For linked moments, database snapshots gathering.starts_at at insertion and prevents client date changes while linked. |
| visibility | Checked text: private (default) or profile. No anonymous public state. |
| created_at / updated_at | Server-stamped timestamps; creation timestamp immutable. |

A partial unique index on (user_id, gathering_id) prevents duplicate linked
records while allowing multiple manual records. Owner/date and shared/date
indexes support bounded ordered reads; gathering FK has an index for deletion.

Linked creation requires an approved gathering whose ends_at has passed, using
starts_at + two hours when ends_at is absent. The owner must be its host or a
checked-in attendee. Joining alone is insufficient. These checks occur in the
database even for direct API writes; no automatic completion workflow is added.
Forged ownership is rejected before looking up hidden gathering/attendance data.

The personal title and snapped date provide useful history without copying
venue, city, activity, people or coordinates. They do not follow later event
edits. Event deletion leaves the moment and sets its link null, preserving
existing event-deletion behavior. Historical attendance changes do not erase
previously authorized personal records. Future renderers must treat an optional
live gathering link as current context, not a historical snapshot. IG-004 can
prefill the title; IG-003 requires it as an explicit input.

## Authorization and privacy

Raw table SELECT/UPDATE/DELETE is owner-only; application admin/owner roles gain
no special moment access. Column grants forbid caller changes to identity,
source link and system timestamps. New moments require the existing member role,
verified email and beta-access helper. Sharing requires that access too; owners
can still read, hide and delete private records after access closes.

`list_visible_life_moments` is a constrained definer RPC. It verifies the viewer's
member/email/beta eligibility, excludes blocked pairs in either direction, and
returns only profile-visible id, user_id, title, happened_at and photo_path.
The server helper replaces photo_path with a signed URL. It never returns note,
gathering_id, attendance, participants, city/address or coordinates. No existing
profile/gathering loader is widened or wired to moments in this task.

## Media

The dedicated life-moment-media bucket is private, limited to 5 MiB and JPEG,
PNG/WebP MIME types. Paths are `<user UUID>/<moment UUID>/<object UUID>.jpg|png|webp`.
The record must already exist. Users upload unique paths, then attach a path with
updateLifeMoment; clearing photo_path detaches it. No arbitrary URL, traversal,
other owner's path or other moment's path can be attached.

Storage policies allow own read/insert/delete, disallow overwrite/rename, and
restrict this bucket even if a broad legacy policy exists. Other buckets retain
their behavior. Shared viewers cannot read/sign objects directly. Only after an
own-row query or safe shared RPC authorizes a row does a private server helper
use the server-only signer for a 60-second URL. Owners' upload-token creation
uses their own JWT and storage INSERT policy, with upsert disabled.

Hiding, blocking or deleting stops new shared reads/signing; already issued
server URLs can remain valid for their remaining 60-second lifetime. Owners can
use their own storage permission to create their own links. Deleting a moment
does not delete bucket bytes: orphaned objects become inaccessible through moment
policies. A separately authorized storage cleanup/retention process is needed
before a production media lifecycle rollout; it must not delete unrelated files.
Actual Storage HTTP upload/signing must also be exercised in staging. Local
tests execute the SQL policies but simulate the Storage signing transport.

## Server/data API

`src/lib/life-moments.functions.ts` uses the existing auth middleware:

| Helper | Input and result |
| --- | --- |
| loadOwnLifeMoments | `{limit?}` (1–100, default 50); own rows, notes and signed photos, ordered newest first. |
| loadVisibleLifeMoments | `{userId, limit?}`; only the safe shared projection and signed photos. |
| createLifeMoment | `{title, happened_at, gathering_id?, note?, visibility?}`; derives user_id from auth context. Linked date is replaced by the event's start date in SQL. Returns the row plus `alreadyExists`; duplicate retries preserve the existing record. |
| loadGatheringLifeMoment | `{gatheringId}`; `{prefill, moment}` containing authorized live context and an exact own record, each nullable. |
| updateLifeMoment | `{id, patch}`; patch may contain title, note, happened_at, visibility, photo_path only. Explicit null clears optional values. SQL protects linked dates. |
| deleteLifeMoment | `{id}`; deletes only caller-owned record; does not erase storage bytes. |
| createLifeMomentPhotoUpload | `{id, extension}`; existing own moment, unique private path and signed upload token, no overwrite. |

Hide via updateLifeMoment with `{visibility: 'private'}`. Validation is strict;
unknown fields, empty patches, future dates and invalid media scopes are rejected.
Missing/foreign mutation targets return the same error. Read failures fail closed.
The pure schemas/path helpers live in `src/lib/life-moments.ts`.

Generated types include only the schema-derived table and shared RPC additions.
The generator represents TABLE-return photo_path as string despite runtime null;
helpers explicitly handle null/empty photos. Grants and check constraints remain
database enforcement, not a promise encoded by generated Insert/Update types.

## Rollout and recovery

Only the marked disposable PostgreSQL/PostgREST environment was migrated. Before
any authorized staging/production rollout, inspect the migration ledger and
storage schema/grants, verify no conflicting bucket/table, and apply this ordered
migration after IG-001/002. Confirm private bucket limits, auth/email/beta rules,
block handling, SDK signing/upload and expiration behavior using dedicated users.
Refresh PostgREST schema cache before using the helpers. No production operation
is authorized by this foundation checkpoint.

Recover with a forward correction or disabling the new callers. Preserve user
records/media; do not drop the table/bucket as rollback. Apply the IG-004 RPC
migration after IG-003 and refresh its schema cache before enabling the card.
There are no IG-004 backfills or changed write policies. Disable the new card or
forward-correct the RPC to recover; existing moments remain intact.
IG-005 adds the own-profile view above; IG-006 other-user profiles are next and
are not implemented. No new IG-005 migration or data backfill is required.
See [foundation verification](../tasks/completed/IG-003-verification.md) and
[flow verification](../tasks/completed/IG-004-verification.md).
