## Stage 3 — RTL/Farsi cross-route QA pass

### Approach

Two-phase: (1) static sweep for remaining directional classes and known primitive issues, (2) live visual QA via Playwright at `dir="rtl"` with `fa` active, capturing screenshots per route and fixing what I see.

### Phase 1 — Static sweep (code-level)

1. **Grep the whole `src/`** for the directional patterns the first pass skipped:
   - `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`, `text-left`, `text-right`, `border-l`, `border-r`, `rounded-l`, `rounded-r`, `space-x-` (doesn't reverse), `divide-x`.
   - Categorize each hit: (a) safe to flip to logical (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`, `text-end`, `border-s`, `border-e`, `rounded-s`, `rounded-e`), (b) intentional (icon-internal, absolute-positioned decorative element that should mirror via `rtl:` variant), or (c) shadcn primitive to patch in place.

2. **shadcn primitives audit** — expected patches in `src/components/ui/`:
   - `dropdown-menu.tsx`, `select.tsx`, `context-menu.tsx`, `menubar.tsx`: `SubTrigger` chevron (`ml-auto`) + `data-[side]` positioning; add `rtl:` mirroring on chevrons and swap `ml-auto` → `ms-auto`.
   - `sheet.tsx`: `side="left"` / `side="right"` — used by mobile hamburger; verify it opens from the correct edge in RTL (should mirror).
   - `dialog.tsx`, `alert-dialog.tsx`: close button `right-4` → `end-4`; footer button order.
   - `sidebar.tsx` (if present), `command.tsx`, `navigation-menu.tsx`, `popover.tsx`, `tooltip.tsx`: alignment offsets.
   - `toast.tsx` / `sonner.tsx`: toast position — flip to opposite corner in RTL.
   - `calendar.tsx`: nav chevrons + week layout.
   - `input.tsx`, `textarea.tsx`: ensure no forced `text-left`.
   - `checkbox.tsx`, `radio.tsx`: check indicator position.

3. **Icons that must NOT mirror** — add explicit non-mirroring where a blanket `rtl:-scale-x-100` (if any exists) hits them:
   - Logo (spinning), checkmarks, X/close, search, bell, calendar, clock, user/avatar icons, brand marks, media controls (play/pause), stars.
   - Icons that SHOULD mirror: `ChevronLeft`/`ChevronRight`, `ArrowLeft`/`ArrowRight`, back-button chevrons, `ChevronsLeft`/`ChevronsRight`, list-bullet direction, send-arrow in chat.

4. **Number/date bidi**: audit every `toLocaleString` / `Intl.NumberFormat` / `Intl.DateTimeFormat` / manual number interpolation. For `fa`, either use `fa-IR` locale (native Persian digits, correct bidi) or wrap Latin numerals in `<bdi>` inside Farsi sentences. Focus on: gathering date/time chips, admin tables (created_at, counts), notifications timestamps, chat message timestamps, checklist counts, price rendering in menu items.

### Phase 2 — Live visual QA (Playwright, fa + dir=rtl)

Route matrix — screenshot each, compare against LTR, log issues:

- `/` (home, hero, manifesto, partnership teaser, footer)
- `/auth`, `/venue/auth` (back button, logo, form alignment)
- `/explore` (filters, gathering-card grid)
- `/dashboard` (my gatherings, status badges including new `rejected`)
- `/create-gathering` (multi-step form, date picker, table selector)
- `/gatherings/$id` (share button, add-to-calendar button, chat room message alignment + send arrow, checklist)
- `/businesses/$id`
- `/venue/dashboard` (tabs, table CRUD, notifications bell, spinning logo)
- `/admin` — users tab, venues tab (approve/reject dialog), gatherings tab (pending queue)
- `/profile` (neighborhood field city-dependent Select/Input, avatar, socials)
- Notifications dropdown (open on bell, verify alignment + timestamp bidi)
- Mobile viewport (375px): hamburger menu open — should slide from the correct edge; Home icon placement.
- Language switcher dropdown (flag glow ring in RTL context).

For each: capture screenshot with `dir="rtl"` and `fa` set, `code--view` the images, note visible issues, fix, re-screenshot to confirm.

### Fixes I will apply

- Convert remaining safe directional classes to logical equivalents in app code and shadcn primitives.
- Add `rtl:rotate-180` (or `rtl:-scale-x-100`) to directional chevrons/arrows that don't already mirror; add `rtl:rotate-0` overrides on any icon incorrectly caught by a blanket rule.
- Patch `dropdown-menu` / `select` / `dialog` close-button positioning to logical.
- Flip `Sheet` side for mobile hamburger in RTL (or use `side="start"` pattern via prop switch based on `dir`).
- Move toast position to opposite corner under RTL.
- Update date/number formatting call sites to use active locale (`fa-IR` where `fa`) and wrap Latin-in-Farsi with `<bdi>` where needed.

### What I'll flag rather than silently "fix"

- Any shadcn primitive change that visibly affects LTR — I'll note it explicitly so you can review.
- Any icon where the "should it mirror?" call is subjective (e.g. external-link arrow, social share glyphs).
- Any route where visual confirmation is blocked (auth wall with no seeded data, empty admin queue) — I'll note "not visually confirmed, code-level fix only."

### Deliverable

Single summary at the end: files touched (grouped by category — app code / shadcn primitives / icon mirroring / formatting), screenshot evidence for the routes I could reach, and an explicit "unconfirmed" list.

No migrations needed — this is pure frontend/presentation.
