# Homepage "Just Gather" copy + structure refresh

Rework the public landing page to a short, confident, imperative "Just Gather" voice. Keep the existing violet/nebula design system, all routes, and all backend code untouched. Apply the new English copy first; TR and FA fall back to EN for any new keys until a later translation pass.

## What changes

- Hero: new headline, subhead, and CTAs.
- How-it-works: 3 steps with new labels and supporting lines.
- New "What you can gather for" category cards (coffee, trail, game, open).
- New "People are already gathering" horizontal teaser strip using sample data.
- New "We don't host it. You do." differentiation band.
- New warmer safety/reassurance section.
- Footer CTA: "Just Gather." + waitlist button.
- Public header anchors and footer links updated to point to the new sections.
- Homepage SEO title/description updated for EN only.

## What stays the same

- All routes, auth flows, dashboard, admin, matching logic, and database schema.
- `PublicHeader`, `SiteFooter`, `CosmicBackdrop`, `Reveal`, `SampleGatheringCard`, and the cosmic CSS utilities.
- Existing TR/FA `landing.v3.*` translation keys are left in place; only new EN keys are added.

## Section-by-section plan

### 1. Hero (`src/routes/index.tsx`)

Update the existing `HeroSection` in place:

- Headline: "Just Gather."
- Subhead directly underneath: "An open platform for small-group meetups — create one for anything, anywhere, and get matched with the right people."
- Primary CTA: "Start a Gathering" → links to `/auth?mode=signup` (same as the current primary CTA).
- Secondary CTA: "See How It Works" → anchors to `#how`.
- Keep the nebula hero visual and caption; remove the third "waitlist" button from the hero row.

### 2. How it works (`src/components/landing/sections.tsx`)

Keep the 3-step grid, replace icons and copy:

- Step 1 — icon `Compass`, label "Pick a plan.", body "Coffee, dinner, a hike, a game night — anything."
- Step 2 — icon `Users`, label "Get matched.", body "We fit you with people who match your vibe."
- Step 3 — icon `DoorOpen`, label "Just meet.", body "Show up at a real place, meet real people."

Section id stays `#how` so the header/footer anchors still work.

### 3. What you can gather for (new section)

Add a `CategoriesSection` after How. 4 cards in a responsive grid, using `cosmic-panel` styling:

- "Just grab coffee." — Casual meetups at partner cafés. (icon `Coffee`)
- "Just hit the trail." — Group hikes and outdoor plans. (icon `Mountain`)
- "Just play a game." — Game nights, board games, anything social. (icon `Gamepad2`)
- "Just show up." — Or create a Gathering for anything else — you decide. (icon `Plus`)

Section id `#categories`.

### 4. Upcoming gatherings / social proof (new section)

Add an `UpcomingSection` with id `#gatherings`.

- Header: "People are already gathering."
- Horizontal scrolling teaser strip of sample gatherings showing city, activity, and time.
- No new backend: reuse/adapt `SampleGatheringCard` data and visuals, updating the sample topics to include the open categories (coffee, trail, game, etc.) so the strip reinforces that gatherings are not café-only.

### 5. Differentiation (new section)

Add a short centered band, id `#why`:

- Header: "We don't host it. You do."
- Body: "Gathering is an open platform — anyone can create a gathering, for anything, anywhere. We just help you find the right people."

### 6. Safety / reassurance (new section)

Add a warmer, non-imperative section:

- Header: "No pressure. Small groups. Go at your pace."
- One to two lines reassuring first-timers/shy users that joining is low-stakes.

### 7. Footer CTA (`FinalCtaSection` in `src/components/landing/sections.tsx`)

Update the existing final CTA:

- Headline: "Just Gather."
- Button: "Join the waitlist" → links to `/waitlist`.
- Drop the secondary auth/partner links to keep the close clean.

## Navigation and footer links

- `src/components/landing/public-header.tsx`: update `DEFAULT_ANCHORS` to `[#how, #categories, #why]` with new `landing.v4.nav.*` keys.
- `src/components/site-footer.tsx`: update explore-column hrefs to the new section ids (`/#how`, `/#categories`, `/#gatherings`, `/#why`). Keep the partnership and legal columns as-is.

## Translations

Add new EN keys under a `landing.v4.*` namespace so existing `landing.v3.*` keys are untouched:

- `landing.v4.nav.how`, `landing.v4.nav.categories`, `landing.v4.nav.why`
- `landing.v4.hero.title`, `landing.v4.hero.sub`, `landing.v4.hero.cta`, `landing.v4.hero.secondary`
- `landing.v4.how.s1.title`, `landing.v4.how.s1.body`, etc.
- `landing.v4.categories.c1.title`, `landing.v4.categories.c1.body`, etc.
- `landing.v4.upcoming.title`, `landing.v4.upcoming.subtitle`
- `landing.v4.diff.title`, `landing.v4.diff.body`
- `landing.v4.safety.title`, `landing.v4.safety.body`
- `landing.v4.final.title`, `landing.v4.final.cta`
- New footer explore labels as needed.

TR and FA will show EN fallback for these keys until translated.

## SEO

- Update `PAGE_SEO["/"].en` in `src/lib/seo.ts` to a title/description matching the new voice, e.g. title "Just Gather — Ideal Gathering" and description about the open small-group meetup platform. Leave TR/FA as-is for this pass.

## Verification

- Run the dev build/typecheck.
- Open the homepage preview, confirm all 7 sections render, anchors scroll correctly, and the header/footer links resolve.
- Confirm no new backend errors or missing i18n keys in the console.
