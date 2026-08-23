# Turkish + Farsi for the rebrand copy, and finishing Farsi RTL QA

Two translation/presentation tasks. No copy rewrites in English, no logic or backend changes.

## Task 1 — Translate the "Just Gather" copy into TR and FA

Confirmed state: the `landing.v4.*` keys exist only in the English dictionary (55 keys, `src/i18n/translations.ts` lines 969–1035). The Turkish and Farsi dictionaries have none of them, so Turkish and Farsi visitors currently see the entire new landing page in English via the fallback.

What will change:
- Add all 55 `landing.v4.*` keys to the `tr` and `fa` dictionaries: hero, how-it-works steps, categories, upcoming sample strip, differentiation, safety, and the final CTA.
- The hero couplet stays two lines with the same emotional-then-imperative rhythm:
  - TR: line 1 an emotional promise ("Artık kimse yalnız kalmayacak."), line 2 a short imperative ("Sadece buluş.")
  - FA: line 1 the same promise in natural Persian, line 2 a two-word imperative — not merged into one sentence.
- Tone matched to the existing `landing.v3.*` TR/FA entries: warm, plain, no marketing jargon; Farsi stays formal-but-warm as in the Our Story translations.
- Any interpolations (e.g. `{n}` in the seats badge) preserved, and word order adjusted so the placeholder reads naturally in each language.

## Task 2 — Farsi RTL cross-route visual QA

Routes to check with `?lang=fa` (public first, then authenticated with a signed-in preview session, then admin/venue):

Public: `/`, `/explore`, `/gatherings/$id`, `/our-story`, `/partnership`, `/waitlist`, `/auth`, `/venue/auth`, `/reset-password`, `/privacy`, `/terms`
Authenticated: `/dashboard`, `/onboarding`, `/my-gatherings`, `/chat`, `/create-gathering`, `/profile`, `/settings`, `/businesses/$id`
Role dashboards: `/admin` (all tabs: venues, users, reports, gatherings, locations), `/venue/dashboard`

What I'll look for on each:
- Directional icons (arrows, chevrons, back buttons, carousel controls) that need `rtl:rotate-180` or a logical equivalent.
- Hardcoded physical Tailwind classes that should be logical: `ml-/mr-`, `pl-/pr-`, `text-left/right`, `left-/right-`, `border-l/r`, `rounded-l/r`. A first sweep already flags `src/routes/our-story.tsx`, `src/components/hero-poster.tsx`, `src/components/round-table/RoundTable.tsx`, `src/components/neighborhoods-section.tsx`, `src/components/landing/public-header.tsx`, and `src/components/gathering-room.tsx` as app-level candidates.
- Rows that stay LTR-ordered when they should mirror (headers, card meta rows, form footers, chat bubbles, table columns).
- Text alignment falling back to left inside RTL containers.
- Absolutely-positioned overlays (badges, avatar stacks, close buttons) pinned to a physical side.

Out of scope for rewriting: `src/components/ui/*` shadcn primitives, which are RTL-aware by design. If a primitive genuinely breaks in RTL, I'll patch just that one file and note it.

## Technical notes

- Verification via headless browser passes over each route at `?lang=fa`, capturing screenshots, plus a repo-wide grep for physical-direction utilities in `src/routes` and `src/components` (excluding `ui/`).
- Fixes are className-level only: physical → logical utilities (`ms-/me-`, `ps-/pe-`, `text-start/end`, `start-/end-`), and `rtl:` variants where a flip is needed.
- Numerals and dates keep the existing formatter behaviour — no change there.
- Existing unit and DB test suites are re-run at the end; neither task should affect them.

## Scope estimate

- Task 1: one file (`src/i18n/translations.ts`), ~110 added lines. Small.
- Task 2: roughly 20 route passes plus fixes across an estimated 6–12 component/route files. Medium — this is the larger half of the work, mostly QA passes rather than big edits.
