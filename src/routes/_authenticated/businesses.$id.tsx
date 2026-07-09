import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Store, Plus, Trash2, Check, X } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { MenuSection } from "@/components/menu-section";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/gatherings";
import { useT } from "@/i18n";

export const Route = createFileRoute("/_authenticated/businesses/$id")({
  component: BusinessManage,
});

function BusinessManage() {
  const { id } = Route.useParams();
  const { user } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const t = useT();
  const [newLabel, setNewLabel] = useState("");
  const [newCap, setNewCap] = useState(4);

  const { data: biz } = useQuery({
    queryKey: ["business", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("*, venue_tables(id,label,capacity), gatherings(id,subject,status,starts_at,seats,table:venue_tables(label))")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (!biz) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-4 py-16 text-center text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  const isOwner = biz.owner_id === user?.id;

  async function addTable(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    const { error } = await supabase.from("venue_tables").insert({
      business_id: id,
      label: newLabel.trim().slice(0, 20),
      capacity: Math.max(1, Math.min(20, newCap)),
    });
    if (error) return toast.error(error.message);
    setNewLabel("");
    toast.success(t("biz.tableAdded"));
    qc.invalidateQueries({ queryKey: ["business", id] });
  }

  async function removeTable(tableId: string) {
    const { error } = await supabase.from("venue_tables").delete().eq("id", tableId);
    if (error) return toast.error(error.message);
    toast.success(t("biz.tableRemoved"));
    qc.invalidateQueries({ queryKey: ["business", id] });
  }

  async function setStatus(gid: string, status: "approved" | "cancelled") {
    const { error } = await supabase.from("gatherings").update({ status }).eq("id", gid);
    if (error) return toast.error(error.message);
    toast.success(status === "approved" ? t("biz.gatheringApproved") : t("biz.gatheringCancelled"));
    qc.invalidateQueries({ queryKey: ["business", id] });
  }

  async function deleteBusiness() {
    if (!confirm(t("biz.deleteConfirm"))) return;
    const { error } = await supabase.from("businesses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(t("biz.deleted"));
    navigate({ to: "/dashboard" });
  }

  const proposed = (biz.gatherings ?? []).filter((g) => g.status === "proposed");
  const approved = (biz.gatherings ?? []).filter((g) => g.status === "approved");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-warm">
              <Store className="h-5 w-5 text-tangerine-foreground" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {biz.city ?? t("biz.venue")}
              </p>
              <h1 className="font-display text-3xl">{biz.name}</h1>
            </div>
          </div>
          {isOwner && (
            <Button variant="outline" onClick={deleteBusiness} className="rounded-full">
              <Trash2 className="mr-1.5 h-4 w-4" /> {t("biz.delete")}
            </Button>
          )}
        </div>

        {biz.description && <p className="mt-4 max-w-2xl text-muted-foreground">{biz.description}</p>}

        <section className="mt-10">
          <h2 className="font-display text-2xl">{t("biz.tables")}</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(biz.venue_tables ?? []).map((tbl) => (
              <div key={tbl.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
                <div>
                  <div className="font-display text-xl">{t("biz.tableLabel")} {tbl.label}</div>
                  <div className="text-xs text-muted-foreground">{tbl.capacity} {t("biz.tableSeats")}</div>
                </div>
                {isOwner && (
                  <Button size="icon" variant="ghost" onClick={() => removeTable(tbl.id)} aria-label={t("biz.removeTable")}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {isOwner && (
            <form onSubmit={addTable} className="mt-4 flex flex-wrap items-end gap-2 rounded-2xl border border-dashed border-border bg-muted/40 p-4">
              <div className="grid gap-1">
                <label className="text-xs text-muted-foreground">{t("biz.newLabel")}</label>
                <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} maxLength={20} placeholder={t("biz.newLabelPh")} className="w-32" />
              </div>
              <div className="grid gap-1">
                <label className="text-xs text-muted-foreground">{t("biz.newCapacity")}</label>
                <Input type="number" min={1} max={20} value={newCap} onChange={(e) => setNewCap(Number(e.target.value))} className="w-24" />
              </div>
              <Button type="submit" className="rounded-full">
                <Plus className="mr-1 h-4 w-4" /> {t("biz.addTable")}
              </Button>
            </form>
          )}
        </section>

        <MenuSection businessId={id} isOwner={isOwner} />

        {isOwner && (

          <section className="mt-10">
            <h2 className="font-display text-2xl">
              {t("biz.proposed")}{" "}
              {proposed.length > 0 && (
                <span className="ml-2 rounded-full bg-sunshine px-2 py-0.5 text-xs text-sunshine-foreground align-middle">
                  {proposed.length}
                </span>
              )}
            </h2>
            <div className="mt-4 grid gap-2">
              {proposed.length === 0 && <p className="text-sm text-muted-foreground">{t("biz.nothingToReview")}</p>}
              {proposed.map((g) => (
                <div key={g.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
                  <Link to="/gatherings/$id" params={{ id: g.id }} className="min-w-0 flex-1">
                    <div className="font-display text-lg truncate">{g.subject}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(g.starts_at)} · {t("biz.tableLabel")} {g.table?.label} · {g.seats} {t("biz.seats")}
                    </div>
                  </Link>
                  <Button size="sm" onClick={() => setStatus(g.id, "approved")} className="rounded-full">
                    <Check className="mr-1 h-4 w-4" /> {t("biz.approve")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setStatus(g.id, "cancelled")} className="rounded-full">
                    <X className="mr-1 h-4 w-4" /> {t("biz.decline")}
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="font-display text-2xl">{t("biz.approved")}</h2>
          <div className="mt-4 grid gap-2">
            {approved.length === 0 && <p className="text-sm text-muted-foreground">{t("biz.noneYet")}</p>}
            {approved.map((g) => (
              <Link
                key={g.id}
                to="/gatherings/$id"
                params={{ id: g.id }}
                className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <div className="font-display text-lg truncate">{g.subject}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(g.starts_at)} · {t("biz.tableLabel")} {g.table?.label}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
