# Fixed interest taxonomy on the profile

Profile UI + one new constants file. No backend change: `profiles.interests` stays a text array, existing values stay untouched. Matching, quiz, Explore, and Our Story are not touched.

## What changes for the user

1. The Interests card on the profile no longer has a free-text box. Instead it shows a grouped picker of predefined interest chips (7 categories, ~50 tags) that you toggle on and off.
2. Selected interests still appear as removable pill chips at the top of the card, and the 15-tag maximum still applies (with the same "up to 15" toast when exceeded).
3. Old free-text interests already on a profile keep showing as pills and can still be removed — they just can't be re-added once removed.
4. All tag labels and category headers are translated for English, Turkish, and Farsi.

## Categories and tags

Food & Drink, Outdoors, Arts & Culture, Games & Hobbies, Sports & Fitness, Learning & Ideas, Nightlife & Social — roughly 7 tags each (coffee, brunch, wine, hiking, cycling, live music, museums, board games, photography, cooking, book clubs, running, yoga, languages, startups, dancing, etc.).

## Technical notes

- New `src/lib/interests.ts`: typed `INTEREST_CATEGORIES: { id: string; tags: string[] }[]` of stable slugs (e.g. `coffee`, `board_games`), plus a flat `INTEREST_TAGS` set and `isKnownInterest(tag)`.
- Stored values are the slugs. Display goes through a small helper `interestLabel(t, tag)` that returns `t("interest." + tag)` for known slugs and the raw string for legacy free text — used in the profile card and in `src/components/profile-header.tsx` so the banner chips read correctly.
- `src/routes/_authenticated/profile.tsx`: replace `interestInput` state + Enter/comma handler + Add button with a grouped toggle-chip grid; keep `interests` state, the 15 cap, save payload, and the removable pill row exactly as they are.
- `src/i18n/translations.ts`: add `interest.<slug>` and `interest.cat.<id>` keys for en/tr/fa, plus a reworded `profile.interests.hint` (no more "Press Enter"), and drop the now-unused `profile.interests.add` / `.addBtn` keys.
- No migration, no changes to `matching*`, `table-fit`, Explore, or the quiz.

## Verification

Run the existing unit suite (no logic files change, so it should stay green) and view `/profile` to confirm toggling, the 15 cap, and legacy pills.
