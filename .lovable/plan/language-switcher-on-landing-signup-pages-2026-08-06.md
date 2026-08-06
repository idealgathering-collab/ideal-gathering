# Language switcher on landing + signup pages

Most of this already exists: the EN/TR/FA switcher component is live on the landing page, the site header, and the venue dashboard, and both signup pages (`/auth` and `/venue/auth`) already render all their text through the translation system. What's missing is the switcher control itself on the two signup/login pages, which sit outside the site header — so a visitor landing there has no way to change language.

## What will change

- Add the existing flag-based language switcher to the top corner of the guest signup/login page (`/auth`), aligned with the back button.
- Add the same switcher to the venue signup/login page (`/venue/auth`).
- Keep the landing page switcher as-is.

## Behaviour

- Choosing a language instantly re-renders all text (landing, signup, venue signup) in EN, TR, or FA.
- The choice is saved and persists across page loads and navigation (already handled by the language provider).
- Farsi keeps right-to-left layout, including on the signup forms.

## Technical notes

- Insert `<LanguageSwitcher />` into the header rows of `src/routes/auth.tsx` and `src/routes/venue.auth.tsx`; no new state or storage logic needed.
- Audit the two auth routes for any remaining hardcoded English strings (toasts, placeholders, button labels) and route them through `t()`, adding any missing keys to `src/i18n/translations.ts` for all three languages.
