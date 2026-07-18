# Navigation fixes — plan

## 1. Mobile hamburger menu in `SiteHeader`

Edit `src/components/site-header.tsx`:

- Import `Menu` and `Home` from `lucide-react`, plus `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuTrigger` from `@/components/ui/dropdown-menu` (same primitives `language-switcher.tsx` uses — no new dep).
- Keep desktop nav unchanged (existing `hidden sm:inline-flex` buttons stay for `sm+`).
- Add a new hamburger trigger rendered only on mobile (`sm:hidden`), placed at the right of the nav:
  - Logged in: dropdown items = Dashboard, Profile, Admin (only if `isAdmin`), Sign out. Remove the current mobile-only avatar link to `/profile` (redundant once Profile lives in the menu) and route the sign-out `DropdownMenuItem` through the existing `handleSignOut`.
  - Logged out: dropdown items = Partnership. (Join stays inline; Language stays inline via existing switcher.)
- Inline-on-mobile items remain: `LanguageSwitcher`, `NotificationsBell` + Host button (logged in) / Join button (logged out).

## 2. Home icon nav item

- Add a `Link to="/"` button with the lucide `Home` icon, `aria-label={t("nav.home")}`, icon-only (ghost `size="icon"`, rounded-full — matches existing icon buttons).
- Placement: in the left cluster right after the logo wordmark, visible on both desktop and mobile (no responsive hiding).
- Add `nav.home` translation key ("Home" / "Ana Sayfa") to `src/i18n/translations.ts`.
- The existing back-arrow behavior in the header is untouched.

## 3. Back arrow on `/auth`

Edit `src/routes/auth.tsx`:

- Import `ArrowLeft` from `lucide-react` and `useNavigate` (already imported).
- In the custom layout, next to the existing logo `Link` at the top, add a small ghost icon button (matching SiteHeader's back button styling — `variant="ghost" size="icon" rounded-full`, `ArrowLeft` icon, `aria-label={t("common.back")}`).
- On click: if `typeof window !== "undefined" && window.history.length > 1` call `window.history.back()`, else `navigate({ to: "/" })`.
- Styling: keep it on the same row as the logo so it doesn't disturb the gradient hero layout; use a light foreground color that reads on the purple gradient (e.g. `text-primary-foreground hover:bg-white/10`).

## Other routes that skip `SiteHeader` (flagged per your ask)

Grepped every route file. Besides `/auth`, these two also render their own custom shell and therefore also lack the header's back button:

- `src/routes/venue.auth.tsx` — mirror of `/auth` for venue signup, same gap.
- `src/routes/venue.dashboard.tsx` — has its own custom header (with a notifications bell) instead of `SiteHeader`; also no back button.

Recommendation: apply the same lightweight `ArrowLeft` treatment to `venue.auth.tsx` in this pass (near-identical layout to `/auth`, trivial add). Leave `venue.dashboard.tsx` alone — it's the venue's landing surface after login where "back" is ambiguous, matching how `/dashboard` behaves under `SiteHeader` (the header hides the back button only at `/`; on `/dashboard` it currently shows one, so venue dashboard is actually the odd one out — but changing that is a separate design call, not part of this bundle). **Please confirm** whether to include `venue.auth.tsx` in this pass.

## Out of scope

- No changes to `SiteHeader`'s existing back-arrow logic.
- No changes to i18n keys other than adding `nav.home`.
- No routing/URL changes.
