# Havato Phase 6 source audit — 2026-10-10

Inspected havato `755a9ed024f9672dffe5afaea46d109ae899ac49`. Source/migration evidence, not a live schema or browser certification. PR #16 is excluded.

| Capability | Existing evidence and behavior | Phase 6 gap / reuse decision |
| --- | --- | --- |
| Creation | `src/routes/_authenticated/create-gathering.tsx`, `src/lib/create-gathering-rules.ts`; title, description, type, future time, 2–30 seats, partner table or approved saved location; status proposed | No privacy field or private place entry. Extend same route/table; preserve moderation. |
| Private visibility | `gatherings` schema/types; approved public SELECT policy; `public-data.functions.ts` uses service role for approved metadata and sitemap | No event privacy model. Both RLS and privileged projections must be changed before private rows exist. |
| Invitations | `invitations`, `/invite`, `access.ts`, `beta-admin.ts` | These redeem beta access, not gathering membership. Keep intact; separate recipient-bound event invitation records are necessary. |
| RSVP / capacity | `gathering_attendees`, detail join/leave, `enforce_gathering_capacity` migration (20260828010926), serialized attribution (20260926213000) | Join/leave exists; no invited/maybe/declined states. Reuse attendance membership and its locking for Going. |
| Chat | `gathering-room.tsx`, `moderation.functions.ts`, `gathering_messages`; realtime, block/report, room-membership RLS | Reuse, do not create another chat. Private invitation alone must not grant room access. |
| Checklist | Same component; `gathering_checklist_items` and per-user `gathering_checklist_checks`; host edits, members tick | Reuse; personal ticks are not assigned shared responsibilities. Assignment remains a gap. |
| Responsibilities | No assignee/due/status model in checklist schema | Missing. Defer explicit assignment semantics rather than relabel ticks. |
| Expenses | No expense, split, payer, currency or settlement tables/handlers found | Missing. Defer; no fake ledger or payment UI. |
| Notes / photos | IG-003/004 `life_moments`, `gathering-moment.tsx`, private media bucket, signed URLs; optional personal note/photo after eligible completion | Reuse personal memories. No shared album/event notes. Profile-visible snapshots could leak private titles; add private-event sharing guard. |
| Reminders | Phase 3/4 push queue, `push-events.server.ts`, notification preferences, 20261003120000/150000 migrations; joined/updated/cancelled/chat and scheduled reminders | Reuse Going memberships. No invitation delivery, custom per-event schedules or verified real-device acceptance. |
| History | My Gatherings past-host attendance summary, profile eligible completed gatherings, Life Moments / own life summary (IG-005–007) | Exists. Preserve; broader guest history and repeat-event creation are gaps. |
| Safety / 18+ | Beta/email gates, user blocks, reports; DOB age helpers, 18+ legal copy and existing `profiles_min_age` trigger (20260821111626) | Existing trigger rejects a supplied underage DOB but allows missing DOB. Private flow fails closed on missing DOB and checks member eligibility/block-aware access. No auth redesign. |
| Branding / language | Existing Havato orange/cream semantic tokens, FA-default LanguageProvider, RTL, EN/RU dictionaries | Reuse controls/tokens; add FA/EN copy with EN fallback for RU. |

IG-001 owner role, IG-002 profile ownership, IG-003–007 memories/profile summaries, IG-008 venue analytics and IG-009 portability already exist. None is rebuilt. Private events have no business/table linkage in the first increment, avoiding accidental venue attribution or implying a reservation.

Privileged-reader audit: public metadata/sitemap and compatibility handler bypass RLS. MCP gathering tools use caller clients/RLS; public discovery still needs explicit visibility filtering so a host's own private events do not enter Explore. Room message loader uses caller RLS. Admin/owner readers remain staff tools. Existing Life Moment insert/context functions copy titles only after completed participation; private-event profile sharing needs additional restriction.

Remaining acceptance: hosted Havato ledger/grants/cache and real auth/users, FA/EN mobile/keyboard UI, live invitation discovery/RSVP/chat/revocation, moderation transitions, scheduled push/device delivery. No live writes performed for this audit.
