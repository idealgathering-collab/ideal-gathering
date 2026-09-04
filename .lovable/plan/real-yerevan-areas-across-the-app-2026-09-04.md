# Real Yerevan areas across the app

Today the app has a plain text list of Yerevan district names, but nothing ties a place on the map to an area, and search still drifts to other cities. This makes Yerevan areas real: every gathering gets an area, people can browse by area, and the map and address search stay inside Yerevan.

## What changes for people

1. **One official Yerevan area list** — the 12 administrative districts plus a few well-known named areas people actually say (Kentron, Cascade, Kond, Northern Avenue, Arabkir, Ajapnyak, Avan, Davtashen, Erebuni, Kanaker-Zeytun, Malatia-Sebastia, Nor Nork, Nork-Marash, Nubarashen, Shengavit). Each area carries its center point and rough boundary box.
2. **Areas fill in automatically** — when someone pins a place on the map or saves a location in Yerevan, the app works out which area it falls in and stores it, instead of leaving the field blank or copying the city name.
3. **Saved locations ask for the area** — the save-a-place dialog shows an area dropdown (pre-filled from the map pin, changeable), so venue and host locations are always labelled.
4. **Browse by area on Explore** — next to the existing city filter, an area filter appears when the selected city is Yerevan; picking one narrows the list. Gathering cards show the area name.
5. **Map and address search stay in Yerevan** — the picker opens on Yerevan and address lookups are biased to Armenia/Yerevan, so typing "Main street" no longer returns Istanbul results.
6. **Landing page areas come from the real list** — the neighbourhoods section reads the same data rather than its own hardcoded four.
7. **Translations** — area names and the new filter labels in English, Russian and Farsi.

## Technical notes

- New `src/lib/yerevan-areas.ts`: typed `YEREVAN_AREAS` (`id`, `en/ru/fa` labels, `center {lat,lng}`, `bounds`), plus `areaForPoint(lat, lng)` (bounds match, nearest-center fallback within city radius) and `areaLabel(id, lang)`.
- `src/lib/locations.ts` keeps `NEIGHBORHOODS_BY_CITY` as the source for non-Yerevan cities but derives the Yerevan entry from the new module so there is a single list.
- `src/components/location-map-picker.tsx`: keeps existing default centre; emits the resolved area id alongside lat/lng via the existing `onChange` payload (additive field, existing callers unaffected).
- `src/components/saved-location-dialog.tsx`: area `Select` bound to the resolved value, written to `saved_locations.neighborhood`.
- `src/routes/_authenticated/create-gathering.tsx`: venue branch stops writing `bizCity` into `neighborhood`; uses the venue's stored area, or `areaForPoint` on its coordinates.
- `src/lib/nominatim.ts`: add `countrycodes=am` and a Yerevan `viewbox` with `bounded=1` for forward search.
- `src/routes/explore.tsx` + new `src/components/area-filter.tsx`: URL search param `area`, client-side filter on the loaded gatherings (no new backend logic); `src/components/gathering-card.tsx` shows the area chip.
- `src/components/neighborhoods-section.tsx`: map over the featured subset of `YEREVAN_AREAS`.
- i18n keys added to `src/i18n/translations.ts`, `src/i18n/ru.ts`, and the Farsi dictionary.
- No database migration: `gatherings.neighborhood` and `saved_locations.neighborhood` already exist. Existing rows keep their current values; a follow-up backfill can be done later if wanted.
- Verify with `bunx tsgo --noEmit` and `bun run test`; add unit tests for `areaForPoint` (inside district, edge case outside Yerevan).

## Out of scope

Our Story, the personality quiz, matching/fit scoring, seat/join logic, and any change to gathering approval flows.
