## Fix 1: Misleading owner approval copy (gathering detail)

In `src/routes/gatherings.$id.tsx`, the proposed-status message currently branches on `isOwner` to show `t("gd.approveFromDashboard")`. Since approval is admin-only and the venue dashboard has no approval UI, collapse both branches to `t("gd.waitingApproval")` and drop the now-unused `gd.approveFromDashboard` key from `en`/`tr`/`fa` in `src/i18n/translations.ts`.

## Fix 2: Rejected status renders wrong copy

**`src/routes/gatherings.$id.tsx`** — the message block:
```
g.status === "proposed" ? (...) : t("gd.cancelledMsg")
```
Add a `rejected` branch before the cancelled fallback, using a new key `gd.rejectedMsg` (clearer than reusing the short badge label `gd.status.rejected`). Add strings in en/tr/fa, e.g. EN: "This gathering was rejected by an admin."

**`src/routes/_authenticated/dashboard.tsx`** — `statusLabel()` only handles approved/proposed/cancelled. Add a `rejected` branch returning a new key `dash.status.rejected`. Add strings in en/tr/fa (EN: "Rejected").

## Files touched

- `src/routes/gatherings.$id.tsx` — collapse owner branch; add rejected branch
- `src/routes/_authenticated/dashboard.tsx` — add rejected case in `statusLabel`
- `src/i18n/translations.ts` — remove `gd.approveFromDashboard`; add `gd.rejectedMsg` and `dash.status.rejected` in en/tr/fa

No schema or logic changes; presentation-only.
