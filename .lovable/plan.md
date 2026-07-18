# Add Farsi (fa) — full RTL third language

## Scope & risk

- **Translation surface**: ~1,058 string keys in `src/i18n/translations.ts` across 31 files (every route + component that uses `useT()`), including admin and venue dashboards. Every key needs a `fa` value.
- **RTL surface**: ~85 hardcoded directional Tailwind utilities (`ml-/mr-/pl-/pr-/left-/right-/text-left/text-right/border-l/border-r/rounded-l/rounded-r`) across app code, plus ~70 inside shadcn `src/components/ui/*` primitives. shadcn primitives already handle RTL via Radix `dir` context in most cases; app-level code is the main manual work.
- **Persistence**: existing `localStorage` key `ideal-gathering.lang` already generalizes — only the `isLang` guard and `LANGS` array need updating.
- **Risk**: (a) translation drift — Farsi copy for marketing/legal pages needs care; (b) missed hardcoded `ml-*/mr-*` causing visually broken RTL; (c) SSR hydration mismatch if `dir`/`lang` isn't set consistently on `<html>`.

## Staging — 3 stages

Splitting reduces blast radius. Each stage is independently shippable; en/tr stay working throughout.

### Stage 1 — Infrastructure + RTL foundation (safe, no visible fa yet)

1. **`src/i18n/index.tsx`**: extend `Lang` to `"en" | "tr" | "fa"`, update `isLang` guard, add browser-language detection for `fa*`. Add a `useEffect` that sets `document.documentElement.dir = lang === "fa" ? "rtl" : "ltr"` alongside the existing `lang` attribute set.
2. **`src/i18n/translations.ts`**: add `fa: {}` skeleton (falls back to `en` via existing `translations[lang][key] ?? translations.en[key] ?? key` logic — so app keeps working while fa is partially populated).
3. **`src/routes/__root.tsx`**: add Vazirmatn via `<link>` tags in `head()` (preconnect + `https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700&display=swap`), per Tailwind v4 rules (no `@import url()` in styles.css).
4. **`src/styles.css`**: add `[dir="rtl"] body, :lang(fa) body { font-family: "Vazirmatn", var(--font-sans); }` so Farsi renders in Vazirmatn without touching en/tr. Add an `@utility` or global rule to also flip `font-display` headings to Vazirmatn under `[dir="rtl"]` (DM Serif Display has no Arabic-script glyphs).
5. **`src/components/language-switcher.tsx`**: automatically picks up the new entry from `LANGS`; no code change needed beyond adding `{ code: "fa", label: "فارسی", short: "FA" }` to `LANGS`.
6. **Directional utility sweep — app code only** (skip `src/components/ui/*` — Radix handles those via `dir` context): replace hardcoded `ml-*/mr-*/pl-*/pr-*/text-left/text-right/border-l/border-r/rounded-l-*/rounded-r-*` with logical equivalents (`ms-*/me-*/ps-*/pe-*/text-start/text-end/border-s/border-e/rounded-s-*/rounded-e-*`) in the ~25 app files where they appear. Absolute `left-*/right-*` on decorative absolute-positioned elements stays as-is unless visually critical (case-by-case).
7. Verify with typecheck; visually spot-check en/tr look unchanged.

### Stage 2 — Farsi translations, full app

Populate `translations.fa` for every key present in `translations.en`. Written natively in Farsi (not transliterated), with:
- Marketing hero/manifesto/partnership copy adapted (not literal) so it reads well.
- Legal pages (terms, privacy) translated fully.
- Admin + venue dashboard strings translated (functional tone).
- Date/number rendering: keep existing `toLocaleString` calls but pass `lang` where the app currently hardcodes locale (audit `Intl.DateTimeFormat`/`toLocaleDateString` call sites in the same pass).

Deliver as one edit to `translations.ts` to keep the diff reviewable.

### Stage 3 — RTL polish & QA

Run the app with `fa` active on every route and fix layout regressions the sweep missed:
- Headers (`site-header.tsx`), hero split-column, gathering room chat bubbles, admin tables, venue dashboard, notifications bell dropdown alignment.
- Icons that imply direction (`ArrowLeft`, chevrons in buttons): swap or apply `rtl:rotate-180` / `rtl:-scale-x-100` where the icon should mirror.
- Playwright pass through: `/`, `/auth`, `/explore`, `/create-gathering`, `/gatherings/:id`, `/profile`, `/dashboard`, `/admin`, `/venue/auth`, `/venue/dashboard`, `/partnership`, `/terms`, `/privacy` — screenshot in fa and compare.

## Technical details

- **Persistence**: unchanged — `localStorage["ideal-gathering.lang"]` already stores the code as a string; only `isLang` needs to accept `"fa"`.
- **SSR**: `LanguageProvider` already renders `"en"` on first paint to avoid hydration mismatch, then hydrates from `localStorage` in `useEffect`. Fa users will see a brief EN → FA swap on first paint after cold load — acceptable and consistent with current tr behavior.
- **Font loading strategy**: Google Fonts `<link>` is simpler and matches the existing pattern; if reliability becomes an issue we can switch to `@fontsource-variable/vazirmatn`. Going with Google Fonts for stage 1.
- **shadcn primitives**: Radix propagates `dir` from `document.documentElement` automatically for most components; explicit `<DirectionProvider dir="rtl">` wrapper only needed if we see broken dropdowns. Not adding preemptively.
- **Icon mirroring**: header back arrow (`ArrowLeft`) is semantically "back" — Farsi users expect it pointing right. Apply `rtl:rotate-180` on the icon or swap to `ArrowRight` under rtl.

## What I need from you

Approve staging as proposed, or tell me to collapse it into one pass. Assuming approval, I'll ship Stage 1 first in a single message, wait for you to verify en/tr still look right, then proceed to Stage 2 translations, then Stage 3 polish.
