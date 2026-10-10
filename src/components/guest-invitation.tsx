import { useEffect, useState } from "react";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { guestToken, guestErrorKey, requestGuestInvitation, type GuestDetails } from "@/lib/guest-invitations";
import { rsvpResponse } from "@/lib/private-gatherings";
import { GuestCoordination } from "@/components/guest-coordination";

export function GuestInvitation() {
  const { t, lang, setLang } = useI18n();
  const [token, setToken] = useState<string | null>(null);
  const [adult, setAdult] = useState(false);
  const [details, setDetails] = useState<GuestDetails | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const parsed = guestToken.safeParse(window.location.hash.slice(1));
    setToken(parsed.success ? parsed.data : null);
    // Keep the capability only in component memory. Reopen the original link
    // after a refresh; do not leave it in history or analytics-visible URLs.
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    if (!parsed.success) setError("guest.unavailable");
  }, []);
  async function submit(response?: "going" | "maybe" | "declined") {
    if (!token || !adult || busy) return;
    setBusy(true); setError(""); setSaved(false);
    try {
      const result = await requestGuestInvitation({ token, adult: true, ...(response ? { response, name } : {}) });
      setDetails(result); setName(result.guest_name ?? name); setSaved(Boolean(response));
    } catch (e) {
      const code = e instanceof Error ? e.message : "failed";
      setError(guestErrorKey(code));
      if (code === "unavailable") setDetails(null);
    } finally { setBusy(false); }
  }
  return <main className="mx-auto grid min-h-[85svh] max-w-md content-start gap-5 px-4 py-8" dir={lang === "fa" ? "rtl" : "ltr"}>
    <header className="flex items-center justify-between gap-3">
      <span className="font-display text-2xl">{t("guest.brand")}</span>
      <Button variant="outline" className="min-h-11" onClick={() => setLang(lang === "fa" ? "en" : "fa")}>{lang === "fa" ? "English" : "فارسی"}</Button>
    </header>
    <section className="grid gap-4 rounded-2xl border border-border bg-card p-5">
      <h1 className="break-words font-display text-2xl">{details?.subject ?? t("guest.title")}</h1>
      {!details ? <>
        <p>{t("guest.intro")}</p>
        <label className="flex items-start gap-3 rounded-xl border border-border p-3">
          <input type="checkbox" className="mt-1 size-5 shrink-0" checked={adult} disabled={busy} onChange={(e) => setAdult(e.target.checked)} />
          <span>{t("guest.adult")}</span>
        </label>
        <Button className="min-h-12 rounded-full" disabled={!adult || !token || busy} onClick={() => void submit()}>{t("guest.open")}</Button>
      </> : <>
        <time dateTime={details.starts_at}>{new Date(details.starts_at).toLocaleString(lang === "fa" ? "fa-IR" : "en", { dateStyle: "medium", timeStyle: "short" })}</time>
        <p className="break-words whitespace-pre-wrap">{details.venue_name}</p>
        {details.address && <p className="break-words whitespace-pre-wrap">{details.address}</p>}
        {details.description && <p className="break-words whitespace-pre-wrap">{details.description}</p>}
        <p className="text-sm text-muted-foreground">{t("guest.expires")} {new Date(details.expires_at).toLocaleString(lang === "fa" ? "fa-IR" : "en")}</p>
        <Label htmlFor="guest-name">{t("guest.name")}</Label>
        <Input id="guest-name" value={name} maxLength={80} autoComplete="given-name" disabled={busy} onChange={(e) => setName(e.target.value)} />
        <p role="status">{t(details.response === "invited" ? "private.invitedState" : `private.${details.response}`)}</p>
        <div className="grid gap-2">{rsvpResponse.options.map((response) => <Button key={response} className="min-h-12 rounded-full" variant={details.response === response ? "default" : "outline"} aria-pressed={details.response === response} disabled={busy || !name.trim()} onClick={() => void submit(response)}>{t(`private.${response}`)}</Button>)}</div>
        {saved && <p role="status">{t("private.saved")}</p>}
      </>}
      {busy && <p role="status">{t("common.loading")}</p>}
      {error && <p role="alert">{t(error)}</p>}
    </section>
    {token && details?.response === "going" && <GuestCoordination token={token} onUnavailable={() => { setDetails(null); setError("guest.unavailable"); }} />}
    <p className="text-sm text-muted-foreground">{t("guest.boundary")}</p>
  </main>;
}
