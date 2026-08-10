# Landing page redesign — from entry screen to startup homepage

## What's there today

`src/routes/index.tsx` is a single full-screen cosmic glass panel: logo, headline "No One Will Be Alone Anymore", "Just Gather", one mission line, a "Join the Table" CTA, a photo, Sign Up / Log In buttons, three tiny text links, plus a two-column "How it works" block that gives cafés and guests equal weight. Structurally it reads as a login card on a starfield — no story, no product proof, no header/footer, and the venue side is half the only explanatory section.

Reusable material already in the project: the cosmic tokens and glow utilities in `src/styles.css`, the nebula backdrop and café photo assets, the logo, the `LanguageSwitcher`, the full EN/TR/FA `landing.v2.*` translation namespace, `SampleGatheringCard`, `NeighborhoodsSection`, `ManifestoSection`, `VenueDashboardPreview`, `SiteFooter`, and the SEO/JSON-LD helpers in `src/lib/seo.ts` and `src/components/json-ld.tsx`.

## Recommended structure (top to bottom)

1. **Public header** — new lightweight marketing header (not `SiteHeader`, which is app chrome): logo, anchor links (How it works, For venues, Vision), language switcher, "Log in" text link, "Join a gathering" button. Transparent over the hero, condenses to solid glass on scroll.
2. **Hero** — left-aligned on desktop, centered on mobile. One-line value prop, one supporting sentence, one primary CTA + one quiet secondary ("See how it works" → scrolls to the demo). Keep the nebula/glow identity but reduce it to a backdrop so the words lead. No login-card framing.
3. **Product demonstration** — the section that makes the concept obvious without signup: an interactive "table" strip showing 3–4 illustrative gathering cards (subject, café, time, seats left, avatar row) built on `SampleGatheringCard`, with a mock join flow (tap a card → seat state changes) so a visitor grasps subject → table → seat in five seconds. Clearly labelled as an example.
4. **How it works for people** — three steps: *Pick a subject you actually care about → Claim one of a few seats → Show up at a real café table.* Reuse `StepCard` visuals, drop the two-column café/guest split.
5. **The problem & our approach** — the loneliness/disconnection section. Honest, non-statistical framing (no invented data), warm typography, built on the existing `ManifestoSection` tone. Explains why small, subject-led, in-person tables beat feeds and large events.
6. **Why it works / features** — four only: subject-first tables, small seat counts, verified members and approved venues, real neighbourhood cafés (can lean on `NeighborhoodsSection`).
7. **For venues** — one compact band, visually secondary (single row, muted panel): fill quiet hours with curated tables, approval-based onboarding, link to `/partnership` and `/venue/auth`. Can reuse a slimmed `VenueDashboardPreview` thumbnail.
8. **Trust & traction (investor-grade, facts only)** — no invented numbers. Uses what exists: three languages with full RTL Farsi, city/neighbourhood coverage from `src/lib/locations.ts`, admin-reviewed venue approval, verified email membership, installable PWA, agent/MCP integration. Framed as "what's already built", not metrics.
9. **Vision** — three to four sentences plus a short "where this goes" line (more cities, more subjects, tables as the default way to meet people).
10. **Final CTA** — full-width closing band, one headline, one button, one venue link underneath.
11. **Footer** — reuse `SiteFooter`, re-pointed to real anchors and pages (currently some links point to `/#how`, `/#tables`, `/#partners`, `/#vibe`, which the new sections should actually define).

## Messaging direction

- Hero value prop candidate: **"Meet real people over one real conversation."** Support line: "Small tables at neighbourhood cafés. One subject, a few seats, people worth meeting."
- Keep "No one will be alone anymore" as the emotional line in the problem section rather than the hero — as a hero headline it states a promise without explaining the product.
- People are the hero throughout; cafés are described as where it happens, never as the subject.
- Avoid event-management vocabulary (manage, schedule, book a venue) in favour of connection vocabulary (table, seat, subject, show up).

## Design direction

Keep the purple identity, dial the cosmic effects down to a hero backdrop and a few accent glows so the mid-page sections breathe on light-on-dark surfaces with generous whitespace. Strong display type for section leads, restrained body copy, section-level scroll reveals (CSS/IntersectionObserver, respecting `prefers-reduced-motion`), and the existing mobile particle/animation opt-outs preserved.

## Assets

- Reuse: logo, nebula backdrop, café photo (relocate into the demo/problem area), all existing cosmic CSS utilities.
- Replace/add: one warm hero visual of people at a café table, plus optional avatar placeholders for the demo cards. Generated only after the structure is approved.

## Technical notes

- Rewrite `src/routes/index.tsx` as a composition of new section components under `src/components/landing/` — the route file stays thin.
- New `src/components/landing/public-header.tsx`; `SiteHeader` and the mobile tab bar remain untouched.
- All new copy goes through `t()` with new `landing.v3.*` keys added for EN, TR and FA in `src/i18n/translations.ts`; old `landing.v2.*` keys stay until nothing references them.
- Head/SEO: keep the existing `localizedHead`, hreflang, Organization and WebSite JSON-LD; update title/description to the new value prop.
- No authenticated routes, no schema, no server functions change. The logged-in redirect to `/dashboard` stays.

## Open question

Traction section: only already-true capability facts will be used. If you have real numbers (venues, gatherings held, waitlist/signups, cities) you want shown, send them and they go in — otherwise nothing numeric appears.
