# Havato Phase 6.3 — implementation and verification

2026-10-11. User-authorized incremental coordination on draft PR #17, base `havato`.
Baseline `ba83b382b3bbba8f1c4f59874d9ef836caca99df`. [Contract](IG-016-havato-phase6-coordination.md).

## Completed implementation
- Existing checklist labels/host add-delete and individual checkmarks retained.
  Responsibility rows reference those same item IDs: host assigns/unassigns, Going
  participants volunteer/release, assignee or host completes/reopens. Conflict on
  competing volunteers; departed/revoked/expired assignees are marked unavailable
  and can be replaced. Explicit per-item guest visibility defaults off.
- Shared plain-text notes with own-author editing/deletion and host management.
  Version checks reject stale edits/deletes. Host alone shares a note with guests.
- Host-managed expense records: payer, selected Going participants, currency,
  exact integer equal shares and net balances. Deterministic remainder by sorted
  participant key, including payer excluded from shares. One currency per event
  while expense records exist; IRR/IRT whole units, USD/EUR cents. 100 records and
  bounded amounts/text. Delete/re-record corrects a cost. No funds/card/bank data,
  payment processing, payment verification or settlement status.
- Private member coordination tab and responsibility section within existing
  checklist; mobile wrapping, labels, native keyboard selects, loading/error/retry,
  Persian-default RTL and English with Persian/Arabic numeral parsing.
- Account-free Going guests use existing same-origin bounded POST, hashed token,
  18+ gate and persistent rate limits. Host-shared items/notes only; volunteer,
  release and completion scoped to that guest. No other assignee identities,
  roster, notes editing, expense, chat, account/profile or memory permission.

## Audit and reuse evidence
Inspected existing chat/checklist, checklist policies/tables, private/guest
migrations and UI/server functions, Life Moments notes and profile/history/venue/
owner/portability functions and IG-001–009 contracts. Reused the same checklist,
chat, member attendance, gathering lock, eligibility/block helpers, guest endpoint,
UI controls/tokens and language provider. Existing personal notes are not repurposed.
No existing expense model was found. Phase 5/PR #16 is excluded.

## Database and privacy
CLI-generated additive `20261010212832_havato_gathering_coordination.sql` creates
three non-exposed private RLS tables: responsibility extension, notes, expenses.
Direct table privileges are revoked from anon/authenticated/service_role; only
explicitly authorized operations through invoker public wrappers and private
definers are available. Every operation reauthorizes current adult/beta/email,
host and Going membership, status, block and invite access after acquiring the
same gathering lock as RSVP/capacity. Cross-event IDs and invalid participants
fail closed. Guest operations re-read expiry/revocation after locking. Member
roster/expense projections keep guest names host-only and mask blocked peer names.
Historical expense shares survive leave/revocation without granting former members
access. Guest visibility is a disclosure decision; already received content cannot
be recalled. Notes/expenses cascade with event deletion, responsibilities with
checklist deletion. No hosted application/backfill or original migration rewrite.

Schema-derived new RPC argument/default/return fragments verified against the
replayed PostgreSQL catalog. Local security review checked RLS, least-privilege
grants, private definers/empty search paths, no user_metadata authorization, no
public views or browser service credentials. Current Supabase changelog/docs were
consulted; table exposure changes are handled by explicit grants/wrappers.

## Local verification
- Fresh PGlite 0.5.8 replay: all **74 committed migrations**, **306 PostgreSQL checks**
  pass. 179 prior checks retained plus 127 coordination checks: actual allow/deny,
  table grants/RLS, assignment conflict/ownership, personal ticks independence,
  note version/sharing, exact-sum rounding, payer/participant validation, guest-name
  privacy, cross-event isolation, 18+/missing DOB, RSVP leave/revoke, block, expiry,
  host ineligibility, cancellation, last-seat rollback, cascades and generated types.
- **126 focused unit/DOM tests**, 12 files: 98 prior plus 28 coordination tests.
  Synthetic DOM exercises FA/EN host assignments/sharing, note creation/versions/
  failures/retry, member volunteering/read-only ledger and guest task/revocation.
- Typecheck and production Vite client/server/Nitro build pass with dummy loopback
  settings. Local dependencies reused; Linux frozen install is checked separately.
- Changed-file ESLint: zero errors; existing gathering-room unused-disable and two
  i18n Fast Refresh warnings. No dependency/lockfile changes; diff check passes.
- Browser fixture verification and Linux exact-head results are recorded below
  after inspection. No hosted behavior is claimed by unit/DOM/PGlite evidence.

## Remaining release checks and blockers
1. Owner-approved designated Havato staging only: inspect ledger, apply Phase 6.1,
   6.2 then 6.3, inspect grants/advisors/cache and regenerate/diff hosted types.
   CLI advisor checks against hosted infrastructure were not run without approval.
2. Separate-connection PostgreSQL races: competing volunteers; assignment vs guest/
   member RSVP/revocation; note version edits; expense/currency writes; existing
   last-seat and quota races. PGlite is PostgreSQL in one engine, not proof of races.
3. Real host/member/guest authentication and mobile/keyboard acceptance with actual
   browser navigation, refresh, blocked/revoked/expired links and stale tabs. Review
   guest bearer forwarding, ingress limits/trusted-header setup and guest/shared
   content retention/disclosure. No real accounts or hosted fixtures were used.
4. Existing general CI baseline failures remain to be reported precisely for the
   new head; dedicated review success does not make the whole general suite green.
5. Shared album, broader lifecycle/history and notifications/provider/device
   acceptance are later work. Full Phase 6 is not declared complete.

Nothing merged, deployed, applied to hosted databases or changed on idealgathering.com.
PR #16/Phase 5 untouched. Rollback UI first; retain Phase 6 data and privacy/capacity
protections; never reset private gatherings to public.
