# Design system

## CURRENT — source-defined system
Baseline: `a37898970d63c9358c0592a7c81f07c7cbf2b828`. Evidence: [styles](../src/styles.css), [component configuration](../components.json), `src/components/ui/`, profile and gathering components. No rendered UI audit was performed in this setup.

- Tailwind 4 CSS theme variables with semantic background, foreground, card, primary, secondary, accent, muted, destructive, border/input/ring and sidebar tokens.
- Default theme is dark purple/cosmic nebula, with violet surfaces and warm amber/gold highlights. Base radius is `1rem`; derived radii and rounded cards are used.
- Examples: background `oklch(0.16 0.05 300)`, primary `oklch(0.56 0.23 295)`, sunshine `oklch(0.85 0.15 85)`; nebula purple `#7C3AED`.
- Existing utilities include glass cards, glow buttons, gradients, shadows and animated cosmic scenes.
- shadcn configuration: new-york style, TSX, CSS variables, Lucide icons, aliases under `@/components` and `@/lib`. Radix components supply interaction primitives.
- Existing patterns: `SiteHeader`, public/landing header, mobile tab bar, `ProfileCard` and profile sectors, gathering cards, onboarding steps, dialogs, filters, feedback and report forms.

## Typography conflict — preserve, do not silently redesign
The styles header mentions DM Serif Display/Fira Sans. Actual theme tokens specify Outfit/Figtree; base body and headings use Inter; Persian/RTL styling uses Vazirmatn/Inter. These are distinct declarations, not one consistent verified font system. Inspect the rendered target component and font loading before any approved typography consolidation.
`components.json` says `rtl: false`, while CSS contains RTL/Persian rules. This is a configuration observation, not proof that RTL works or fails.

## Rules for future work
Reuse semantic tokens and existing primitives rather than hard-coding a competing palette or building duplicate controls. Match spacing, breakpoints, cards and navigation in the surrounding implementation.
For approved UI work, verify mobile layouts, keyboard/focus behavior, labels, error/empty/loading states, contrast, reduced-motion behavior and supported language directions. These are check requirements, not claims of current compliance.
Keep matching/profile visuals welcoming and nonjudgmental; personality scores are not diagnoses or public status rankings.

## PROPOSED
Only resolve inconsistencies through a scoped IG-XXX spec with visual acceptance criteria. No redesign, new logo, palette, font replacement or component-library migration is authorized by this setup.
