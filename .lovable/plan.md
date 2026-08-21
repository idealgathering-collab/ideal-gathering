# Armenia locations + age & nationality on profile

Two scoped additions: static location data for Armenia, and two new optional profile fields (date of birth, nationality).

## 1. Armenia in location dropdowns

Static-data-only edit to `src/lib/locations.ts`, no UI changes — the existing country/city/neighborhood dropdowns pick it up automatically.

- `COUNTRIES`: add `{ code: "AM", name: "Armenia" }` placed first (launch market), before Türkiye.
- `CITIES_BY_COUNTRY.AM`: Yerevan, Gyumri, Vanadzor, Vagharshapat (Etchmiadzin), Hrazdan, Abovyan, Kapan, Armavir, Gavar, Artashat, Ijevan, Charentsavan, Sevan, Dilijan, Goris, Alaverdi.
- `NEIGHBORHOODS_BY_CITY.Yerevan`: the 12 administrative districts — Kentron, Arabkir, Ajapnyak, Avan, Davtashen, Erebuni, Kanaker-Zeytun, Malatia-Sebastia, Nor Nork, Nork-Marash, Nubarashen, Shengavit — plus the widely used sub-areas Cascade and Kond.

Cities not listed keep the existing free-text fallback.

## 2. Age (date of birth) and nationality on profile

### Migration

```sql
ALTER TABLE public.profiles
  ADD COLUMN date_of_birth date,
  ADD COLUMN nationality text;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_dob_min_age_18
  CHECK (
    date_of_birth IS NULL
    OR date_of_birth <= (CURRENT_DATE - INTERVAL '18 years')::date
  );

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_dob_sane
  CHECK (date_of_birth IS NULL OR date_of_birth >= DATE '1900-01-01');

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_nationality_len
  CHECK (nationality IS NULL OR char_length(nationality) BETWEEN 2 AND 2);
```

Note on the 18+ check: `CURRENT_DATE` is not immutable-safe for some constraint contexts, so the age rule is enforced by a `BEFORE INSERT OR UPDATE` trigger instead of a CHECK, matching the project convention of using triggers for time-dependent rules:

```sql
CREATE OR REPLACE FUNCTION public.enforce_profile_min_age()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.date_of_birth IS NOT NULL
     AND NEW.date_of_birth > (CURRENT_DATE - INTERVAL '18 years')::date THEN
    RAISE EXCEPTION 'MIN_AGE_18';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER profiles_min_age
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_min_age();
```

So the migration keeps only the sane-range and nationality-length CHECKs, and the trigger handles 18+.

No new grants needed: `profiles` already grants SELECT/INSERT/UPDATE to `authenticated` and ALL to `service_role`, and grants are table-level.

### Visibility / RLS

Confirmed by inspecting current policies: `profiles` has exactly three policies — "Users manage own profile" (`auth.uid() = id`, ALL), "Admins read all profiles", "Admins update any profile". These are row-level, so new columns inherit the same owner+admin-only visibility with no policy change required. There is no public profiles view or public read function exposing raw profile columns, so date of birth and nationality are not leaked anywhere. Nothing to adjust.

### Nationality country list — decision

Two options:
- Reuse `COUNTRIES` from `locations.ts` (10 entries after Armenia). Zero new code, but it is a residence-market list; a user from Georgia, India, or Russia would have no correct option.
- Add a separate full ISO-3166 country list.

**Recommendation: add a separate full ISO list** in a new `src/lib/countries.ts` (~195 entries, code + English name, no dependency), and keep `COUNTRIES` as the residence/market list. Nationality is genuinely global and a 10-item list would force wrong answers. The nationality select renders that list, sorted alphabetically, storing the ISO alpha-2 code (hence the 2-char CHECK). A small `nationalityName(code)` helper mirrors the existing `countryName()` helper.

### Where the fields land in `profile.tsx`

Inside the existing "About" card (`section` with `t("profile.about")`), in the `grid gap-4` right after the Display name field and before Bio:

```text
About
├── Display name        (existing)
├── [NEW] Date of birth | Nationality   ← 2-col grid on sm+, stacked on mobile
├── Bio                 (existing)
└── Location box        (existing)
```

- **Date of birth**: native `<Input type="date">` (consistent with existing shadcn inputs, no new dependency), `max` attribute set to today-minus-18-years so the browser blocks under-18 picks. Below it, a muted line showing the derived age (`Age 31`) when a valid date is set. Client-side guard in `saveProfile` shows a localized error if under 18 or invalid, before hitting the DB.
- **Nationality**: shadcn `Select` over the full ISO list, with a "Prefer not to say" clear option (sets `null`).
- Both are optional, editable like bio, saved by the same existing Save button — no onboarding gating, no required-field behavior.

### Other touchpoints

- Load the two columns in the existing profile `select` and include them in the existing `update` payload.
- New i18n keys in `src/i18n/translations.ts` for EN, TR, FA: `profile.dob`, `profile.dobHint`, `profile.age`, `profile.minAge` (error), `profile.nationality`, `profile.selectNationality`, `profile.nationalityNone`.
- `src/integrations/supabase/types.ts` regenerates from the migration.

Out of scope: showing age/nationality on the profile header, in gathering rosters, or anywhere public.
