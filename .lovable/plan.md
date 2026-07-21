# Phase 1 — Round Table Landing Page

Full replacement of `/` with a single-viewport, no-scroll CSS-3D round table. Six seats map to six pitches; a persistent thin footer bar carries legal links and the primary signup CTA.

## Assumptions (flagging for correction)
- **i18n**: New copy goes into `translations.en` and `translations.tr` only. Farsi strings are explicitly out of scope per your note — the FA keys will fall back to EN until a later pass.
- **"Open tables" seat**: opens a `Dialog` (shadcn) listing live approved gatherings via the existing `fetchApprovedGatherings` query, with a link to `/explore` for the full list. No new route.
- **Header**: kept as-is (site-header stays mounted above the table view). "No-scroll" means the table area itself fits in one viewport under the header + above the footer bar; the page as a whole has `overflow-hidden` on the main region.
- **Fonts**: load Fraunces + Inter via `<link>` in `__root.tsx` head (per Tailwind v4 rules). No new npm dep.
- **No new animation lib**: pure CSS transforms + transitions + a tiny `requestAnimationFrame` loop (or CSS `@keyframes`) for ambient drift.

## Files touched

**New**
- `src/components/round-table/RoundTable.tsx` — the 3D scene: perspective stage, table disc, seat ring, ambient drift, selection state, mobile drag-to-rotate, reduced-motion handling.
- `src/components/round-table/Seat.tsx` — single seat button (44px+ hit target), depth-based scale/opacity, active lift.
- `src/components/round-table/SeatPanel.tsx` — the content panel that renders the active seat's copy (Welcome / How / Cafés / Guests / Manifesto / Open tables trigger).
- `src/components/round-table/OpenTablesDialog.tsx` — modal listing live gatherings (reuses `GatheringCard`).
- `src/components/round-table/seats.ts` — seat config array (id, i18n key, icon, panel renderer key).
- `src/components/round-table/useTableInteraction.ts` — hook: pointer drag → rotation, keyboard arrow support, reduced-motion, active-seat derivation.

**Modified**
- `src/routes/index.tsx` — replace entire body with `<SiteHeader />` + `<RoundTableStage />` + `<LandingFooterBar />`. Delete imports of `HeroPoster`, `ManifestoSection`, `NeighborhoodsSection`, `GatheringCard` list, sample cards, etc.
- `src/components/site-footer.tsx` — leave alone; add a **new** slim `LandingFooterBar` component inline in the landing route (or as `src/components/landing-footer-bar.tsx`) — the full `SiteFooter` is not used on the landing page.
- `src/styles.css` — add new design tokens (see below) alongside existing ones (existing plum/sunshine/tangerine tokens are **kept** so other routes don't break). Add `@keyframes table-drift` and a `.perspective-stage` / `.preserve-3d` utility set.
- `src/routes/__root.tsx` — add Fraunces + Inter `<link>` tags to head (preconnect + stylesheet).
- `src/i18n/translations.ts` — add `landing.table.*` keys (seat labels, panel copy, footer CTA) in EN + TR.

**Untouched (explicit)**
- Gathering room, dashboards, profile, explore, auth, all Supabase code, existing header/nav logic, Farsi translations.

## Design tokens (added to `src/styles.css`)

```css
:root {
  --ink-navy: oklch(0.25 0.03 250);       /* #1B2430 */
  --parchment: oklch(0.95 0.02 80);       /* #F6EFE4 */
  --ember: oklch(0.58 0.15 45);           /* #C4622D */
  --sage: oklch(0.62 0.06 130);           /* #7C8F6E */
  --font-serif-warm: "Fraunces", ui-serif, Georgia, serif;
  --font-sans-humanist: "Inter", ui-sans-serif, system-ui, sans-serif;
}
@theme inline {
  --color-ink-navy: var(--ink-navy);
  --color-parchment: var(--parchment);
  --color-ember: var(--ember);
  --color-sage: var(--sage);
}
```

Existing plum/sunshine/tangerine tokens stay in place so unrelated routes render unchanged. Later phases can migrate to the new palette route by route.

## 3D technique

```text
.perspective-stage { perspective: 1400px; perspective-origin: 50% 30%; }
.table-group       { transform-style: preserve-3d; transform: rotateX(58deg) rotateZ(var(--rot)); }
.table-disc        { transform: translateZ(0); box-shadow: layered rims for grounding; }
.seat              { transform: rotateZ(var(--seat-angle)) translateY(var(--radius)) rotateZ(calc(-1 * var(--seat-angle))) translateZ(var(--lift)); }
```

- Ambient drift: CSS `@keyframes` on `.table-group` nudges `rotateZ` ±3° over ~18s; paused under `prefers-reduced-motion`.
- Seat selection lifts `--lift` from 0 to 40px, scale 1 → 1.12, unselected seats fade to 55% opacity.
- Depth ordering handled by `translateZ` on each seat inside the tilted group — no `z-index` hacks.

## Interaction

- **Desktop**: click seat → select; arrow keys rotate through seats; Escape closes Open-Tables dialog.
- **Mobile**: pointer drag on the stage rotates the ring; the seat whose projected screen-Y is highest (front-most) becomes active. Dot pagination row below the stage as fallback + a11y control.
- **Reduced motion**: drift disabled; selection uses a plain fade+scale (no lift travel).

## Layout

```text
┌─ SiteHeader (unchanged) ────────────────────┐
│                                             │
│   ┌──────────────┐   ┌────────────────────┐ │
│   │ 3D table     │   │ SeatPanel          │ │
│   │  (stage)     │   │ - active seat copy │ │
│   │  seats × 6   │   │ - CTA if relevant  │ │
│   └──────────────┘   └────────────────────┘ │
│   dots (mobile only)                        │
│                                             │
├─ LandingFooterBar: [Privacy] [Terms] [CTA] ─┤
```

On mobile the two columns stack; the stage takes ~55vh, panel ~30vh, footer ~15vh — everything fits in one viewport.

## Risks
- **Perf on low-end mobile**: 3D transforms + drift can jank. Mitigation: `will-change: transform` only on the table group, drift disabled under reduced-motion, no filters/blurs.
- **Text-in-3D readability**: seat labels live on a flat, non-tilted overlay layer (counter-rotated) so text never distorts.
- **Header height variability**: use `min-h-[calc(100dvh-var(--header-h))]` with a CSS var set by the header, or a simple `100dvh` flex column — I'll use the latter for simplicity.
- **SEO**: current landing has rich sections that Google indexes. Replacing with a one-view app-like page loses that surface. Copy inside the SeatPanel + a visually-hidden `<section>` list mirroring the six seat contents keeps the crawlable text.

Confirm the assumptions above (i18n scope, Open-tables as modal, header stays) and I'll implement.
