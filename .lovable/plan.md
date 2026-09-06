# Private Beta — controlled access architecture

Goal: turn the live product into an invite-controlled private beta without rebuilding anything. Everything existing stays: data, approved users, venue system, design language, components.

## What I found in the current app

- Sign-up is fully open: `/auth` (people) and `/venue/auth` (venues) create accounts instantly, and a database trigger immediately grants the `user` or `venue` role. Nothing stands between "sign up" and "use the product".
- After sign-in, `homePathForUser` sends people to `/dashboard`, venues to `/venue/dashboard`, admins to `/admin`. The signed-in area is guarded by one gate (`src/routes/_authenticated/route.tsx`); the venue dashboard has **no** gate at all beyond being a normal page.
- The waiting list already exists (`/waitlist` + `waitlist` table, 4 entries) but is a dead end — it is not connected to accounts or invitations.
- Venue applications already have pending/approved/rejected states on `businesses`, and only admins can change that status. Today there are 0 venues registered, 3 venue accounts, 14 people (10 onboarded), 2 admins, 0 gatherings.
- Approved gatherings and approved venues are currently readable by anyone, even signed out (used by the public gathering pages and search-engine listings).
- The homepage is the long marketing page with ~13 sections.

Good news: the pieces to build on are already there (roles, venue approval, waiting list, an admin area). The gap is that there is no "may this person use the product yet?" concept anywhere.

## The access model I propose

One rule, checked in the database, used everywhere:

```text
person can use the product   = admin
                             OR (their status is ONBOARDED/ACTIVE  AND  beta is launched)
venue can use the dashboard  = admin
                             OR (their venue is APPROVED            AND  beta is launched)
```

Statuses stored per person: WAITLISTED → INVITED → REGISTERED → ONBOARDED → ACTIVE.
Statuses stored per venue: PENDING → APPROVED → INVITED → REGISTERED → ACTIVE.
One launch switch lives in a config table only admins can change, so before launch nobody but admins gets in — even if someone has a valid invitation.

## The three front doors

1. **Join the Waiting List** — existing `/waitlist` form, kept and restyled to the new page. Result: a friendly "you're on the list" state. No account, no access.
2. **I Have an Invitation** — new `/invite` page. The code is checked by the server (codes are never listed or exposed to the browser, so they can't be guessed or scraped). A valid code unlocks the existing sign-up form, then the normal onboarding runs. After onboarding, the person waits on a "you're in, we open soon" screen until launch.
3. **Register Your Venue** — existing venue sign-up, but registering now creates a **pending application** and lands on the same waiting screen instead of the dashboard.

Admins keep full access at all times, exactly as today.

## Homepage

`src/routes/index.tsx` becomes a short private-beta page in the current cosmic/purple style: headline "No one should be alone.", the sub-line about the right people / right gathering / right moment, a "PRIVATE BETA — we're inviting our first community gradually" badge, and three buttons (Join the Waiting List · I Have an Invitation · Register Your Venue), plus footer.

Nothing is deleted: all existing marketing sections stay in `src/components/landing/sections.tsx` and are re-mounted on a `/preview` page (hidden from search engines) so they can come straight back at launch by swapping one import.

## Files and database changes

**Database (one migration, additive only):**
- `app_config` — single row with `beta_launched` and launch date; admins read/write; a small security-definer function exposes only the on/off flag to the app.
- `invitations` — code, optional email, status, who invited, who redeemed, expiry. No direct read access for anyone but admins; two security-definer functions handle "check this code" and "redeem this code for me".
- `profiles.access_status` (new enum column) with backfill: the 10 already-onboarded people become ACTIVE, the rest REGISTERED — nobody currently in the product gets locked out.
- `businesses.access_status` (new enum column) backfilled from the existing pending/approved status.
- `private.has_beta_access(uid)` / `private.venue_has_beta_access(uid)` helper functions, added to the write rules for creating gatherings, joining gatherings, sending messages, and creating a venue, so access is enforced at the data layer, not just in the interface.

**App:**
- `src/routes/index.tsx` (new short page), new `src/routes/preview.tsx` (old marketing page), new `src/routes/invite.tsx`, new `src/routes/pending.tsx` (status screen for people and venues).
- `src/routes/_authenticated/route.tsx` and `src/routes/venue.dashboard.tsx` — send anyone without beta access to `/pending`.
- `src/lib/roles.ts` / `homePathForUser` — route by status, not just role.
- `src/routes/auth.tsx` — sign-up requires a validated invitation; sign-in still works for everyone.
- `src/routes/venue.auth.tsx` — after registering, land on `/pending`.
- `src/routes/_authenticated/onboarding.tsx` — completing onboarding moves the person to ONBOARDED.
- `src/routes/_authenticated/admin.tsx` — new panel: launch switch, invitation codes (create/revoke), waiting list → invite in one click, venue approvals.
- New server-side access functions in `src/lib/access.functions.ts`; translations EN/RU/FA; `public/robots.txt` + sitemap trimmed for the beta.

## Risks worth deciding before I build

1. **Public gathering pages.** Approved gatherings are readable by signed-out visitors today, which is what makes shareable gathering links and search listings work. Closing that during beta is the strictest option but removes those public pages. My recommendation: keep them public (they contain no private data) and gate only participation. Tell me if you want them fully closed.
2. **Existing accounts.** Backfill keeps all 10 onboarded people active; the 4 not-yet-onboarded accounts will see the waiting screen until they finish onboarding. If you'd rather activate all 14, say so.
3. **Ordering.** The migration is additive and reversible; the write-rule tightening is the only part that could block someone, so I'll verify with the existing database test suite before finishing.
4. Existing legal, profile, chat, matching, attendance and venue features are untouched.
