# Self check-in/out with location verification + post-gathering loop

Two features, built in order. Feature 1 supplies the checkout signal that Feature 2's rating prompt depends on.

## Feature 1 — Self-service check-in / check-out

### Data
Migration on `gathering_attendees`:
- `checked_out_at timestamptz`, `checked_out_by uuid` (mirrors the existing check-in pair)
- `checkin_lat`, `checkin_lng`, `checkout_lat`, `checkout_lng` (numeric, nullable)

### Access rules
- Keep the existing host/admin UPDATE policy untouched (manual override stays).
- Add a second UPDATE policy: an attendee may update **their own row** (`user_id = auth.uid()`).
- Rewrite `guard_attendance_update()` to branch:
  - admin → unchanged full override
  - host → current behaviour, extended to also allow setting `checked_out_at`
  - self (attendee) → may only touch `checked_in_at`/`checked_out_at` and the four coord columns; all other columns immutable; same window rules (opens 30 min before `starts_at`, closes 24 h after `ends_at`/+2 h default); cannot check out without being checked in; cannot un-set a timestamp once set.
  - `checked_in_by` / `checked_out_by` are always stamped by the trigger to `auth.uid()`, never from the client.

### Server-side proximity check
Inside the trigger, when a self check-in/out sets a timestamp:
- resolve the gathering's coordinates with the same fallback as `gatheringCoords()`: `gatherings.lat/lng`, else the linked `businesses.lat/lng`.
- if coordinates exist, require submitted lat/lng to be present and within **100 m** (haversine in plpgsql), else `RAISE EXCEPTION 'CHECKIN_TOO_FAR: <metres>'`.
- if the gathering has no coordinates at all, skip the distance test (nothing to verify against) but still record the submitted point.
- host/admin marking is exempt from proximity entirely.

### Client
- `src/lib/attendance.functions.ts`: add `selfCheck` server fn (`gatheringId`, `action: 'in' | 'out'`, `lat`, `lng`) writing through `context.supabase` so RLS + trigger stay the boundary; extend `classifyAttendanceError` with `too_far`, `not_checked_in`, `already`. Also return the caller's own `checked_in_at`/`checked_out_at` from a small `myAttendance` fn.
- New `src/components/self-checkin.tsx`: renders on `/gatherings/$id` for confirmed attendees only, when the window is open. Buttons "Check in" → then "Check out". Reads position with the existing one-shot `getCurrentPositionOnce` pattern used by `UseMyLocationButton` (explicit tap only, no ambient prompt), shows spinner, maps trigger errors to localized toasts (too far / too early / window closed / location required).
- Host Attendance tab and `AttendanceRoster` stay exactly as they are; roster gains a read-only "checked out" indicator only.

## Feature 2 — Post-gathering loop

### Data
New `public.gathering_ratings`:
- `id`, `rater_id`, `gathering_id`, `ratee_id` (nullable → null means the gathering itself), `score smallint 1..5`, `comment text null`, `created_at`
- unique index on `(gathering_id, rater_id, coalesce(ratee_id, '00000000-...'::uuid))`
- GRANTs: `SELECT, INSERT` to `authenticated`, `ALL` to `service_role`; no anon.
- RLS: INSERT only when the rater has a `gathering_attendees` row for that gathering with `checked_in_at IS NOT NULL` (and the ratee, if given, is also an attendee of that gathering, and is not the rater). SELECT limited to own rows + admin. No UPDATE/DELETE.

### Prompt trigger
A gathering is "pending feedback" for a user when they checked in, have not rated it yet, and either `checked_out_at` is set, or `now() > closesAt` (the same 24 h-after-end anchor as `checkinWindow`). New server fn `listPendingFeedback` in a new `src/lib/feedback.functions.ts` returns at most the 3 most recent such gatherings with co-attendee profiles.

### UI
- Dashboard: a "How was it?" card at the top when something is pending.
- `/my-gatherings`: same data surfaced as a modal on first visit per gathering (dismiss = skip, no DB write; it reappears until rated or the row ages out after 14 days).
- Rating sheet: 1–5 stars for the gathering, optional comment, plus an optional per-person star row for co-attendees. Submits one row per rating.
- On submit, immediately show 1–2 re-match suggestions: call `getTableFit` over upcoming approved gatherings in the user's city and render the top-fit ones as compact gathering cards with the existing `TableFitChip`.

### i18n
New keys under `att.*` (self check-in/out, too-far, locating) and `fb.*` (prompt, stars, comment, thanks, re-match) in `src/i18n/translations.ts` for en / tr / fa.

## Notes
- No push/email — in-app surfaces only.
- All distance enforcement lives in the database trigger; the client check is a UX nicety, not the boundary.
