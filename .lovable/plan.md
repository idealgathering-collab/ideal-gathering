## Stage 3 – Farsi/RTL Cross-Route Visual QA

### 1. Static sweep (code)
- **Non-primitive files**: `rg` for `ml-|mr-|pl-|pr-|text-left|text-right|left-|right-` outside `src/components/ui/`. Convert to logical (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`) except positional absolute anchors that are intentionally viewport-fixed (hero blobs, decorators in `hero-poster.tsx`, dashed line in `index.tsx`). For `location-autocomplete.tsx` icon absolute anchors: convert to `start-3` / `end-3`.
- **shadcn primitives** (~40 hits under `src/components/ui/`): keep primitives unforked; extend the scoped `[dir="rtl"]` block in `src/styles.css` where needed. Confirm existing overrides cover Dialog close btn, Sheet side, DropdownMenu/Select indicator gutter, ContextMenu/Menubar sub-chevrons. Add overrides for any newly-audited primitives actually used: `alert-dialog`, `sidebar`, `command`, `pagination`, `breadcrumb`, `navigation-menu`, `drawer` — but only if a route uses them.
- **Directional icons**: audit `Chevron*` / `Arrow*` usages; ensure every navigational instance has `rtl:rotate-180`. Explicitly do NOT flip: logo (spin animation), `Check`, `Search`, `Bell`, `MapPin`, `Share2`, `CalendarPlus`, `Menu`, `Home`, `Shield`, `Lock`, `Coffee`, `Sparkles`.

### 2. Bidi number/date formatting
- Verify `formatDateTime` in `src/lib/gatherings.ts` uses locale-aware `Intl.DateTimeFormat` for fa (already done in Stage 2). Grep for remaining `toLocaleDateString('en'|'tr')` / hardcoded locales in admin, venue dashboard, notifications, profile. Wrap mixed Latin-numeral spans in `<bdi>` where garbling appears.

### 3. Live Playwright RTL pass
Set `fa` in localStorage, navigate each route at 1280×1800, screenshot, view:
- `/`, `/explore`, `/partnership`, `/auth`, `/venue/auth`, `/waitlist`
- Authenticated (using injected Supabase session if `LOVABLE_BROWSER_AUTH_STATUS=injected`): `/dashboard`, `/profile`, `/create-gathering`, `/gatherings/<id>` (share + calendar buttons, chat, checklist), `/notifications` dropdown, mobile hamburger at 390×844, `/venue/dashboard`, `/businesses/<id>`, `/admin` (users / venues / gatherings tabs).
- If auth status is `signed_out` / `external_unmanaged`, flag those routes as code-fixed-but-visually-unverified in the report.

For each screenshot check: menu/dialog side, table row alignment, card flex order, icon direction, number/date rendering, back-button chevron.

### 4. Fixes + report
Apply targeted edits (logical-property swaps, `rtl:rotate-180` add/remove, `[dir="rtl"]` CSS overrides, `<bdi>` wraps). Report file-by-file with a short list of what was untouched and why, and explicitly flag any authenticated route that could not be visually confirmed.

### Out of scope
- No behavior/logic changes, no new translations (Stage 2 owns copy), no forking shadcn source files.
