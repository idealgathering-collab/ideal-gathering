# Pre-Launch Basics: Account, Legal, Moderation

Ship four things needed before real users: password reset, profile + account deletion, admin moderation, and legal pages.

## 1. Password Reset

- **`src/routes/auth.tsx`**: add "Forgot password?" link under the password field. Toggle a small inline form (or third mode alongside signin/signup) that takes an email and calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: ${origin}/reset-password })`. Toast success.
- **`src/routes/reset-password.tsx`** (new, public route): on mount, listen for `PASSWORD_RECOVERY` via `onAuthStateChange` (Supabase sets the recovery session from the URL hash automatically). Render "new password" + "confirm password" form → `supabase.auth.updateUser({ password })`. On success, sign out and navigate to `/auth`.

## 2. Profile + Account Deletion

**Migration:**
- `ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT`.
- Create Storage bucket `avatars` (public read) via `supabase--storage_create_bucket`.
- RLS on `storage.objects` for `avatars`: authenticated users can INSERT/UPDATE/DELETE only objects whose path starts with `<their-uid>/`; SELECT open to all (bucket is public).

**Route `src/routes/_authenticated/profile.tsx` (new):**
- Load current profile (display_name, avatar_url).
- Edit display_name → update `profiles`.
- Avatar upload: file input → upload to `avatars/${user.id}/avatar.<ext>` with `upsert: true` → store public URL in `profiles.avatar_url`.
- "Delete my account" button → confirmation dialog (type email or "DELETE" to confirm) → call edge function `delete-own-account` → on success, `signOut` + navigate `/`.
- Link from `site-header.tsx` account area.

**Edge function `supabase/functions/delete-own-account/index.ts` (new):**
- Verify caller JWT via `supabase.auth.getUser(token)` with the anon client.
- Then use service-role admin client to `supabase.auth.admin.deleteUser(user.id)`.
- `profiles` / `user_roles` / `gatherings` (host_id) / `gathering_attendees` cascade via existing FKs — confirm and add `ON DELETE CASCADE` where missing in the migration.

## 3. Admin Moderation

**Route `src/routes/_authenticated/admin.tsx` (new):**
- On load, check `private.has_role(auth.uid(), 'admin')` via an RPC or a `user_roles` select; if false, show 403 and link home.
- One tab: **Gatherings**, split into **Pending** (`status='proposed'`) and **Live** (`status='approved'`) lists.
- Each pending row: topic, host, venue, time, seats + **Approve** / **Reject** buttons updating `status` to `approved` / `rejected` (relies on the existing admin UPDATE policy from Phase 1).
- Live tab: shows approved gatherings with a **Cancel** action (status → `cancelled`).
- Link to `/admin` from `site-header.tsx` only when the current user has the admin role.

## 4. Legal Pages + Consent

**Routes (new, public):**
- `src/routes/privacy.tsx` — plain language: what we collect (email, display name, avatar, gatherings joined, waitlist interests), why (running the service), retention, deletion rights (link to profile delete), KVKK note for Türkiye users + contact email.
- `src/routes/terms.tsx` — plain-language ToS: acceptable use, no harassment, venues/hosts responsibilities, liability disclaimer, governing law.

**Wiring:**
- Update `site-footer.tsx` legal column to route to `/privacy` and `/terms` (currently `#privacy`/`#terms`).
- Update `src/routes/auth.tsx` signup mode: required checkbox "I agree to the [Privacy Policy](/privacy) and [Terms](/terms)". Block submit until checked.
- Update `src/routes/waitlist.tsx` with the same required consent checkbox.

## 5. i18n

Add EN/TR strings to `src/i18n/translations.ts` for every new UI label: forgot password, reset password form, profile page (display name, avatar, delete account, confirm dialog), admin (tabs, approve/reject/cancel, empty states, 403), privacy/terms bodies (short headings + intro; long legal copy can live inline in English + Turkish sections), consent checkbox.

## Technical Notes

- Password reset page is public — do NOT put under `_authenticated/`.
- Delete-account edge function needs `verify_jwt = false` in `supabase/config.toml` (we verify manually) OR keep default JWT verification and read `req.headers.authorization`. Prefer default JWT verification for simplicity.
- Storage bucket path convention `${uid}/avatar.<ext>` lets a single RLS policy `(storage.foldername(name))[1] = auth.uid()::text` cover write/update/delete.
- Admin route: use `supabase.rpc('has_role', { _user_id, _role: 'admin' })` if exposed, otherwise query `user_roles` directly (RLS allows self-read).
- Legal copy will be a first draft — user should review before launch.

## Out of Scope

- Email templates customization (using default Supabase reset email).
- Full KVKK compliance audit (page is informational, not legal advice).
- Audit log of admin actions.
- Bulk moderation tools.
