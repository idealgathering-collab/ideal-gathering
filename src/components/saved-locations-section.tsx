import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, MapPin, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SavedLocationDialog } from "@/components/saved-location-dialog";
import { useT } from "@/i18n";

type Row = {
  id: string;
  label: string;
  address: string;
  city: string | null;
  status: string;
  reject_reason: string | null;
};

export function SavedLocationsSection({ countryCode }: { countryCode?: string | null }) {
  const t = useT();
  const { user } = useSession();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  async function load() {
    if (!user) return;
    const { data, error } = await supabase
      .from("saved_locations")
      .select("id,label,address,city,status,reject_reason")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((data ?? []) as Row[]);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function remove(id: string) {
    const { error } = await supabase.from("saved_locations").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(t("savedLoc.deleteDone"));
    load();
  }

  async function rename(id: string) {
    const v = renameValue.trim();
    if (!v) return;
    const { error } = await supabase.from("saved_locations").update({ label: v }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(t("savedLoc.renamed"));
    setRenamingId(null);
    setRenameValue("");
    load();
  }

  return (
    <section className="mt-6 rounded-3xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl">{t("savedLoc.list.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("savedLoc.list.hint")}</p>
        </div>
        <Button type="button" variant="outline" className="rounded-full" onClick={() => setAddOpen(true)}>
          {t("savedLoc.addBtn")}
        </Button>
      </div>

      <div className="mt-4 grid gap-3">
        {rows === null ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> …
          </div>
        ) : rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            {t("savedLoc.list.empty")}
          </p>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  {renamingId === r.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        autoFocus
                        value={renameValue}
                        placeholder={t("savedLoc.renamePh")}
                        maxLength={80}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="h-8"
                      />
                      <Button size="sm" onClick={() => rename(r.id)}>
                        {t("common.save")}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setRenamingId(null)}>
                        {t("common.cancel")}
                      </Button>
                    </div>
                  ) : (
                    <p className="truncate font-medium">{r.label}</p>
                  )}
                  <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span className="line-clamp-2">
                      {r.address}
                      {r.city ? ` · ${r.city}` : ""}
                    </span>
                  </p>
                  {r.status === "rejected" && r.reject_reason && (
                    <p className="mt-2 text-xs text-destructive">
                      {t("savedLoc.reason")}: {r.reject_reason}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} />
                  {renamingId !== r.id && (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        title={t("savedLoc.rename")}
                        onClick={() => {
                          setRenamingId(r.id);
                          setRenameValue(r.label);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" title={t("common.delete")}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("savedLoc.deleteConfirm")}</AlertDialogTitle>
                            <AlertDialogDescription>{r.label}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={(e) => {
                                e.preventDefault();
                                remove(r.id);
                              }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {t("common.delete")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <SavedLocationDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        countryCode={countryCode ?? undefined}
        onSaved={load}
      />
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const t = useT();
  if (status === "approved")
    return <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15">{t("savedLoc.status.approved")}</Badge>;
  if (status === "rejected")
    return <Badge variant="destructive">{t("savedLoc.status.rejected")}</Badge>;
  return <Badge variant="secondary">{t("savedLoc.status.pending")}</Badge>;
}
