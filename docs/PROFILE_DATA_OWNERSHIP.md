# Profile and preference ownership

IG-002, approved 2026-09-19. Implemented contract, audited from IG-001 completion
`c78968c`. No Life Profile design or matching-model change.

## Field map

| Source | Fields | Writers/readers |
| --- | --- | --- |
| `profiles` identity | `display_name`, `bio`, `date_of_birth`, `nationality`, `gender` | Profile editor; identity/card readers. Existing admin patch permits only display name, bio, city and country. Public projection excludes exact DOB/nationality/gender. |
| `profiles` location | `city`, `country`, `neighborhood` | Profile editor; card, Explore, location picker, admin/owner identity views. |
| `profiles` media | `avatar_url`, `cover_url` | Existing own avatar upload writes avatar_url after storage upload; cards read both. No active cover editor found; no new writer. |
| `profiles` signals | `interests`, `social_links` | Profile editor. Matching/recommendations use interests. Raw social links remain outside the public loader. |
| `profiles` personality | `trait_spark`, `trait_curiosity`, `trait_warmth`, `trait_depth`, `traits_updated_at`, `persona_color` | Onboarding quiz updates four traits and timestamp; cards/dashboard/matching read them. Persona color remains profile data. Existing unused saveMyTraits also writes only profile traits. |
| `profiles` lifecycle | `id`, `created_at`, `updated_at`, `onboarded_at`, `access_status` | Auth/profile triggers, access administration and onboarding completion. New self-save RPC allows onboarded_at/traits_updated_at, never id/access_status; updated_at is server-stamped. |
| `user_gathering_preferences` | `intentions`, `gathering_types` | Profile and onboarding edit the same canonical row. Card/public loader read intentions; Explore/recommendations and creation defaults read preferences. |
| `user_gathering_preferences` | `preferred_group_size`, `social_energy`, `conversation_style`, `spontaneity`, `stranger_comfort` | Onboarding editor. Self card reads size/energy/conversation/stranger comfort. Recommendation uses its established subset; matching reads social_energy. Profile's ordinary save never submits these fields. |
| `user_gathering_preferences` metadata | `user_id`, `updated_at` | RPC derives user_id from auth.uid() and stamps writes; callers cannot patch either. |
| `profiles` archival duplicates | `intentions`, `energy_level`, `group_size`, `talk_style`, `new_people_pref` | Physically retained unchanged for recovery. Active readers/editors no longer use them as preferences. Generated types retain the columns. |

Other queries inspected: public-data/gathering-room identity; attendance,
feedback and moderation identity; admin/owner identity and counts; access
onboarding markers; dashboard traits; feedback-prompt interests; location picker
city. These stay on profiles. User-match, matching, persona, profile-card types
and UI consume derived data, not a separate persistence source. No role, venue,
block, capacity or scoring changes.

## Load and save contract

IG-005 keeps this storage/write contract. `/profile` now presents the own Life
Profile; the existing complete editor opens in a dialog. Closing retains its
unsaved draft on the page, while saved identity displays separately. Account-keyed
remounting discards the prior account's local form state. Avatar edits still save
immediately. Gathering preferences remain editable through the existing onboarding
flow, accessible from About. Other-user loaders and matching are unchanged.

Profile waits for its own full identity row, canonical preferences and card;
private identity fields are never initialized from a public card. Initialization
failure disables editing and offers retry. Card refreshes never refill edits.
Onboarding waits for preferences before mounting its stateful question flow.
Unmount/account-change cleanup ignores late load responses.

Both editors call save_my_profile_data through profile-data.ts. Invoker rights,
auth.uid(), field allowlists and existing profile RLS protect the transaction.
Either table's failure rolls back identity, preferences, traits and completion;
onboarding does not navigate after failure. Changed-field patches preserve
unrelated newer edits from the other flow. Explicit empty arrays/null choices
are saved, including clearing all answers. Intentional concurrent changes to
the same field remain last-writer-wins; this is not a revision system.

Missing preference rows mean unanswered; query failures do not mean empty.
Authenticated public profiles return canonical intentions and coarse birth year,
not raw preference rows/private identity. Legacy-named public style slots now
return null; the existing public card already discarded these slots. Self cards
render current and legacy option labels using existing translations.

## Migration and compatibility

20260919150000_profile_preference_ownership.sql supplies the previously missing
table/RLS evidence. It creates preferences only if absent and grants authenticated
self-only SELECT/INSERT/UPDATE, with a restrictive privacy policy. No anonymous
access or authenticated deletion. Existing profile RLS/triggers and server-only
privileged readers remain intact.

Backfill inserts only where no canonical row exists. An existing canonical row
wins as a whole, including empty/null answers and its original updated_at.
Legacy intentions/textual styles copy verbatim. Size intimate/small/large maps
to 3/4/5, matching existing card buckets; string 3/4/5 maps numerically. Unknown
sizes stay unanswered canonically and remain intact on profiles. Listener/talker
is not guessed to mean light/deep conversation. Unsupported historical options
remain stored until explicitly edited. No columns/user rows are deleted and no
ongoing fallback can resurrect an intentionally cleared answer.

## Rollout and recovery

Only the marked disposable local database was migrated. Before an authorized
deployment, inspect the target ledger, table shape, constraints, triggers, RLS,
grants and legacy values. Reconcile divergent existing schema explicitly; do not
drop it. Back up both tables, count missing rows, apply migration before shipping
RPC-dependent clients, and verify API schema-cache refresh. Check untouched
existing preferences, backfill counts, public projection and save round trips in
staging. Production deployment is a separate authorized operation.

Use a forward corrective migration for recovery. Do not copy archival values
over canonical rows or drop canonical data. Assess older clients' stale dual-save
behavior before application rollback. Exact local evidence and environment
limits are in the completed IG-002 verification report.
