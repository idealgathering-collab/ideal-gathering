import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/i18n";
import { createGuestInvitation, manageGuestInvitations } from "@/lib/guest-invitations.functions";
import { guestErrorKey } from "@/lib/guest-invitations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function HostGuestInvitations({ gatheringId, userId, open }: { gatheringId: string; userId: string; open: boolean }) {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const [label, setLabel] = useState("");
  const [days, setDays] = useState<1 | 3 | 7>(3);
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const query = useQuery({ queryKey: ["guest-invitations",userId,gatheringId], queryFn: () => manageGuestInvitations({ data: { id: gatheringId, action: "list" } }) });
  async function mutate(action: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true); setError("");
    try { await action(); await Promise.all([
      qc.invalidateQueries({ queryKey: ["guest-invitations",userId,gatheringId] }),
      qc.invalidateQueries({ queryKey: ["gathering",gatheringId] }),
      qc.invalidateQueries({ queryKey: ["my-gatherings",userId] }),
    ]); }
    catch (e) { setError(e instanceof Error && e.message === "limited" ? "guest.hostLimited" : guestErrorKey("failed")); }
    finally { setBusy(false); }
  }
  const guestSeats = query.data?.filter((r) => r.response === "going" && !r.revoked_at && new Date(r.expires_at).getTime() > Date.now()).length;
  return <section className="mt-4 grid gap-3 rounded-2xl border border-border bg-card p-4" aria-label={t("guest.hostTitle")}>
    <h2 className="font-display text-xl">{t("guest.hostTitle")}</h2>
    <Button variant="outline" className="min-h-11 justify-self-start" disabled={query.isFetching || busy} onClick={() => void mutate(() => query.refetch())}>{t("guest.refresh")}</Button>
    <p className="text-sm text-muted-foreground">{t("guest.hostHint")}</p>
    <form className="grid gap-2" onSubmit={(e) => {
      e.preventDefault();
      void mutate(async () => {
        setLink(""); setCopied(false);
        const result = await createGuestInvitation({ data: { id: gatheringId, label, days } });
        setLink(`${window.location.origin}/guest-invite#${result.token}`); setLabel("");
      });
    }}>
      <Label htmlFor="guest-label">{t("guest.label")}</Label>
      <Input id="guest-label" required maxLength={80} value={label} disabled={busy || !open} onChange={(e) => setLabel(e.target.value)} />
      <Label htmlFor="guest-expiry">{t("guest.expiryLabel")}</Label>
      <select id="guest-expiry" className="min-h-11 rounded-md border border-input bg-background px-3" value={days} disabled={busy || !open} onChange={(e) => setDays(Number(e.target.value) as 1 | 3 | 7)}>
        {[1,3,7].map((d) => <option key={d} value={d}>{t(`guest.days${d}`)}</option>)}
      </select>
      <Button className="min-h-11 rounded-full" disabled={busy || !open}>{t("guest.create")}</Button>
    </form>
    {link && <div className="grid gap-2 rounded-xl border border-border p-3">
      <p>{t("guest.once")}</p>
      <Label htmlFor="guest-link">{t("guest.link")}</Label>
      <Input id="guest-link" readOnly dir="ltr" value={link} onFocus={(e) => e.target.select()} />
      <Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(link); setCopied(true); } catch { setError("guest.copyFailed"); } }}>{t("guest.copy")}</Button>
      {copied && <p role="status">{t("guest.copied")}</p>}
    </div>}
    {error && <p role="alert">{t(error)}</p>}
    {query.isPending && <p role="status">{t("common.loading")}</p>}
    {query.isError && <div role="alert"><p>{t("private.loadFailed")}</p><Button variant="outline" onClick={() => query.refetch()}>{t("private.retry")}</Button></div>}
    {query.data && <p>{t("guest.seats",{ count: guestSeats ?? 0 })}</p>}
    {query.data?.map((row) => {
      const expired = new Date(row.expires_at).getTime() <= Date.now();
      return <div key={row.id} className="grid gap-2 border-t border-border py-3">
        <p className="break-words">{row.label}{row.guest_name ? ` · ${row.guest_name}` : ""}</p>
        <p>{t(row.revoked_at ? "private.revoked" : expired ? "guest.expired" : row.response === "invited" ? "private.invitedState" : `private.${row.response}`)}</p>
        <p className="text-sm text-muted-foreground">{t("guest.expires")} {new Date(row.expires_at).toLocaleString(lang === "fa" ? "fa-IR" : "en")}</p>
        {!row.revoked_at && <Button variant="outline" disabled={busy} onClick={() => void mutate(async () => { await manageGuestInvitations({ data: { id: gatheringId, action: "revoke", invitation: row.id } }); setLink(""); })}>{t("private.revoke")}</Button>}
      </div>;
    })}
  </section>;
}
