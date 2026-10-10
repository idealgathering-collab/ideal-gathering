import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/i18n";
import { privateGatheringError, rsvpResponse } from "@/lib/private-gatherings";
import { HostGuestInvitations } from "@/components/host-guest-invitations";

export function PrivateGatheringInvitations({ gatheringId, userId, isHost, open }: {
  gatheringId: string; userId: string; isHost: boolean; open: boolean;
}) {
  const t = useT();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const query = useQuery({
    queryKey: ["gathering-invitations", userId, gatheringId],
    queryFn: async () => {
      const { data, error } = await supabase.from("gathering_invitations")
        .select("recipient_id,response,revoked_at").eq("gathering_id", gatheringId).order("created_at");
      if (error) throw error;
      const rows = data ?? [];
      const { getPublicProfiles } = await import("@/lib/public-data.functions");
      const profiles = isHost && rows.length ? await getPublicProfiles({ data: { ids: rows.map((r) => r.recipient_id) } }) : [];
      return rows.map((r) => ({ ...r, name: profiles.find((p) => p.id === r.recipient_id)?.display_name ?? t("private.guest") }));
    },
  });
  const own = query.data?.find((r) => r.recipient_id === userId && !r.revoked_at);
  async function mutate(action: () => PromiseLike<{ error: unknown }>, message: string) {
    if (busy) return;
    setBusy(true);
    try {
      const { error } = await action();
      if (error) throw error;
      toast.success(t(message));
      setEmail("");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["gathering-invitations"] }),
        qc.invalidateQueries({ queryKey: ["private-inbox"] }),
        qc.invalidateQueries({ queryKey: ["gathering", gatheringId] }),
        qc.invalidateQueries({ queryKey: ["my-gatherings"] }),
      ]);
    } catch (error) { toast.error(t(privateGatheringError(error))); }
    finally { setBusy(false); }
  }
  return <><section className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-4" aria-label={t("private.responses")}>
    <h2 className="font-display text-xl">{t("private.responses")}</h2>
    {query.isPending && <p role="status">{t("common.loading")}</p>}
    {query.isError && <div role="alert"><p>{t("private.loadFailed")}</p><Button variant="outline" onClick={() => query.refetch()}>{t("private.retry")}</Button></div>}
    {isHost && <form className="grid gap-2" onSubmit={(event) => {
      event.preventDefault();
      void mutate(() => supabase.rpc("invite_gathering_member", { _id: gatheringId, _email: email.trim() }), "private.invited");
    }}>
      <Label htmlFor="gathering-invite-email">{t("private.email")}</Label>
      <Input id="gathering-invite-email" type="email" dir="ltr" autoComplete="off" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy || !open} />
      <p className="text-sm text-muted-foreground">{t("private.inviteHint")}</p>
      <Button type="submit" disabled={busy || !open} className="min-h-11 justify-self-start rounded-full">{t("private.invite")}</Button>
    </form>}
    {!query.isPending && !query.isError && !query.data?.length && <p>{t("private.empty")}</p>}
    {isHost && query.data?.map((row) => <div key={row.recipient_id} className="flex flex-wrap items-center justify-between gap-2 border-t border-border py-2">
      <span className="break-words">{row.name} · {t(row.revoked_at ? "private.revoked" : row.response === "invited" ? "private.invitedState" : `private.${row.response}`)}</span>
      {!row.revoked_at && <Button variant="outline" disabled={busy} onClick={() => void mutate(() => supabase.rpc("revoke_gathering_invitation", { _id: gatheringId, _recipient: row.recipient_id }), "private.saved")}>{t("private.revoke")}</Button>}
    </div>)}
    {own && !isHost && <>
      <p role="status">{t(own.response === "invited" ? "private.invitedState" : `private.${own.response}`)}</p>
      <div className="flex flex-wrap gap-2">{rsvpResponse.options.map((response) => <Button key={response} variant={own.response === response ? "default" : "outline"} aria-pressed={own.response === response} disabled={busy || !open} onClick={() => void mutate(() => supabase.rpc("respond_gathering_invitation", { _id: gatheringId, _response: response }), "private.saved")}>{t(`private.${response}`)}</Button>)}</div>
    </>}
  </section>{isHost && <HostGuestInvitations gatheringId={gatheringId} userId={userId} open={open} />}</>;
}

export function PrivateGatheringInbox({ userId }: { userId: string }) {
  const t = useT();
  const query = useQuery({
    queryKey: ["private-inbox", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("gathering_invitations")
        .select("gathering_id,response,gathering:gatherings!inner(subject,starts_at)")
        .eq("recipient_id", userId).is("revoked_at", null).order("created_at", { ascending: false }).limit(60);
      if (error) throw error;
      return data ?? [];
    },
  });
  return <section className="mt-8 grid gap-3" aria-label={t("private.inbox")}>
    <h2 className="font-display text-2xl">{t("private.inbox")}</h2>
    {query.isPending ? <p role="status">{t("common.loading")}</p> : query.isError ? <div role="alert"><p>{t("private.loadFailed")}</p><Button onClick={() => query.refetch()}>{t("private.retry")}</Button></div> : !query.data?.length ? <p className="text-muted-foreground">{t("private.empty")}</p> :
      query.data.map((row) => <Link key={row.gathering_id} to="/gatherings/$id" params={{ id: row.gathering_id }} className="flex flex-wrap justify-between gap-2 rounded-2xl border border-border bg-card p-4 hover:border-primary">
        <span className="break-words font-medium">{row.gathering.subject}</span>
        <span className="text-sm text-muted-foreground">{t(row.response === "invited" ? "private.invitedState" : `private.${row.response}`)}</span>
      </Link>)}
  </section>;
}
