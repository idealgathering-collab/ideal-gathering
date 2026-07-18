# Three contained fixes

## 1. Remove `/waitlist` link from `/auth`

**File:** `src/routes/auth.tsx` (line ~240)
- Remove the guest hint block containing `<Link to="/waitlist">` and its `t("auth.guestLink")` label. Also remove the surrounding sentence copy if the link was the whole point of the line.

**Site-wide audit (verified via ripgrep):**
- The only in-app `/waitlist` link outside `src/routes/waitlist.tsx` and the auto-generated route tree is the one in `auth.tsx`. Nav (`site-header.tsx`), footer, homepage, and venue pages are already clean — a prior turn repointed everything else to `/auth`.
- **Orphan i18n keys** that will no longer be referenced anywhere after this change: `auth.guestLink`, `home.hero.joinWaitlist`, `home.two.guests.cta` (EN + TR). I'll delete those six lines from `src/i18n/translations.ts` to keep the file honest. The `wait.*` keys stay — they're still used by the dormant `/waitlist` route itself, which per your instruction is untouched.

## 2. Remove profile cover photo everywhere

Scope note: `cover_url` also exists on the `businesses` table (venue cover) and is used by `venue.dashboard.tsx`, `businesses.$id.tsx`, `gathering-card.tsx`, `gatherings.$id.tsx`, `lib/gatherings.ts`. That is a **different column on a different table** and is out of scope — only `profiles.cover_url` is being removed.

**`src/routes/_authenticated/profile.tsx`:**
- Remove `coverPath`, `coverUrl` state.
- Remove `cover_url` from the profiles `.select(...)` and from the `setCoverPath` / `setCoverUrl` lines in the loader.
- Remove the `onCoverChange` handler and the storage upload + `.update({ cover_url })` call.
- Remove the cover `<img>` banner block and its upload button in the JSX.
- Keep the avatar upload flow untouched.

**`src/routes/_authenticated/admin.tsx` (UserDetail):**
- Remove `coverUrl` state, the `if (u?.cover_url) { ... createSignedUrl(...) }` block inside `runGet`, and the `h-40` cover banner `<div>` that renders `coverUrl`.
- The `AdminUserDetail` type comes from `src/lib/admin.functions.ts`; I'll also drop `cover_url` from that type and from the profiles `.select(...)` in `getAdminUser` so nothing on the server side still returns it.

**DB decision — non-destructive:**
- Keep the `profiles.cover_url` column. Reason: dropping it would require a migration that also churns the auto-generated `src/integrations/supabase/types.ts` (3 references) with no user-visible benefit, and there's no PII risk in leaving an unread nullable column. New writes stop; existing values simply become inert. I'll call this out in the ship note. If you'd rather drop the column outright, say so and I'll add the migration.

## 3. Fix broken admin Gatherings tab

**File:** `src/lib/admin.functions.ts` → `listPendingGatherings`
- Root cause is as you described: `host:profiles!gatherings_host_id_fkey(display_name)` embed fails because that FK targets `auth.users`, not `profiles`, so PostgREST can't resolve the relationship and the whole query errors out.
- Fix: remove the `host:profiles!...` embed from the `.select(...)`. After the gatherings query returns, collect `host_id`s, run a second `supabaseAdmin.from("profiles").select("id, display_name").in("id", ids)` fetch, build a `Map<string, string | null>`, and set `host_name` from that map when mapping the rows. Mirrors the pattern already used by `listAdminUsers` in the same file.
- No FK, schema, or RLS changes. Return shape (`PendingGatheringRow`) stays identical, so `admin.tsx` needs no changes.

## Risks / sequencing

- All three fixes are independent — one turn, parallel edits.
- Item 2's non-destructive choice means `types.ts` still lists `cover_url` on `profiles`. That's fine; nothing reads it.
- Please confirm the "keep the column" choice for item 2 before I implement, or say "drop it" and I'll add the migration instead.
