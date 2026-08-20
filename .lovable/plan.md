# Scope Explore to the viewer's city

Goal: stop mixing every market into one feed. Explore shows one city at a time, with a visible, changeable "Browsing: <city>" control. Browsing/filtering only — join/leave and seat-capacity logic stay untouched.

## 1. Where city lives today (verified)

- `gatherings` already has its own `city` column (plus `address`, `lat`, `lng`).
- Saved-location gatherings: the create form copies `city` from the chosen `saved_locations` row into `gatherings.city`. `saved_locations.city` is nullable, so it can be blank.
- Venue-linked gatherings: the create form sets `business_id`, `venue_name`, and `neighborhood` (from the business city) but **leaves `gatherings.city` NULL** — city is only reachable through the `businesses` join.
- So there is a real gap for one type: venue gatherings have no own-row city. Today the `gatherings` table has 0 rows, so a backfill costs nothing.

## 2. Fix the source of truth: one canonical city per gathering

Rather than filtering through a join (which forces PostgREST to use `businesses!inner(...)`, breaks nicely on nullable joins, and can't be indexed well), make `gatherings.city` authoritative for every gathering type:

- New DB trigger `set_gathering_city` (BEFORE INSERT OR UPDATE on `gatherings`): if `business_id` is set, copy `businesses.city` into `NEW.city`; otherwise keep the city supplied by the client (saved location). This keeps the column correct even if a client forgets to send it.
- One-time backfill `UPDATE gatherings SET city = b.city ... WHERE business_id IS NOT NULL` (currently a no-op, but correct going forward).
- Index: `CREATE INDEX ON gatherings (city, starts_at) WHERE status = 'approved'` for the Explore query.
- Create form: also send `city: p.bizCity` on the venue branch, so the value is right before the trigger even fires.

Tradeoff: a denormalized column can drift if a venue later edits its city — the trigger only fires on gathering writes. Accepted for now; the venue city rarely changes, and a follow-up trigger on `businesses` could propagate it if that ever matters.

## 3. Filtering behaviour

- **Signed in with a profile city:** default to that city. Header of the list shows `Browsing: İstanbul · Change`, opening a dropdown of cities that actually have upcoming approved gatherings, plus "All cities".
- **Signed in without a profile city / signed out:** default to **All cities**, with the same control inviting a choice. No forced modal, no silent hiding.
- Chosen city is reflected in the URL (`/explore?city=Tehran`) so it is shareable and survives reloads; `city=all` for the unscoped view. URL wins over profile default when present.
- Empty state per city: "No tables in <city> yet" with a link to create one and a "browse all cities" escape hatch.

## 4. Query changes

- `fetchApprovedGatherings(city?: string | null)` — same query, plus `.eq("city", city)` when a city is given, `.ilike` not needed since cities come from the shared catalogue/dropdown. Query key becomes `["gatherings", "approved", city]`.
- New `fetchGatheringCities()` — distinct non-null `city` values from approved, upcoming gatherings, used to populate the switcher.
- `fetchGathering()` — no filtering change; it just also selects `city` so the detail page can show it and link back to that city's Explore.

## Components touched

- `src/lib/gatherings.ts` — optional city param, city list fetcher, `city` in the card type.
- `src/routes/explore.tsx` — `city` search param, resolved default from profile, `CityFilter` control, per-city empty state.
- `src/components/city-filter.tsx` (new) — the "Browsing: X · Change" pill + dropdown.
- `src/components/gathering-card.tsx` — show city when browsing All cities.
- `src/routes/_authenticated/create-gathering.tsx` — send `city` on the venue branch.
- `src/i18n/translations.ts` — EN/TR/FA keys for browsing/change/all cities/empty-in-city.

## Migration needed

Yes, one small migration: the `set_gathering_city` trigger + function, the backfill update, and the partial index. No new tables, no RLS changes.
