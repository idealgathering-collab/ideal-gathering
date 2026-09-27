# Venue dashboard — IG-008

The existing `/venue/dashboard` is an application with Overview, Gatherings,
Visitors, My Venue, Tables and Menu. Overview prioritizes upcoming activity,
verified value and recent results. Profile corrections remain available before
approval/beta access; table/menu/activation writes require approved, verified,
beta-eligible venue ownership. Owner preview uses the same components read-only.
Existing registration, moderation, profile fields, menu links and activation are
retained. Table labels/capacities and menu items can now be edited.

Registration and profile editing inherit the shared Armenia search/Yerevan fallback.
Venue activation creates gatherings of 2–5 people, independently of physical table
capacity. `20260927080000_venue_activation_small_groups.sql` enforces this bound on
venue-origin inserts/updates, including direct API writes. Consumer capacity rules
are unchanged. Its NOT VALID constraint preserves historical bookings but requires
any updated violating row to be corrected; audit exceptions before validating it.
See the [corrective checkpoint](../tasks/completed/IG-008-verification.md#corrective-checkpoint--2026-09-27).

## Evidence and counting

All attribution uses existing `gatherings.business_id`, never venue-name matching.
The reporting window is rolling 720 hours; upcoming includes ongoing gatherings
and starts within the next 2160 hours. Only approved eligible gatherings count.
Effective end is ends_at, falling back to starts_at + two hours.

| Measure | Definition |
| --- | --- |
| Completed gatherings | Eligible effective end within the reporting window |
| Verified visits | Attendee rows checked in within the window, no future check-in, event already started; check-in within start minus 30 minutes through end plus 24 hours |
| Unique visitors | Distinct attendee user IDs among those visits, aggregated only on server |
| New visitors | Earliest retained eligible recorded check-in at this venue is in the window |
| Returning visitors | A check-in in the window and an earlier retained eligible venue check-in before it |
| Average attendance | All eligible check-ins at completed-in-window gatherings divided by their count, including zero-attendance gatherings; two decimals, null when none |

New and returning are disjoint, even if a new visitor repeats during the window.
Hosting alone or reserving a seat is not a visit. Blocks in either direction
between caller/business owner and host or attendee exclude their contribution.
Current eligible records are the source: deletion, cancellation, corrections and
blocks can change totals. These are not immutable historical or lifetime totals.

Three consecutive 240-hour visit buckets are half-open, with the last including
now. Categories use persisted gathering_type, eleven known values plus Other;
count descending then C-collated name. Category patterns need at least five
completed gatherings and ten eligible visits at those gatherings. Counts are
uncapped; lists page in twenties (pages 0–10000), with deterministic ordering.
Bookings on upcoming cards are explicitly participants, not verified visits.

Busy hours/days are omitted without an authoritative venue timezone. No revenue,
purchases, utilization estimates, customer identities, CRM, billing, offers,
campaigns, AI summaries or inferred demographics. No duplicate analytics store.

## Authorization and integrity

`get_venue_dashboard` is an authenticated-only SECURITY DEFINER aggregate with a
fixed empty search_path and explicit ownership, venue role, email, beta and
approval checks. Staff preview requires explicit admin/platform-owner status.
Definer execution avoids granting venues raw attendee access. The server loader
uses the caller client, strict input/output schemas and generic failure messages.
Ordinary venues see minimum inline event details; staff can use existing links.
No attendee IDs, names, contacts, notes or coordinates are returned.

Cache keys include account, venue, preview and pages. Zero retention after
unmount, focus/60-second refresh and failed-refresh hiding prevent stale totals
from being treated as current authorization. Management also waits for successful
authorization. Existing business-profile RLS still permits application corrections.

`20260926210000_venue_value_layer.sql` adds the RPC, venue/start index, restrictive
table/menu/activation write policies, attendance evidence stamping and attribution
guard. Non-admin INSERT cannot forge attendance; valid UPDATE timestamps/actors
are stamped server-side after existing time/location/host checks. After check-in,
non-admin edits cannot move the event's business, host or times.
`20260926213000_serialize_attendance_attribution.sql` locks the gathering before
attendance validation so a concurrent attribution/time edit cannot escape checks.
Admin/system fixture behavior remains explicit; no prior migrations are edited.

## Rollout

Both migrations were applied only to the marked disposable local database.
Review and apply in order after prerequisites, refresh PostgREST, then deploy
dependent application code. Use a forward corrective migration for recovery;
do not remove integrity protections to recover an older UI. No backfill occurred.
Audit existing attendance integrity before production beta: new guards cannot
retroactively certify old records. Test hosted Auth/registration/email, approval,
beta gates, actual uploads/maps, venue selection, host/attendee check-in, blocked
relationships and read-only Owner preview in staging. Complete a supported-platform
production build; Windows still hits the existing Lovable routesDir assertion.
No production migration, merge or deployment is part of this implementation.

See [verification](../tasks/completed/IG-008-verification.md).
