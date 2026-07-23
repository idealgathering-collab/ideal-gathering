## Restore language switcher on landing page

The existing `LanguageSwitcher` component (`src/components/language-switcher.tsx`) is untouched — it still renders the 3-flag dropdown (English, Turkish, Farsi) with the pulsing purple ring. It just isn't mounted on the redesigned home page anymore.

### Change

In `src/routes/index.tsx`:

1. Import `LanguageSwitcher` from `@/components/language-switcher`.
2. Inside the root `<div>` of `Home`, add an absolutely-positioned wrapper in the top-right corner (above the background layers), e.g. `<div className="absolute top-4 right-4 z-10"><LanguageSwitcher /></div>`.

No other files change. No new component, no styling changes to the switcher itself.
