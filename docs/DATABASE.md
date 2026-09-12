# Database

## CURRENT — evidence and limits
Inspected repository commit: `a37898970d63c9358c0592a7c81f07c7cbf2b828`.
Sources: [generated public schema types](../src/integrations/supabase/types.ts), [migration directory](../supabase/migrations), application queries and [test guidance](../tests/README.md).
All 59 committed SQL migrations were fetched and inspected. No live Supabase schema, migration ledger, data, RLS execution or storage settings were queried. CURRENT below means repository evidence; types and migrations disagree in several places.

Supabase Auth owns `auth.users`; profile/role and many membership/ownership IDs reference it. PostgreSQL `public` contains product data; `private` contains authorization helpers; storage policies target `storage.objects`.

## CURRENT tables and relationships
The 19 tables below appear in generated types. The inventory at the end preserves every Row field/type, including nullability; TypeScript strings do not distinguish SQL UUID/date/timestamp/text.

| Table | Purpose and key relationships |
| --- | --- |
| profiles | User profile; id is PK/FK to auth.users with cascade; traits, identity, location and access state |
| user_gathering_preferences | Preferences used by onboarding/matching; types report user_id → profiles.id one-to-one; creation SQL not found |
| user_roles | UUID PK; user_id → auth.users; unique user/role, partial unique user-or-venue primary role |
| businesses | Venue; owner_id → auth.users; unique owner; approval/access state and location/contact fields |
| venue_tables | business_id → businesses; capacity; case-insensitive unique label per business |
| menu_items | business_id → businesses; price/currency and ordering |
| gatherings | host_id → auth.users; nullable business_id/table_id → businesses/venue_tables; time, seats, origin and status |
| gathering_attendees | Composite PK gathering_id/user_id; references gatherings/auth.users; attendance timestamps and coordinates |
| gathering_messages | gathering_id → gatherings, sender_id → auth.users; room messages |
| gathering_checklist_items | gathering_id → gatherings; host-maintained ordered checklist |
| gathering_checklist_checks | Composite PK item_id/user_id; checklist item/auth user references |
| gathering_ratings | gathering/rater/ratee references; nullable ratee for gathering rating; score 1–5, private comment/reasons |
| saved_locations | user_id ownership; approved/rejected location details; no saved_location_id column exists on gatherings in types |
| user_blocks | blocker/blocked auth user pair; self-service blocking |
| reports | reporter/target/gathering references; admin resolution fields |
| notifications | Recipient-specific title/body/read/type/related ID |
| waitlist | Unique email, name, city/interests |
| invitations | Unique code, redemption/expiry/status, creator and redeemer references |
| app_config | Boolean singleton PK constrained true; beta launch state |

## CURRENT constraints and transitions
- Gathering states: proposed, approved, cancelled, rejected. Origins: user_proposed or venue_activated; venue-activated rows require linked business/table.
- Original SQL seat/capacity checks allow positive values through 50; creation UI validator permits 2–30. Typical 2–5 is product intent, not enforced SQL.
- Capacity insert trigger locks the gathering row, checks closed/missing/full states and preserves duplicate-join constraint behavior.
- Venue double-booking guard checks overlapping venue-activated gatherings; a separate table guard blocks deletion or capacity reduction under active gatherings. Do not claim these have been concurrency-tested here.
- Profile DOB has a lower sanity bound and an 18+ trigger when DOB is supplied; DOB may be null. Nationality length and gender enumerated-text constraints exist; trait columns have bounded checks.
- Attendance updates protect identity fields and constrain time/location; self check-in/out uses a 100m rule when gathering coordinates exist.
- Ratings use a unique expression index for gathering/rater/ratee, score 1–5 and checked-in-rater policy. Structured reasons were added later.
- Beta migration adds launch config, user/venue access enums, invitation validation/redemption and guards on access status. Product writes require appropriate beta access in addition to identity/role conditions.

## CURRENT security, views and storage
Profiles' broad read policies were removed; own/admin access and server projections coexist. Attendee reads are limited to the attendee, host, venue owner or admin according to policies. Messages/checklists have room-membership rules. Ratings are readable by rater/admin; reports by reporter/admin; blocks by blocker. Business column grants restrict contact/ownership exposure, with approved-business reads and privileged server projections.
Actual visibility depends on both grants and all applicable policies/triggers; these summaries are not a security certification.

Migration `20260721130554_84b00a3e-d74f-44d3-abed-95a96d276c89.sql` creates `approved_businesses` and `public_profiles` security-barrier views; the immediately following `20260721130711_aad1a23c-c3c0-4e21-9a0a-7484ec051130.sql` drops both. Earlier `businesses_public`/`profiles_public` views were also dropped. Generated types list no views, consistent with this history. Current application server functions provide projections.

Private helpers include `has_role`, `is_email_verified`, `is_user`, `is_venue`, `is_blocked_pair`, `has_beta_access`, `venue_has_beta_access` and `meters_between`. Public RPCs in types are `check_invitation`, `redeem_invitation`, `is_beta_launched`; latest SQL additionally defines `is_owner` and `claim_initial_owner`. Public trigger functions enforce signup, status, capacity, attendance and moderation rules.
Migrations publish gathering messages and notifications to Supabase realtime.

Avatar policies evolved from public reads to authenticated reads, with user-folder ownership for writes. Profile code uses the `avatars` bucket and signed URLs. Bucket creation/public flags/limits and live grants are not established by this inspection. Preserve private storage handling; never expose credentials.
Account deletion has an edge-function implementation at `supabase/functions/delete-own-account/index.ts`; production deployment and complete retention/cascade behavior need separate verification.

## CURRENT inconsistencies requiring follow-up
1. **Owner bootstrap helper:** `20260910233100_add_owner_bootstrap.sql` calls `public.has_role`, but `20260709131615_1314ef19-1325-472f-bc9a-86f1db3c6b31.sql` drops it and moves role checks to `private.has_role`. No later recreation was found. This is a concrete migration-source mismatch; runtime impact is untested.
2. **Generated types lag:** app_role omits owner and Functions omits owner RPCs.
3. **Preferences migration missing:** `user_gathering_preferences` exists in types and reads/upserts, but no table-creation migration was found. Its RLS is asserted in an application comment but cannot be verified from committed SQL. Do not invent its deployed policies.
4. **Replay hazards:** a historical July role/venue migration truncates beta tables; another August migration runs a smoke test with fixed user IDs. A fresh replay has environment-specific assumptions. Do not replay history against populated production.
5. **Data ownership:** legacy style/intent fields on profiles overlap preferences; the profile-card loader reads style from preferences. Resolve save/read ownership in a spec.
6. **Privacy boundaries:** public gathering metadata handler is unauthenticated while some product routes are beta-gated; profile/matching server projections use privileged reads. Define and test intended visibility rather than assuming route gates cover them.

## PROPOSED — not applied or approved
- First bounded IG-XXX candidate: verify/fix owner bootstrap helper usage, reconcile owner-related generated types and test authorized/unauthorized behavior on a designated disposable target.
- Separate follow-up: compare live schema with migration history, recover missing preference-table/grant evidence and define reproducible migration strategy without rewriting applied history.
- Any seat-limit, profile data ownership, retention or privacy changes require their own approved requirements.
No new tables, migrations or database changes are part of this workflow setup.

## IG-001 implementation — pending rollout
Branch `codex/ig-001-owner-control-center` adds an unapplied ordered migration for an Owner-controlled Admin permission boundary. Existing Admins are backfilled with `platform_operations`; revoking it changes the shared `private.has_role(..., 'admin')` decision used by existing RLS policies and triggers. Owner always satisfies this platform permission without needing an Admin role. The migration also adds Owner-only management/list RPCs and access audit rows, revokes direct role/grant writes and disables the broken self-service Owner bootstrap.

The migration passed 41 authorization checks in disposable local PostgreSQL, including Owner, active/restricted Admin, member, venue and escalation attempts. This is not proof of the hosted migration ledger or production behavior. Before rollout, confirm an Owner exists (or provision one using a trusted database operator), back up affected role data, apply through the normal Supabase/Lovable process and run the opt-in hosted DB suite against a designated test project.

## Migration operating procedure
Inspect current SQL and live migration state when access is available; document differences. Add a new ordered migration with explicit grants/RLS/constraints and safe backfill/recovery. Test empty and representative existing data on a disposable database; separate enum commits before use. Regenerate types from verified schema, run relevant DB tests, and record application/rollout status. Never copy secret values into docs or use real user data as fixtures.

## CURRENT generated Row inventory
This transcription is descriptive evidence, not DDL or proof that every object exists in production.

### app_config

```ts
beta_launched: boolean
id: boolean
launched_at: string | null
updated_at: string
```

### businesses

```ts
access_status: Database["public"]["Enums"]["venue_access_status"]
address: string
city: string
cover_url: string
created_at: string
description: string
description_extra: string
id: string
lat: number
lng: number
menu_link: string | null
mobile: string
name: string
owner_id: string
phone: string
status: Database["public"]["Enums"]["business_status"]
street_number: string
```

### gathering_attendees

```ts
checked_in_at: string | null
checked_in_by: string | null
checked_out_at: string | null
checked_out_by: string | null
checkin_lat: number | null
checkin_lng: number | null
checkout_lat: number | null
checkout_lng: number | null
gathering_id: string
joined_at: string
user_id: string
```

### gathering_checklist_checks

```ts
checked_at: string
item_id: string
user_id: string
```

### gathering_checklist_items

```ts
created_at: string
gathering_id: string
id: string
label: string
sort_order: number
```

### gathering_messages

```ts
body: string
created_at: string
gathering_id: string
id: string
sender_id: string
```

### gathering_ratings

```ts
comment: string | null
created_at: string
gathering_id: string
id: string
ratee_id: string | null
rater_id: string
reasons: string[]
score: number
```

### gatherings

```ts
address: string | null
business_id: string | null
city: string | null
created_at: string
description: string | null
ends_at: string | null
gathering_type: string | null
host_id: string
id: string
lat: number | null
lng: number | null
neighborhood: string
origin: string
seats: number
starts_at: string
status: Database["public"]["Enums"]["gathering_status"]
subject: string
table_id: string | null
venue_name: string
```

### invitations

```ts
code: string
created_at: string
created_by: string | null
email: string | null
expires_at: string | null
id: string
note: string | null
redeemed_at: string | null
redeemed_by: string | null
status: string
updated_at: string
```

### menu_items

```ts
business_id: string
category: string | null
created_at: string
currency: string
description: string | null
id: string
name: string
price: number
sort_order: number
updated_at: string
```

### notifications

```ts
body: string | null
created_at: string
id: string
read: boolean
recipient_id: string
related_id: string | null
title: string
type: string
```

### profiles

```ts
access_status: Database["public"]["Enums"]["user_access_status"]
avatar_url: string | null
bio: string | null
city: string | null
country: string | null
cover_url: string | null
created_at: string
date_of_birth: string | null
display_name: string | null
energy_level: string | null
gender: string | null
group_size: string | null
id: string
intentions: string[]
interests: Json
nationality: string | null
neighborhood: string | null
new_people_pref: string | null
onboarded_at: string | null
persona_color: string | null
social_links: Json
talk_style: string | null
trait_curiosity: number | null
trait_depth: number | null
trait_spark: number | null
trait_warmth: number | null
traits_updated_at: string | null
updated_at: string
```

### reports

```ts
admin_note: string | null
created_at: string
details: string | null
gathering_id: string | null
id: string
reason: string
reporter_id: string
resolved_at: string | null
resolved_by: string | null
status: Database["public"]["Enums"]["report_status"]
target_id: string
target_type: Database["public"]["Enums"]["report_target"]
target_user_id: string | null
```

### saved_locations

```ts
address: string
city: string | null
created_at: string
description: string
id: string
label: string
lat: number | null
lng: number | null
neighborhood: string | null
reject_reason: string | null
status: string
street_number: string
updated_at: string
user_id: string
```

### user_blocks

```ts
blocked_id: string
blocker_id: string
created_at: string
```

### user_gathering_preferences

```ts
conversation_style: string | null
gathering_types: Json
intentions: Json
preferred_group_size: number | null
social_energy: string | null
spontaneity: string | null
stranger_comfort: string | null
updated_at: string
user_id: string
```

### user_roles

```ts
id: string
role: Database["public"]["Enums"]["app_role"]
user_id: string
```

### venue_tables

```ts
business_id: string
capacity: number
created_at: string
id: string
label: string
```

### waitlist

```ts
city: string | null
created_at: string
email: string
id: string
interests: string | null
name: string
```
