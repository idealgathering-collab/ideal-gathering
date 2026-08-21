# Profile page redesign (layout + visuals only)

No field, save logic, upload, or delete behavior changes. Every existing section stays, with the same inputs and handlers — only how they are framed, grouped, and ordered on screen changes.

## The problem today

`profile.tsx` renders a plain `max-w-3xl` column of eight visually identical `rounded-3xl border bg-card p-6` blocks. The avatar upload widget is one of them, so the page never establishes "this is you" — it reads as a settings dump where a destructive delete card carries the same weight as a bio field.

## Proposed structure

```text
┌──────────────────────────────────────────────┐
│  IDENTITY HEADER  (gradient/plum banner)     │
│  ⬤ avatar   Display name                     │
│   +upload   Neighborhood · City · Country    │
│             [interest] [tags] [+3]   email   │
└──────────────────────────────────────────────┘

  YOUR PUBLIC INFO            ← group eyebrow
  ┌ About (name, bio, location) ┐
  ┌ Interests                   ┐   plain cards,
  ┌ Social links                ┐   subtle borders
  [ Save changes ]  ← sticky on mobile

  YOUR ACCOUNT                ← group eyebrow, muted band
  ┌ Saved locations ┐
  ┌ Blocked people  ┐
  ┌ Account (admin views, sign out) ┐
  ┌ Danger zone (destructive) ┐
```

### 1. Identity header

Replaces the standalone avatar card. A full-width banner at the top of `main`:
- Background uses the app's existing `bg-gradient-hero` / `shadow-plum` language (same tokens the landing and gathering cards use), rounded `rounded-3xl`, with the content on `bg-card` below it or overlapping it slightly.
- Avatar grows to ~96–112px, sits on the banner edge, with the "Change photo" control as a small circular overlay button on the avatar itself plus the existing hint text beside it. Same `avatarRef` input, same `onAvatarChange`.
- Beside it: display name in `font-display text-3xl` (falls back to email prefix when empty), a `MapPin` line with neighborhood · city · country, the email as muted small text, and up to ~5 interest chips reusing the existing `bg-primary/10 text-primary rounded-full` chip style (read-only here; editing stays in the Interests card).
- All values are read from the state already in the component — purely derived, no new queries.

### 2. Two grouped bands, no tabs

Tabs are the wrong tool here: the account group contains a destructive action and admin shortcuts that should not be hidden behind a tab, and profile editing is a "scan, fix one field, save" task where hiding half the page adds a click. Grouped sections with a clear visual break give the hierarchy without the cost.

Grouping treatment:
- Each group starts with a small uppercase eyebrow (`text-xs tracking-wide uppercase text-muted-foreground`) plus a one-line description — the same eyebrow pattern already used on landing sections and gathering card chips.
- **Your public info** (About, Interests, Social) — cards keep `bg-card` but drop to a lighter `border-border/60` and slightly tighter padding so they read as siblings of one form, ending in the existing Save button.
- **Your account** (Saved locations, Blocked people, Account actions, Danger zone) — wrapped in a `bg-muted/30` band with `rounded-3xl` and inner cards on `bg-card`, so the whole group visually recedes from the editable profile above it. Danger zone keeps its `border-destructive/40` and stays last.
- Within About, the location trio (country / city / neighborhood) gets its own subtle inner block with a small heading so the three selects don't read as loose fields.

### 3. Mobile

Current narrow rendering is a fine-but-flat stack; the redesign keeps that as the base and only adds density on wider screens.
- Header stacks: avatar centered above name/meta under `sm`, side-by-side from `sm` up.
- Public-info cards remain single-column on mobile; on `lg` the Interests + Social cards can sit side by side in a 2-col grid while About stays full width.
- Save button becomes a full-width button on mobile (it is currently a right-aligned pill that is easy to miss at the bottom of a long form).
- Padding steps down (`p-4` mobile → `p-6` sm+), and the account band's outer padding collapses to keep inner cards from double-inseting.
- Verify against the existing fixed mobile tab bar: bottom padding on `main` so the danger-zone card isn't obscured.

### 4. Reuse vs. new

Reused as-is: `rounded-3xl`, `border-border`, `bg-card`, `shadow-soft` / `shadow-plum`, `bg-gradient-hero`, `font-display`, `text-muted-foreground`, `border-destructive/40`, existing `rounded-full` Button variants, existing interest chip styling, `SiteHeader`, lucide icons already imported.

New: no new tokens, no new colors, no new dependencies. One small presentational component `ProfileHeader` (in `src/components/profile-header.tsx`) taking already-loaded props, plus optionally a tiny `SectionGroup` wrapper for the eyebrow + band. Consider adding `SiteFooter` for consistency with explore only if it's already used on other authenticated pages.

## Technical notes

- `SavedLocationsSection` and `BlockedUsersSection` each hard-code their own `mt-6/mt-8 rounded-3xl border bg-card p-6` wrapper. To place them inside the account band without double borders, add an optional `className`/`bare` prop to those two components (presentation only — their logic, queries, and dialogs are untouched).
- Existing i18n keys are reused. Two or three new keys may be needed for the group eyebrows (e.g. `profile.group.public`, `profile.group.account`) — added for en/tr/fa.
- After implementing, screenshot the page at 390px and 1280px via the headless browser to confirm the header, the band, and the mobile tab-bar clearance.
