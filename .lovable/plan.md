# Consistent header across public pages

## Goal
The landing page and the other public marketing pages (Our Story, Partnership, Privacy, Terms, Waitlist) should share one header look — same logo treatment, same pill nav links, same Login / Join Now buttons — while the logged-in dashboard header keeps working exactly as it does today.

## What I found
- Only `src/routes/index.tsx` uses `PublicHeader`. Every other page — public and authenticated — uses `SiteHeader`.
- `SiteHeader` does double duty: logged-out marketing links (Our Story, Partnership, Join) and the full logged-in nav (Dashboard, Explore, My Gatherings, Chat, Profile, Admin, notifications bell, sign out).
- The global theme is already dark/cosmic (`--background` is a deep purple, `glass-card` is a translucent violet panel). So the two headers are not light vs dark — they differ in logo treatment (spinning 9x9 logo + "Ideal Gathering" in display font vs. static logo + serif-warm wordmark), nav styling (shadcn ghost buttons vs. pill anchors), and header behavior (sticky glass bar vs. fixed transparent bar that fades in on scroll).

## Approach
Make `PublicHeader` the single public header, driven by a small prop, and use it on all logged-out marketing pages. Leave `SiteHeader` in place for the authenticated app.

1. **Generalize `PublicHeader`**
   - Add an optional `anchors` prop (defaults to the current `#how / #venues / #vision` list). Non-landing pages pass `[]` so they get no scroll anchors.
   - Always render the real page links (Our Story, Partnership) plus Login and Join Now, in the existing pill styling, in both the desktop row and the mobile dropdown.
   - Add an optional `solid` prop: when true the header renders in its scrolled state from the start (bordered, blurred bar) instead of transparent. Marketing pages that begin with text right under the header pass `solid`; the landing page keeps the scroll-driven fade.
   - Keep it `fixed`; the pages that adopt it get top padding on their `<main>` so content is not hidden behind it.

2. **Adopt it on the marketing pages**
   - Swap `SiteHeader` → `PublicHeader` in `our-story.tsx`, `partnership.tsx`, `privacy.tsx`, `terms.tsx`, `waitlist.tsx`.
   - Leave `reset-password.tsx`, `explore.tsx`, and `gatherings.$id.tsx` on `SiteHeader` — those are entered by signed-in users and need the app nav. (Say the word if you want Explore/gathering detail included too.)

3. **Handle the signed-in visitor on a public page**
   - `PublicHeader` will read the existing `useSession()` hook: if a session exists, show a single "Dashboard" pill instead of Login / Join Now. No other auth logic moves into it.

4. **Back button**
   - `SiteHeader`'s back arrow disappears from these pages with the swap. I'll add the same back-arrow button into `PublicHeader`, shown only when not on `/`, styled as a pill to match.

## Theme question
No light variant is needed. The whole site already runs on the dark cosmic palette, so `PublicHeader`'s styling reads correctly on Our Story, Partnership, Privacy and Terms as-is. Only the hard-coded `rgba(12,7,26,…)` values inside `PublicHeader` will be swapped for the existing theme tokens (`glass-card` / dark tokens) so it stays in sync if the palette changes.

## Risk to logged-in behavior
`SiteHeader` is not modified at all — no changes to the role lookup, notifications bell, sign-out, or dashboard nav. All authenticated routes keep importing it. The only behavioral change on the public pages is the header component they render.

## Files touched
- `src/components/landing/public-header.tsx` (props, session-aware CTA, back button, token cleanup)
- `src/routes/our-story.tsx`, `partnership.tsx`, `privacy.tsx`, `terms.tsx`, `waitlist.tsx` (swap header + top padding)
- `src/i18n/translations.ts` only if a new label is needed (e.g. "Dashboard" already exists as `nav.dashboard`)
