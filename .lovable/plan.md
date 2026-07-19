## Stage 3 RTL QA — Cross-Route Visual Pass

### 1. Static sweep (already largely clean)
Grep confirms all non-primitive files use logical properties. Remaining hits are intentional decorative absolutes (`hero-poster.tsx` blur blobs, `index.tsx` dashed connector line) — leave untouched. Re-scan under `src/routes/_authenticated/**`, `src/components/gathering-room.tsx`, `menu-section.tsx`, `venue-dashboard-preview.tsx`, `admin.tsx`, `venue.dashboard.tsx`, `businesses.$id.tsx`, `dashboard.tsx`, `create-gathering.tsx`, `profile.tsx`, `gatherings.$id.tsx` for any missed `ml-/mr-/pl-/pr-/text-left/text-right/left-N/right-N` and convert to logical or add `[dir="rtl"]` override.

### 2. shadcn primitive audit (extend `src/styles.css` overrides)
Existing overrides cover Dialog close btn, Sheet side, Dropdown/Context/Menubar/Select indicator gutter & sub-chevron, table `th.text-left`. Add if a used route needs it:
- `drawer` header `sm:text-left` → `sm:text-start` via override.
- `dialog` header `sm:text-left` — same.
- `calendar` `pl-2 pr-1` chevron button — flip.
- Verify Popover (notifications bell) alignment via `align="end"` behaves in RTL (Radix flips automatically — likely fine, screenshot to confirm).

### 3. Directional icon audit
Grep every `Chevron*` / `Arrow*` / back-button `←` in routes and components. Ensure each navigational instance has `rtl:rotate-180`. Explicitly keep unflipped: logo (spin), `Check`, `Search`, `Bell`, `MapPin`, `Share2`, `CalendarPlus`, `Menu`, `Home`, `Shield`, `Lock`, `Coffee`, `Sparkles`, `Plus`, `X`. Flag `notifications-bell` badge (`-end-0.5`) — already logical.

### 4. Bidi number/date rendering
Confirm `formatDateTime` in `src/lib/gatherings.ts` and `relativeTime` in `src/lib/notifications.ts` pass `lang`. Grep `toLocaleDateString\(|toLocaleString\(|toLocaleTimeString\(|Intl\.DateTimeFormat\(` across `src/` for any hardcoded `'en'`/`'tr'`. Wrap Latin-numeral spans embedded in Farsi sentences with `<bdi>` where garbling appears in screenshots (e.g. seat counts like "3/5" inside `sample.taken`).

### 5. Live Playwright RTL pass
Set `localStorage.language = 'fa'` and screenshot each route at 1280×1800 (and mobile 390×844 for hamburger):
- Public: `/`, `/explore`, `/partnership`, `/auth`, `/venue/auth`, `/waitlist`.
- Authenticated (if `LOVABLE_BROWSER_AUTH_STATUS=injected`): `/dashboard`, `/profile` (neighborhood dropdown), `/create-gathering`, `/gatherings/<id>` (share/calendar buttons, chat, checklist), `/notifications` dropdown open, `/venue/dashboard`, `/businesses/<id>`, `/admin` (users / venues / gatherings tabs).
- If session unavailable → mark those routes code-fixed-but-visually-unverified.

Per screenshot check: menu/dialog side, table row alignment, card flex order, icon direction, number/date rendering, back-button chevron, hamburger sheet slides from correct side.

### 6. Fix + report
Apply minimal targeted edits — logical-property swaps, `rtl:rotate-180` add/remove, `[dir="rtl"]` CSS overrides, `<bdi>` wraps where numerals garble. Report file-by-file with visual-vs-code-only status per route.

### Out of scope
No behavior/logic changes, no new translations, no forking shadcn source, no touching intentional decorative absolutes in hero-poster or index dashed line.