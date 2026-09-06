import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Rocket, Send, Ticket, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useT } from "@/i18n";
import {
  createInvitation,
  getBetaLaunched,
  listInvitations,
  listWaitlist,
  revokeInvitation,
  setBetaLaunched,
} from "@/lib/beta-admin";

export function BetaSection() {
  const t = useT();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");

  const launched = useQuery({ queryKey: ["beta-launched"], queryFn: getBetaLaunched });
  const invites = useQuery({ queryKey: ["invitations"], queryFn: listInvitations });
  const waitlist = useQuery({ queryKey: ["admin-waitlist"], queryFn: listWaitlist });

  const toggle = useMutation({
    mutationFn: (on: boolean) => setBetaLaunched(on),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["beta-launched"] });
      toast.success(t("admin.beta.saved"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const invite = useMutation({
    mutationFn: (input: { email?: string | null; note?: string | null }) => createInvitation(input),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["invitations"] });
      setEmail("");
      setNote("");
      void navigator.clipboard?.writeText(row.code).catch(() => {});
      toast.success(`${t("admin.beta.created")} ${row.code}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => revokeInvitation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invitations"] });
      toast.success(t("admin.beta.revoked"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const invitedEmails = new Set((invites.data ?? []).map((i) => (i.email ?? "").toLowerCase()).filter(Boolean));

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display flex items-center gap-2 text-xl">
              <Rocket className="h-4 w-4 text-primary" />
              {t("admin.beta.launchTitle")}
            </h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t("admin.beta.launchBody")}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="rounded-full" variant={launched.data ? "default" : "secondary"}>
              {launched.data ? t("admin.beta.live") : t("admin.beta.locked")}
            </Badge>
            <Switch
              checked={!!launched.data}
              disabled={launched.isLoading || toggle.isPending}
              onCheckedChange={(v) => toggle.mutate(v)}
              aria-label={t("admin.beta.launchTitle")}
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display flex items-center gap-2 text-xl">
          <Ticket className="h-4 w-4 text-primary" />
          {t("admin.beta.invites")}
        </h2>

        <form
          className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            invite.mutate({ email, note });
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="inv-email">{t("admin.beta.email")}</Label>
            <Input id="inv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="inv-note">{t("admin.beta.note")}</Label>
            <Input id="inv-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
          </div>
          <Button type="submit" disabled={invite.isPending} className="self-end rounded-full">
            {t("admin.beta.create")}
          </Button>
        </form>

        <div className="mt-6 grid gap-2">
          {(invites.data ?? []).length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("admin.beta.noInvites")}</p>
          )}
          {(invites.data ?? []).map((i) => (
            <div key={i.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 px-4 py-3">
              <code className="font-mono text-sm">{i.code}</code>
              <Badge variant="secondary" className="rounded-full text-[11px]">
                {i.status}
              </Badge>
              <span className="text-sm text-muted-foreground">{i.email ?? "—"}</span>
              {i.note && <span className="text-xs text-muted-foreground">· {i.note}</span>}
              <div className="ms-auto flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full"
                  aria-label={t("admin.beta.copy")}
                  onClick={() => {
                    void navigator.clipboard?.writeText(i.code);
                    toast.success(t("admin.beta.copied"));
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                {i.status === "pending" && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full text-destructive"
                    aria-label={t("admin.beta.revoke")}
                    onClick={() => revoke.mutate(i.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display text-xl">{t("admin.beta.waitlist")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("admin.beta.waitlistBody")}</p>
        <div className="mt-4 grid gap-2">
          {(waitlist.data ?? []).length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("admin.beta.noWaitlist")}</p>
          )}
          {(waitlist.data ?? []).map((w) => {
            const already = invitedEmails.has(w.email.toLowerCase());
            return (
              <div key={w.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 px-4 py-3">
                <span className="text-sm font-medium">{w.name}</span>
                <span className="text-sm text-muted-foreground">{w.email}</span>
                {w.city && <span className="text-xs text-muted-foreground">· {w.city}</span>}
                <Button
                  size="sm"
                  variant={already ? "outline" : "default"}
                  disabled={invite.isPending}
                  className="ms-auto rounded-full"
                  onClick={() => invite.mutate({ email: w.email, note: `waitlist: ${w.name}` })}
                >
                  <Send className="me-2 h-3.5 w-3.5" />
                  {already ? t("admin.beta.inviteAgain") : t("admin.beta.invite")}
                </Button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
