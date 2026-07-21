# Phase 1 — Round Table Landing

## 1. Design tokens (reusable, in `src/styles.css`)

Add under `@theme inline` so utilities like `bg-parchment`, `text-ink-navy`, `bg-ember`, `border-sage` become available project-wide (later phases can reuse them without redefining).

- `--ink-navy: oklch(0.25 0.03 250)` — text / base
- `--parchment: oklch(0.95 0.02 80)` — page surface
- `--ember: oklch(0.58 0.15 45)` — primary accent
- `--sage: oklch(0.62 0.06 130)` — secondary accent
- `--font-serif-warm: "Fraunces", ui-serif, Georgia, serif` — headings
- `--font-sans-humanist: "Inter", ui-sans-serif, system-ui, sans-serif` — body

Fonts loaded via `<link>` tags in `src/routes/__root.tsx` (Fraunces + Inter from Google Fonts). No URL `@import` in styles.css.

Also add three reusable 3D utilities so Gathering Room can adopt the same primitives later:

- `@utility rt-perspective { perspective: 1400px; perspective-origin: 50% 40%; }`
- `@utility rt-preserve-3d { transform-style: preserve-3d; }`
- `@utility rt-drift { animation: rt-ambient-drift 18s ease-in-out infinite; }` (paused under `prefers-reduced-motion`)

## 2. Table component — `src/components/round-table/RoundTable.tsx`

Two nested 3D layers so ring rotation and ambient wiggle don't fight each other:

- **Layer A** (`rotateX(58deg)` + `rt-drift`) — pure decorative tilt + ambient `rotateY` oscillation (±2°).
- **Layer B** (`rotateZ(--rt-rot)`) — the ring; holds the disc, inner ring detail, center marker, and 6 seats.

Disc rendered with layered radial gradient + inset/outer `box-shadow` (no blur filters, no glow) for physical grounding.

Each seat = a full-size overlay rotated by its ring angle, with a nested button pinned to the top edge. The button counter-rotates on Z and X to face the camera; on active it lifts (`translateZ` 10→46px) and scales (1 → 1.14). Inactive seats dim to `opacity: 0.6`.

Interaction:
- Desktop: click seat → snaps rotation so that seat is at the front angle (180°), lifts.
- Mobile / any pointer: pointer-drag rotates the ring; on release, snaps to the nearest seat (shortest-path rotation math).
- Keyboard: `ArrowLeft/Right/Up/Down` cycles seats (handled in the page).
- Reduced motion: `rt-drift` is disabled globally under `prefers-reduced-motion`; snap transitions remain (they're functional, not decorative).

Seat touch targets: `min-h-[52px] min-w-[52px]` + surrounding padding on the tap wrapper → ≥44px met.

No animation library added. Pure CSS transforms + transitions + one keyframe.

## 3. Landing page — `src/routes/index.tsx` (full replacement)

Layout: full-viewport flex column, `min-h-[100dvh]`, no scroll. `SiteHeader` on top (unchanged). Main is `flex-1` with a two-column grid on `lg` (table left, panel right), single column on mobile (table above, panel below). Persistent slim footer bar always visible at bottom of the viewport, not below-the-fold.

Six seats and their panel content:

| # | Seat | Panel |
|---|---|---|
| 1 | Welcome (default active) | tagline + value prop |
| 2 | How it works | 3-step summary in prose |
| 3 | For cafés | venue-partner pitch + CTA → `/partnership` |
| 4 | For guests | guest pitch + CTA → `/auth?mode=signup` |
| 5 | Manifesto | philosophy paragraph |
| 6 | Open tables | short teaser + **"See open tables"** button that opens a shadcn `Dialog` |

**Open tables modal**: shadcn `Dialog`, lazy-loads `fetchApprovedGatherings` (`useQuery` with `enabled: tablesOpen`), renders up to 6 `GatheringCard`s, empty state, plus "View all" → `/explore`. Live list stays out of the fixed table view as required.

Panel is a soft parchment card that fades in on seat change (existing `animate-fade-in`). Mobile also gets dot-pagination below the panel.

SEO: hidden `sr-only` block mirrors all 6 seat titles + bodies as real `<h2>/<p>` for crawlers and screen readers, since the visible content is one panel at a time.

Footer bar: `Privacy` + `Terms` links (left) and a single ember pill CTA `Join Ideal Gathering` → `/auth?mode=signup` (right).

## 4. i18n (EN + TR only per scope)

New keys under `landing.table.*` in `src/i18n/translations.ts`:

- 6 × seat labels
- 6 × panel triplets (eyebrow / title / body)
- CTAs (`cafes.cta`, `guests.cta`, `tables.open`, `tables.viewAll`, `tables.empty`)
- `aria.stage`, `seo.h1`, `footer.cta`

Farsi block is left untouched this turn per scope. (If FA users hit the page before the FA follow-up ships, they'll see EN fallbacks for the new keys via the existing i18n fallback path.)

## Scope adherence

- No changes to Gathering Room, dashboards, profile, explore, event-list, or auth routes/flows.
- No Supabase schema changes.
- `SiteHeader` and its nav logic untouched — only the page body is replaced.
- Farsi strings not modified.

## Files touched

- `src/styles.css` — tokens + 3D utilities + drift keyframes
- `src/routes/__root.tsx` — Fraunces + Inter `<link>` tags
- `src/routes/index.tsx` — full replacement
- `src/components/round-table/RoundTable.tsx` — new
- `src/i18n/translations.ts` — new `landing.table.*` keys (EN + TR)

## Open assumptions (flag if wrong)

1. "No-scroll" is per-viewport at typical desktop and mobile heights; on very short viewports (<600px landscape phones) some vertical compression is acceptable rather than shrinking the table below usability.
2. Modal for Open Tables is the shadcn `Dialog` primitive (already in the project) — not a full-screen sheet.
3. Header stays mounted above the table (the request says "keep existing nav/header logic untouched"). If you want the landing to be truly chrome-less with just the table + footer, say so and I'll hide the header on `/` only.
