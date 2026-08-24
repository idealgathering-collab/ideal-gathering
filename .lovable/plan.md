# Fit-based recommendations on Explore

Frontend-only. No new matching math, no backend changes: Explore already calls the existing `getTableFit` server function and already renders the fit chip on cards. This plan reorders and highlights, nothing else. Joining, seats, quiz, and Our Story are untouched.

## What changes for the user

1. **Fit-first by default.** For a signed-in user with quiz traits, Explore lists gatherings from best fit to worst. Anyone without traits (or signed out) sees today's order (soonest first) — nothing regresses.
2. **New sort control.** A small segmented control next to the city filter: Best fit / Soonest / Nearest. "Nearest" enables the existing device-location flow (today's "Near me" button folds into this control). The choice is stored in the URL (`?sort=fit|soon|near`) so it survives refresh and sharing.
3. **"Recommended for you" row.** Above the main grid, the top 2–3 highest-fit upcoming gatherings for the signed-in user, in a visually distinct band (accent border/tint + heading + short subline). Shown only when the viewer has traits and at least 2 scored tables exist. These same gatherings still appear in the list below.
4. **Fit badge on cards.** Cards keep the existing `TableFitChip`, moved up to sit next to the seats badge on the image so it reads at a glance. Same styling and logic as the detail page: a percentage when scoreable, the neutral "be the first" chip when nobody at the table has taken the quiz, nothing at all when a block exists.
5. **No quiz pressure.** The existing `TakeQuizNudge` stays exactly as is for signed-in users without traits. No gating anywhere.

## Technical notes

- `src/routes/explore.tsx`: extend `validateSearch` with `sort`; derive an ordering from `fitById` (fit desc, unscored last, tie-break by `starts_at`), `starts_at` asc, or distance asc. Default resolves to `fit` when `fitData.viewerHasTraits` is true, else `soon`. Fit data already arrives via the existing `useQuery` on `getTableFit`; while it's loading the list renders in soonest order and re-sorts on arrival.
- New `src/components/explore-sort.tsx` (segmented control) and `src/components/recommended-row.tsx` (the highlighted band, reusing `GatheringCard`).
- `src/components/gathering-card.tsx`: reposition the existing `fit` chip; optional `highlight` prop for the recommended variant's ring/accent. No new props for scoring.
- Translations: ~6 new keys (`explore.sort.*`, `explore.recommended.title`, `explore.recommended.subtitle`) added for en/tr/fa.
- No migration, no change to `matching.functions.ts`, `table-fit.ts`, or `gatherings.ts` query shape.

## Verification

Unit tests for the sort comparator in `tests/unit/`; run the existing suite. Browser check of `/explore` signed out, and with a traits/no-traits account if a session can be minted.
