## Feature 1: Add to calendar (.ics)

- New helper `buildIcsFile(g)` inside `src/routes/gatherings.$id.tsx` (small enough not to warrant a shared lib module): builds an ICS string with `BEGIN:VCALENDAR` / `VEVENT`, `UID` from `g.id` + host domain, `DTSTAMP` (now, UTC), `DTSTART`/`DTEND` from `g.starts_at`/`g.ends_at` formatted as `YYYYMMDDTHHMMSSZ` (UTC), `SUMMARY` = `g.subject`, `LOCATION` = `${venue name} — ${city or neighborhood}` when present, `DESCRIPTION` = `g.description` with CRLF line endings, and text-field escaping (`\`, `,`, `;`, newlines) plus 75-octet line folding.
- Trigger download: create a `Blob` (`text/calendar;charset=utf-8`), `URL.createObjectURL`, click a hidden `<a download>`, revoke the URL. No new deps.
- If `g.ends_at` is missing, fall back to `starts_at + 2h`.
- Button placement: inside the existing `mt-6 flex flex-wrap gap-3` action row, gated by `isMember` (host or attending), for `status === "approved"` only. Uses `CalendarPlus` from lucide, `variant="outline"`, `rounded-full`.

## Feature 2: Share / copy link

- Handler `share()`:
  - `url = window.location.href`
  - If `navigator.share` exists, call `navigator.share({ title: g.subject, text: g.description ?? "", url })` inside try/catch — swallow `AbortError` silently; on any other failure fall back to clipboard.
  - Fallback: `navigator.clipboard.writeText(url)` then `toast.success(t("gd.linkCopied"))`.
- Button visible to everyone (no auth gate), placed in the same action row. Uses `Share2` icon, `variant="outline"`, `rounded-full`.

## i18n keys added (en / tr / fa) in `src/i18n/translations.ts`

- `gd.addToCalendar` — "Add to calendar" / "Takvime ekle" / "افزودن به تقویم"
- `gd.share` — "Share" / "Paylaş" / "اشتراک‌گذاری"
- `gd.linkCopied` — "Link copied to clipboard" / "Bağlantı panoya kopyalandı" / "پیوند در کلیپ‌بورد کپی شد"

## Files touched

- `src/routes/gatherings.$id.tsx` — add helper, handler, two buttons, new lucide imports
- `src/i18n/translations.ts` — three keys × three languages

No schema, no new deps, no route changes.
