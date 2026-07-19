## Plan — 6-item polish batch

### 1. Language switcher → flag emojis
Edit `src/components/language-switcher.tsx` and `src/i18n/index.tsx` (add `flag` field to LANGS: 🇬🇧 en, 🇹🇷 tr, 🇮🇷 fa). Trigger shows the current flag (no globe icon, no short code). Each dropdown item shows flag + full label. Active item gets a glow ring (`ring-2 ring-primary/60 shadow-[0_0_12px_hsl(var(--primary)/0.5)]`). Add a `pulse-glow` keyframe in `src/styles.css` and apply on hover to all flags.

### 2. Logo background removal (best-effort)
Use `imagegen--edit_image` on the current logo URL with prompt "remove background, keep subject only" and `transparent_background: true`, saving to `src/assets/ideal-gathering-logo.png`. Then upload via `lovable-assets create` and overwrite the `.asset.json` pointer. Flag if result is imperfect (fringing, holes).

### 3. Idle logo spin
Add keyframe in `src/styles.css`:
```css
@keyframes logo-spin { to { transform: rotate(360deg); } }
.animate-logo-spin { animation: logo-spin 24s linear infinite; }
```
Apply `animate-logo-spin` to the logo `<img>` in `site-header.tsx`, `venue.dashboard.tsx`, `site-footer.tsx`, and `waitlist.tsx`.

### 4. /auth logo swap
In `src/routes/auth.tsx` replace the `Coffee` icon circle with `<img src={logoAsset.url}>` + `animate-logo-spin`. Remove the now-unused `Coffee` import if applicable.

### 5. Iran + neighborhoods (⚠ needs migration)
**Migration** (single call): `ALTER TABLE public.profiles ADD COLUMN neighborhood text;` — nullable, no policy changes needed (existing profile policies cover it).

**Code** in `src/lib/locations.ts`:
- Add `{ code: "IR", name: "Iran" }` to COUNTRIES.
- Add IR cities: Tehran, Isfahan, Shiraz, Mashhad, Tabriz, Karaj, Qom, Ahvaz, Kermanshah, Urmia, Rasht, Yazd.
- New export `NEIGHBORHOODS_BY_CITY: Record<string, string[]>` with:
  - İstanbul: Kadıköy, Beşiktaş, Şişli, Beyoğlu, Üsküdar, Bakırköy, Fatih, Sarıyer, Ataşehir, Maltepe, Kartal, Bahçelievler
  - Tehran: Tajrish, Vanak, Elahieh, Niavaran, Sa'adat Abad, Jordan, Darrous, Zafaraniyeh, Fereshteh, Pasdaran, Shahrak-e Gharb, Yousef Abad
- Helper `neighborhoodsFor(city)`.

**Profile UI** in `src/routes/_authenticated/profile.tsx`: add `neighborhood` state, load/save, and render a field below city — `Select` when `neighborhoodsFor(city).length > 0`, otherwise free-text `Input`. Reset neighborhood when city changes.

**i18n**: add `profile.neighborhood`, `profile.neighborhoodPh` in en/tr/fa.

### 6. Button `lg` desktop scaling
In `src/components/ui/button.tsx`: change `lg` to `h-10 rounded-md px-8 sm:h-12 sm:px-10 sm:text-base`.

**Centering audit**: I'll scan the CTA-heavy routes (`index.tsx`, `partnership.tsx`, `auth.tsx`, `venue.auth.tsx`) during implementation and add `justify-center` / `mx-auto` on any wrapping flex container that isn't already centered on desktop. Will list any specific fixes in the completion message.

### Summary
- **Migration**: 1 (add `profiles.neighborhood` column).
- **Asset ops**: logo background removal + re-upload.
- **Code-only**: everything else.
