# Device geolocation: "Use my location", smarter map center, nearby gatherings

Three related additions, all opt-in and all degrading to today's behavior when location is unavailable or denied.

## 1. "Use my location" button on address entry

New shared hook `useDeviceLocation()` (in `src/lib/geolocation.ts`) wrapping `navigator.geolocation.getCurrentPosition` with:
- support detection (`"geolocation" in navigator`), a 10s timeout, `enableHighAccuracy: true`
- returned state: `idle | locating | ready | denied | unavailable`
- a one-time in-memory cache of the last fix so repeat uses don't re-prompt

UI: a compact icon+label button (`Crosshair` icon, `variant="outline"`, rounded, same height as the input) sitting directly to the right of the location autocomplete input, wrapping below it on narrow screens. Label: "Use my location" (EN/TR/FA). While locating it shows a spinner and is disabled.

On success it calls the **existing** `reverseGeocode` from `src/lib/nominatim.ts` (already shared, already rate-limited), then fills exactly the same fields the autocomplete fills — `display_name`, `address`, `city`, `lat`, `lng` — and moves the map marker.

Where it appears:
- `src/components/location-map-picker.tsx` — next to its `LocationAutocomplete` (this is the picker used by the saved-location dialog, which is the create-gathering saved-location flow).
- Venue registration: it uses the same map picker component, so it inherits the button with no extra work (verified during build; if it uses a bare autocomplete instead, the same button is added there).

Failure handling: permission denied or timeout → a single non-blocking toast ("Couldn't get your location — you can still search or drop a pin") and the button reverts to idle. Nothing is cleared, no error UI persists.

## 2. Map picker default center

`DEFAULT_CENTER` (Istanbul) stops being the first choice. New fallback order when there is no existing value:

1. **Device location** — only if `navigator.permissions.query({name:"geolocation"})` reports `granted` (a silent read that never prompts). If granted, we fetch the position without any prompt.
2. **Profile city** — read `profiles.city` (already loaded elsewhere) and forward-geocode it once via Nominatim, cached per session.
3. **Istanbul** — last resort, unchanged.

Prompt timing: no prompt on page load, ever. The picker only mounts inside the saved-location dialog, and even there we do not prompt — the permission prompt happens **only** when the user presses "Use my location". If permission state is `prompt` or `denied`, step 1 is skipped silently.

The map still renders immediately at the best-known center; if a better center resolves a moment later (profile-city geocode), the map pans once, before the user interacts.

## 3. Nearby gathering suggestions

Recommendation: **both, but driven by one opt-in control** — a "Near me" toggle in the Explore filter row next to `CityFilter`, plus a distance label on each gathering card.

- Pressing "Near me" is the action that triggers the permission prompt (nothing ambient).
- Once a fix exists, each card gets a small distance chip ("2.4 km away") in the card's meta row, and the Explore grid switches sort from `starts_at` to ascending distance. Gatherings with no coordinates keep their normal position at the end of the list and show no chip.
- Dashboard: the existing "soonest gathering" highlight also picks up the distance chip when a fix exists. No new dashboard section.

Distance computation is fully client-side haversine — no geocoding per gathering:
- `gatherings.lat/lng` are already populated for saved-location gatherings.
- Venue-hosted gatherings currently store no lat/lng, but `businesses.lat/lng` are readable (verified: `anon`/`authenticated` hold SELECT on those columns), so the Explore query's existing `business:businesses(...)` join adds `lat,lng` and the card falls back to venue coordinates.

Degradation: if permission is denied/unavailable, the toggle stays off (with a one-time toast), no chips render, and the feed is exactly today's city-filtered, time-sorted view. The toggle itself is hidden entirely when `navigator.geolocation` is absent.

## Technical notes

- New: `src/lib/geolocation.ts` (`useDeviceLocation` hook, `haversineKm`, `formatDistance`, permission-state probe), `src/components/use-my-location-button.tsx`, `src/components/distance-chip.tsx`.
- Edited: `location-map-picker.tsx` (button + center order), `explore.tsx` (Near-me toggle, distance sort), `gathering-card.tsx` (optional `distanceKm` prop → chip), `lib/gatherings.ts` (select `lat,lng` on gatherings and on the business join; add them to `GatheringCard`), `dashboard.tsx` (chip on the highlighted gathering), i18n keys for EN/TR/FA.
- No database migration, no schema change, no change to city filtering, join rules, or gathering creation logic.
- `Permissions-Policy: geolocation=(self)` is already set in `src/server.ts`, so the browser API is allowed on our own origin.

## Graceful-failure confirmation

| Feature | No permission / no support |
| --- | --- |
| Use my location button | Toast once, button back to idle; typing and pin-dropping unchanged |
| Map default center | Silently falls through to profile city, then Istanbul |
| Nearby gatherings | Toggle hidden (no support) or stays off (denied); Explore renders today's city view with no chips |
