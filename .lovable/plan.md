## Goal

Restyle `/` to match the uploaded mockup — a deep-space nebula scene with a single glass panel holding the brand, headline, glowing CTA, and a constellation of people — while keeping the current copy ("No One Will Be Alone Anymore" / "Just Gather") and skipping the stats line.

## Visual changes

**Background** — replace the illustrated café photo with a cosmic scene:
- Deep near-black violet base (`#0A0616`), starfield of small twinkling points, and soft purple nebula plumes drifting slowly down the left and right edges (reuse the existing 42s ambient drift timing so motion stays calm).
- A faint Istanbul skyline silhouette (Sultanahmet domes/minarets, Galata tower, bridge) sits low behind the content, as in the mockup. Generated as a new illustrated asset and layered at low opacity.

**Glass panel** — the content now lives inside one rounded glass card centered in the viewport:
- Large radius, thin luminous violet border, blurred translucent fill, subtle top-left highlight — built from the existing `glass-card` token, extended for the stronger edge glow.
- Full-bleed on small phones, inset with margins on larger screens; scales to stay a single no-scroll view.

**Panel contents, top to bottom**
1. Crescent-and-star emblem: a thin-line orbital crescent mark drawn in SVG, in place of the current round photo logo.
2. Brand "Ideal Gathering" in Fraunces, with a hairline divider and a small sparkle at its center.
3. Headline "No One Will Be Alone Anymore" — big, tight, white with violet glow (existing treatment, larger scale).
4. Subtitle "Just Gather" keeps the magical pulsing glow and hover intensification.
5. Primary CTA "Join the Table" — a wide glowing pill with an electric violet fill, a bright rim, a light-streak across the top edge, and a small teacup-with-sparkle icon. Links to `/auth?mode=signup`.
6. Constellation cluster: circular avatar nodes of varying size (one large center, six to eight satellites) connected by thin star-lined edges with pulsing points. Silhouette portraits inside each ring, drawn as an illustrated asset so it matches the mockup's look.
7. Two outlined secondary buttons side by side: **Sign Up** (person-plus icon) → `/auth?mode=signup`, **Log In** (lock icon) → `/auth`.
8. Small footer row below the buttons keeps About / For Venues / Terms, plus the tiny crescent flourish from the mockup.

Language switcher stays pinned in the corner, above the panel.

## Copy

No wording changes. Existing `landing.v2.*` keys are reused for EN/TR/FA; the only new strings are the "Sign Up" label and the CTA "Join the Table" variant, added to all three languages. Layout is verified in RTL for Farsi.

## Technical notes

- `src/routes/index.tsx` is rewritten around the glass-panel structure; the logged-in → `/dashboard` redirect and head metadata stay as-is.
- New tokens/utilities in `src/styles.css`: cosmic background layers, starfield twinkle, nebula plume drift, glass-panel edge glow, CTA rim glow, constellation node/edge pulses. All animation is disabled under `prefers-reduced-motion`.
- Two generated illustrations uploaded as CDN assets: the nebula + skyline backdrop, and the constellation portrait cluster. The old café background asset is removed once unreferenced.
- Colors come from existing dark/nebula tokens; no hardcoded hex added to components beyond the existing landing pattern.
- Verified on a mobile-width and desktop-width viewport that the whole panel fits without scrolling and nothing overlaps.
