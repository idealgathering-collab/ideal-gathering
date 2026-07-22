## Map-based location picker

Replace the text-only Nominatim autocomplete used when adding a new location (both the "+ Add new location" flow inside Host → Create gathering and the venue business-registration form) with a Leaflet map picker, and capture two extra fields.

### 1. Dependencies

- Add `leaflet` and `react-leaflet` via `bun add` (plus `@types/leaflet`).
- Load Leaflet CSS through a `<link>` tag in `src/routes/__root.tsx` head() (Tailwind v4 rule — no remote `@import` in `styles.css`).
- Leaflet touches `window` at import time, so the map component is dynamically imported behind `<ClientOnly>` + `React.lazy` (per project's TanStack execution rules).

### 2. New shared component — `src/components/location-map-picker.tsx`

A self-contained picker used inside both dialogs. Props: `value`, `onChange(LocationValue & { street_number, description })`, `countryCode`, `defaultCenter`.

Contents:
- Top: the existing `LocationAutocomplete` (search) — selecting a result recenters the map and drops the pin.
- Middle: a Leaflet map (~320px tall). Default center Istanbul (41.0082, 28.9784), zoom 12. Clicking the map moves the pin; the pin is also draggable.
- On pin move: debounced reverse-geocode via `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=&lon=&addressdetails=1` (same 1.1s rate-limit helper from `location-autocomplete.tsx` — extract it to `src/lib/nominatim.ts`).
- Auto-fills the read-only "Address" line from the reverse result (`display_name` + parsed city).
- Two additional required inputs rendered below the map:
  - Street / house number (`street_number`, text, maxLength 80)
  - Description (`description`, textarea, maxLength 200, e.g. "3rd floor, blue door")
- Emits a single `LocationValue` extended with `street_number` and `description`.

Ambient state, styling, and RTL logical-property classes follow existing conventions.

### 3. Wire the picker into existing dialogs

- `src/components/saved-location-dialog.tsx`: replace the inline `LocationAutocomplete` with `LocationMapPicker`. Require `street_number` + `description` before enabling submit. Insert both new columns into `saved_locations`.
- `src/routes/venue.dashboard.tsx` (business registration form): same swap. Persist both new columns into `businesses`.

The existing pending → admin approval flow is untouched.

### 4. Database migration

Add nullable-for-back-compat, NOT NULL going forward via default `''`:

```sql
ALTER TABLE public.saved_locations
  ADD COLUMN street_number text NOT NULL DEFAULT '',
  ADD COLUMN description   text NOT NULL DEFAULT '';

ALTER TABLE public.businesses
  ADD COLUMN street_number text NOT NULL DEFAULT '',
  ADD COLUMN description   text NOT NULL DEFAULT '';
```

No RLS/policy changes; the columns inherit existing per-table policies. Grants unchanged.

### 5. Localization

New keys in `src/i18n/translations.ts` (en/tr/fa), reusing the `savedLoc.*` and `venue.*` namespaces already in the file:

- `savedLoc.streetNumber`, `savedLoc.streetNumberPh`
- `savedLoc.description`, `savedLoc.descriptionPh`
- `savedLoc.pinHint` ("Tap the map or drag the pin to your exact spot")
- `venue.streetNumber`, `venue.description` (mirror for the business form)

### 6. Explicit non-goals

- Landing page / round table redesign untouched.
- Approval logic, gathering room, dashboards, auth flows untouched.
- No paid map provider; still OSM tiles + Nominatim.
- Existing `lat`, `lng`, `address`, `city`, `neighborhood` fields keep their current meaning and storage.

### Technical notes

- Leaflet default marker icons break under Vite; the picker sets `L.Icon.Default.mergeOptions` with the CDN URLs (or imports the icon PNGs) inside a client-only effect.
- Reverse-geocode call is client-side only (browser), same as the existing forward search — no server function needed.
- `prefers-reduced-motion` respected: no fly-to animation, use `map.setView` without animation when set.
