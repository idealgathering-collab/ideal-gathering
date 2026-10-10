# Havato Phase 6.2 — external guest invitations

Review: update [draft PR #17](https://github.com/idealgathering-collab/ideal-gathering/pull/17),
branch `codex/havato-phase6-private-gatherings`, targeting `havato`.
Started at PR head `0bf49b24ebfa1adfaad3bcc52fba876b835630aa`; no PR #16 dependency.
[User-approved contract](IG-015-havato-phase6-guest-invitations.md).

## Audit and reuse
Read PR #17 metadata, its actual checked-out code/migration/tests, IG-014 audit
and report, and the relevant product/UX/architecture/database/design docs.
IG-001 owner roles, IG-002 profile ownership, IG-003–007 moments/profile/history,
IG-008 venue activity and IG-009 portable build remain existing implementation.
Temporary guests do not enter any of those membership surfaces. The existing
member invitation panel, RSVP enum, age eligibility helper, gathering lock,
capacity trigger, semantic controls and FA-default translation provider are reused.
The guest table is necessary because a temporary guest has no auth UUID and must
not become a `gathering_attendees` member. No duplicate chat, checklist, calendar,
photo, profile, beta invitation, login, recovery or venue system was built.

## Result and file responsibilities
- `src/components/host-guest-invitations.tsx`, integrated into the existing member
  invitation panel: individual guest label, 1/3/7-day expiry, create/copy one-time
  private link, refresh response list and revoke. No email/SMS/social delivery.
- `src/routes/guest-invite.tsx` and `src/components/guest-invitation.tsx`: generic
  preview, explicit 18+ self-attestation, minimum private details, name and three
  large RSVP controls. No registration/onboarding/account upgrade. FA/RTL and EN.
- `src/lib/guest-invitations.functions.ts`: authenticated host/resource-authorized
  creation and management; 32 random bytes encoded base64url, SHA-256 digest only
  stored. Plaintext link appears once, never recoverable from database lists.
- `src/lib/guest-invitations.server.ts` and `src/server.ts`: same-origin JSON POST,
  2 KiB streamed-body bound, validated inputs, persistent throttle before lookup,
  server-only RPCs, generic invalid/expired/revoked/closed response, no token/error
  body logging, no-store/no-referrer/noindex headers. Public HTML has no event data.
- Guest links put tokens in the fragment. The client clears it from the URL and
  holds it only in component memory; refreshing requires reopening the original
  link. No token in paths/search, SSR, browser storage or query caches.
- `src/lib/gatherings.ts`, detail and My Gatherings routes: authorized aggregate
  seat counts now include active guest Going responses. Guest names stay host-only.
  The member tab bar is hidden on the temporary guest page.
- New translation, schema-derived RPC type fragments, generated route tree,
  focused DB/server/DOM tests, synthetic preview and existing review CI extended.

## Database contract
Supabase CLI generated additive migration
`20261010201750_havato_guest_invitations.sql`, after IG-014's migration. Unapplied
to all hosted databases. Creates RLS-enabled non-exposed private guest-invitation
and rate-window tables; no raw table grants even to service_role. Definers use an
empty search path with explicit role grants; public RPC wrappers are invokers.
Guest lookup/response/throttle are service-role-only. Host functions verify current
verified/beta-enabled adult eligibility and actual gathering ownership. Aggregate
seat counts filter each requested resource through existing private visibility.

Expiry is capped at creation-time gathering start; lookup also checks current
start and approved status, host eligibility, revocation and expiry. Guest Going,
member insertion, host revocation and seat edits use the same gathering row lock.
Only active unexpired Going guests reserve seats. Maybe/Declined, revocation and
expiry release them; execution-time expiry checks remain correct after a transaction or lock wait. Failed capacity updates keep the previous RSVP/name intact.
Host/member reservations are still the existing attendance records. Removing a
gathering cascades temporary invitation rows. No hosted data backfill or auth edits.

Limits: 30 invitation creations per host per hour (serialized across gatherings),
100 lifetime invitations per gathering; revocation does not reset allowances.
Guest endpoint persists 300 valid-shaped requests/minute globally and 30/token
per 10 minutes across workers. Optional verified-ingress IP bucket: 60/10 minutes.
Global-first throttling bounds random-token bucket growth; old buckets expire
after a day when new accepted requests arrive. Malformed/oversize/non-JSON requests
are rejected early; ingress must also enforce transport/body/rate protections.

## Verification
- `node tests/private-gatherings.local.mjs ../checks/node_modules/@electric-sql/pglite/dist/index.js`:
  all **73 committed migrations replay unchanged** in fresh disposable PGlite
  0.5.8 with minimal Supabase scaffolding; **179 PostgreSQL/RLS/RPC/type checks pass**.
  Includes direct role denials, no guest auth creation or attendee membership,
  generic invalid/proposed/revoked/expired/start/cancelled/host-ineligible handling,
  cross-kind last-seat rollback, idempotent Going, seat edits, cascade, quotas,
  per-token/global/IP throttle, within-transaction expiry advancement and schema-derived RPC type checks.
- Focused Vitest with scratch jsdom 26.1.0: **98 tests pass** across ten files,
  including 16 new server/client tests and eight new guest/host DOM interactions,
  all 74 preceding focused regressions retained. No mail/push/hosted users involved.
- `node node_modules/typescript/bin/tsc --noEmit`: pass.
- Changed application/new test ESLint with the existing Prettier rule disabled:
  zero errors, two existing i18n Fast Refresh warnings. Preview-only exports are
  fixtures. No repository-wide formatting or dependency/lockfile changes.
- Production Vite client/server/Nitro build: pass with dummy local backend values.
  Local dependencies reused from the earlier checkout; Linux review CI performs
  the frozen dependency install. No live server credentials were read for checks.
- Browser fixture: eight guest/host × FA/EN × 390/1280 layouts, correct directions
  and no horizontal overflow; no browser console errors. Actual guest confirm/name/
  Going and host link generation inspected. Screenshot fixtures contain synthetic
  event text and an inert token. These are not hosted end-to-end acceptance.
- `git diff --check`: pass. Generated route tree comes from the Vite routing plugin;
  RPC type fragments generated from replayed PostgreSQL catalog, checked each run.

General CI has 16 previously reproduced base failures in English rendering tests
receiving the FA-default language (life-profile, life-summary, member-profile,
venue-value). The earlier baseline evidence remains in the IG-014 report; no new
full-suite pass is claimed here.

## Final implementation verification
Final implementation `f25d769d34364571ef985a546296d5faf5d87fd5` uses execution-time
expiry checks after locks and passes the added within-transaction expiry regressions.
[Linux Phase 6 review](https://github.com/idealgathering-collab/ideal-gathering/actions/runs/38084597078)
passes frozen install, **73 migrations / 179 DB checks / 98 focused tests**, typecheck,
focused lint and production build. [Public-site review](https://github.com/idealgathering-collab/ideal-gathering/actions/runs/38084597137)
passes. [General CI](https://github.com/idealgathering-collab/ideal-gathering/actions/runs/38084597411)
retains 452 passed / 16 baseline failures / 25 skipped. Final job results and logs were
inspected. The following evidence records the preceding implementation checkpoint;
the last follow-up changes only this verification documentation.

## Earlier published verification evidence
Implementation checkpoint `128d414bdae9266cd291ad23259e8c35a727b6f1` includes the
application/test tree before the final execution-time expiry correction; 177 DB checks at that checkpoint. The final correction adds two DB regressions (179 total) and uses clock_timestamp after locks. Final-head CI is inspected separately.
The intervening line-ending preservation commit is a normal fast-forward; no published
history was rewritten and the local index was verified identical before synchronization.

- [Phase 6 Linux review](https://github.com/idealgathering-collab/ideal-gathering/actions/runs/38084272566):
  frozen install, all 73 migrations/177 DB checks, all 98 focused tests, typecheck,
  focused lint and production build pass. Logs inspected, not inferred from old runs.
- [Public-site review](https://github.com/idealgathering-collab/ideal-gathering/actions/runs/38084272474): pass.
- [General Portable Node CI](https://github.com/idealgathering-collab/ideal-gathering/actions/runs/38084272476):
  452 passed, 16 failed, 25 skipped. Inspected each failure: the same four baseline
  rendering files and 16 cases documented/reproduced on unchanged havato by IG-014.
  New guest server tests pass; DOM tests are deliberately skipped in general CI and
  enabled/passing in the dedicated review job.
- Local built-server smoke (`node work/guest-http-smoke.mjs`, from the task workspace):
  **20 HTTP/SSR boundary checks pass** with loopback dummy settings. The real built
  guest route renders a generic FA age gate; page/API no-store/no-referrer/noindex,
  method/origin/body-size and underage/malformed denials are enforced by the actual
  server entry. No hosted data, real users or credentials. This scratch smoke is
  supplementary evidence, not a hosted flow or recurring CI step.

## Limits and owner release actions
1. Review the bearer model: each link permits the holder to view/edit one guest
   response. Forwarding cannot be prevented; age/name are self-attested, no verified
   identity or account blocking for temporary guests. Hosts must invite known adults,
   avoid sending to blocked people and revoke leaked/unwanted links. No guest-to-member
   conversion. Already received private details cannot be recalled by revocation.
2. Approve designated Havato staging migration application separately. Inspect ledger,
   grants, advisors and non-exposed private schema; apply IG-014 then IG-015, reload
   PostgREST and regenerate/diff hosted types. Never apply to Ideal Gathering production.
3. Perform separate-connection PostgreSQL races (guest vs guest/member/revoke/seat edit,
   cross-gathering host quota), real host auth/moderation, guest mobile navigation,
   empty/invalid/expired tokens, refresh/reopen, capacity, cancellation and host controls.
   PGlite runs PostgreSQL but serializes one engine; it cannot prove those races.
4. Confirm the hosting ingress's same-origin request URL and body/time/rate protection.
   Only set `GUEST_INVITE_TRUSTED_IP_HEADER` if the proxy overwrites and strips that
   header from client input. Without it the global/token database limits still apply.
5. Confirm temporary guest-name/attestation retention and privacy disclosure before
   release. Records remain host-visible after expiry/revocation until event deletion;
   no cleanup of existing data or external delivery has been performed.
6. Deployment and merging require separate approval. Roll back UI first; retain the
   private rows/policies and combined capacity enforcement while guest reservations
   exist. Never reset private events to public to roll back.

Remaining Phase 6: assigned responsibilities, expenses, shared album, broader
guest/member history and host lifecycle UX; staging/provider acceptance. Phase 5
and PR #16 deferred. No merges, deployments, hosted migrations, external messages
or idealgathering.com operations.
