
# Landing Page Redesign — Ideal Gathering

Goal: make `src/routes/index.tsx` feel like a living product, not a template. Frontend-only — no backend/schema changes. All copy added to `src/i18n/translations.ts` (EN + TR).

## 1. Hero — split layout with "poster" mockup

Two-column hero on the deep-purple gradient:

- **Left**: badge, headline "No one will be alone anymore. Just Gather.", supporting line, two CTAs (Join waitlist / Register your cafe), and the 3 existing stat tiles.
- **Right**: a "poster" visual — a tilted, layered mockup of the app on a warm cafe backdrop.
  - Generate one hero background image (`src/assets/hero-cafe.jpg`) — warm, cinematic, softly blurred cafe scene, no legible faces.
  - Overlay a pure-CSS phone/card mockup built in JSX (no image of a fake UI) containing:
    - A gathering card: topic "Philosophy & Flat Whites", venue "Petra Roasting Co.", time chip.
    - A 5-seat table diagram: 3 filled avatar seats (initials, gradient), 2 pulsing empty seats.
    - A small "94% vibe match" compatibility badge.
  - Floating secondary chip card behind it: "New table opened in Kadıköy · 2 seats left".
  - Uses existing tokens (`bg-card`, `shadow-plum`, `sunshine`, `tangerine`); pulses via Tailwind `animate-pulse` — no new deps.

## 2. "How it works" — 3 steps

New section directly under the hero, on `bg-background`:

1. **Tell us your vibe** — icon `Sparkles`, quick personality + interests snapshot.
2. **Grab a seat** — icon `Armchair` (lucide), pick a curated topic table at a partner cafe.
3. **Just show up** — icon `Coffee`, meet your small group, skip the small talk.

Horizontal 3-column grid (stacks on mobile), numbered "01 / 02 / 03" in display serif, connecting dashed line on `sm+`.

## 3. Upcoming Gatherings — live-feed cards

Rework the existing section so it reads as a dashboard feed.

- Keep the live query (`fetchApprovedGatherings`) — real data still renders through the existing `GatheringCard`.
- **When the query returns 0 rows** (current state), instead of the "no gatherings yet" empty card, render a `SampleGatheringCard` grid of 6 curated mock tables:
  - "Building Startups over Espresso" — MOC Kadıköy — 5 seats, 3 filled, 2 open
  - "Philosophy & Flat Whites" — Petra Roasting Co. — 4 seats, 3 filled, 1 open
  - "Books that Broke Us" — Norm Coffee — 5 seats, 3 filled, 2 open
  - "Design Crit Night" — Kronotrop — 4 seats, 3 filled, 1 open
  - "Analog Photography Club" — Federal Coffee — 5 seats, 3 filled, 2 open
  - "Late-Night Ethics" — Coffee Department — 4 seats, 3 filled, 1 open
- Each sample card shows: topic, venue tag with pin icon, day/time chip, 4–5 seat diagram (filled seats = gradient avatars with initials; open seats = dashed ring with soft pulse), and a "Reserve seat" button that smooth-scrolls to a new `#join` anchor on the CTA band (see §6). A subtle "Preview" ribbon marks them as sample tables so they're not mistaken for live data.
- Section header gets a small "Live feed" pill with a pulsing dot.

## 4. B2B partner section — marketplace preview

Replace the current two-card "Two ways in" block with a richer "For cafes & restaurants" section:

- Left column: headline, paragraph, checklist of partner benefits, primary CTA to `/register-business`.
- Right column: a mock **Venue Dashboard** card built in JSX using existing tokens:
  - Header row: venue name "Petra Roasting Co." + "Partner · Tier II" badge.
  - Three stat tiles: **Table Utilization** (78%, tiny inline bar), **Promotional Bids Won** (12 this week), **Guests Routed** (43 new).
  - A mini "Quiet-hour bidding" strip showing 3 time slots with bid amounts and a "Boost" button.
- Below the two columns: 3 small feature chips — Table Utilization Analytics · Promotional Placement Bidding · Targeted Guest Traffic.

Purely presentational — no new routes or data.

## 5. Testimonial / trust strip (small addition)

Between B2B and footer, a slim band with 2 short quotes (one guest, one venue owner) and a row of 5 placeholder "partner venue" wordmarks rendered as styled text badges. Keeps the page feeling populated without stock logos.

## 6. Mega-footer

Delete the current single-line footer. Build a 4-column footer on `bg-plum text-primary-foreground`:

- **Col 1 — Brand**: logo + "Ideal Gathering" wordmark, mission line "Set the table. Set the subject.", tiny language reminder.
- **Col 2 — Explore**: How it Works (`#how`), Upcoming Tables (`#tables`), Partner Cafes (`#partners`), Community Vibe (`#vibe`).
- **Col 3 — For Businesses**: Venue Subscriptions, Bidding Framework, Success Stories, Cafe Support (all `#` anchors for now, plus `/register-business` on the first).
- **Col 4 — Legal & Social**: Terms of Service, Privacy Policy, Contact Us, and Instagram + LinkedIn icon buttons (lucide `Instagram`, `Linkedin`).
- Bottom bar: © year · "Made with care for people who'd rather talk than scroll."

Section anchors (`#how`, `#tables`, `#partners`, `#join`) added to the corresponding sections so footer + "Reserve seat" scrolling work.

## Technical notes

- **Files touched**
  - `src/routes/index.tsx` — full rewrite of the page composition.
  - `src/components/sample-gathering-card.tsx` — new, presentational.
  - `src/components/hero-poster.tsx` — new, the right-side mockup.
  - `src/components/venue-dashboard-preview.tsx` — new, B2B mock.
  - `src/components/site-footer.tsx` — new mega-footer, reusable.
  - `src/i18n/translations.ts` — add keys for new sections (EN + TR).
  - `src/assets/hero-cafe.jpg` — one generated warm cafe backdrop.
- **No** changes to routes, Supabase, RLS, migrations, auth, or `GatheringCard` for real data.
- Only existing design tokens (`primary`, `plum`, `sunshine`, `tangerine`, `shadow-plum`, `bg-gradient-hero`, `font-display`). No hardcoded hex.
- Icons from `lucide-react` only (`Sparkles`, `Coffee`, `Armchair`, `MapPin`, `Users`, `TrendingUp`, `Gavel`, `Instagram`, `Linkedin`, `ArrowRight`).
- Smooth scroll via `scroll-behavior: smooth` (already default) + `<a href="#join">` on Reserve buttons.
- Fully responsive: hero stacks under `lg`, 3-step stacks under `sm`, footer collapses to 2 cols on `sm`, 1 on mobile.

## Out of scope

- No personality quiz flow, no real reservation logic, no bidding backend, no new tables/RLS.
- No changes to `/waitlist`, `/auth`, `/register-business`, or dashboard pages.
