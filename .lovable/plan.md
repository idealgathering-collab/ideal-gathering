# Fix: "profile not found" when following profile prompts

## What's happening

The profile-completion prompts on the dashboard and header link to pages that don't exist.

`src/lib/profile-completion.ts` points two prompts at:
- `/onboarding/preferences`
- `/onboarding/quiz`

But onboarding is a single route, `src/routes/_authenticated/onboarding.tsx`, driven by a `?step=` search param (`welcome`, `how`, `prefs-intro`, `prefs`, `qintro`, `quiz`, `quiz-result`). There are no `/onboarding/preferences` or `/onboarding/quiz` route files, so clicking those prompts lands on a not-found page — which is the current `/onboarding/preferences` URL in the preview.

## Fix

1. In `src/lib/profile-completion.ts`, change the prompt targets to real URLs:
   - preferences prompts -> `/onboarding?step=prefs`
   - quiz prompt -> `/onboarding?step=quiz`
2. Keep the remaining targets (`/profile#interests`, `/profile`, `/explore`) as-is — those routes exist.
3. Make sure the links still work with the typed router: in `src/routes/_authenticated/dashboard.tsx` and `src/components/site-header.tsx` the `Link to={actionUrl}` usage needs to accept a URL with a query string. If TypeScript rejects the string form, switch the prompt shape to `{ to, search }` (or keep `actionUrl` and render it as a plain `href`-style link) so the search param is passed properly.
4. Verify the onboarding page honours a deep link: it already seeds `step` from `Route.useSearch()`, so `/onboarding?step=prefs` opens the preferences questions directly.

## Verification

- From the dashboard, click each profile-completion prompt and confirm it opens the intended screen instead of a not-found page.
- Run typecheck and the unit test suite.

## Notes

No database, RLS, or profile-query changes are needed — the profile data loads fine (the profile row returns correctly); only the prompt destinations are wrong.
