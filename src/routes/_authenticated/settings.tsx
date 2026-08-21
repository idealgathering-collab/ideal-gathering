import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useT } from "@/i18n";
import { BlockedUsersSection } from "@/components/blocked-users-section";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Ideal Gathering" },
      {
        name: "description",
        content: "Manage your privacy, blocked people, and account on Ideal Gathering.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const t = useT();
  const { user } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function deleteAccount() {
    if (!user) return;
    if (confirmText.trim().toUpperCase() !== "DELETE") {
      toast.error(t("profile.delete.typeMismatch"));
      return;
    }
    try {
      setDeleting(true);
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-own-account`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to delete account");
      }
      await qc.cancelQueries();
      qc.clear();
      await supabase.auth.signOut();
      toast.success(t("profile.delete.done"));
      navigate({ to: "/", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.generic"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pb-28 pt-8 sm:pb-16 sm:pt-12">
        <h1 className="font-display text-3xl sm:text-4xl">{t("settings.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("settings.subtitle")}</p>

        <BlockedUsersSection className="mt-8 rounded-3xl border border-border/60 bg-card p-4 sm:p-6" />

        {/* Danger zone */}
        <section className="mt-6 rounded-3xl border border-destructive/40 bg-card p-4 sm:p-6">
          <h2 className="font-display text-xl text-destructive">{t("profile.danger")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("profile.delete.body")}</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="mt-4 w-full rounded-full sm:w-auto">
                {t("profile.delete.button")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("profile.delete.confirmTitle")}</AlertDialogTitle>
                <AlertDialogDescription>{t("profile.delete.confirmBody")}</AlertDialogDescription>
              </AlertDialogHeader>
              <div className="grid gap-2">
                <Label htmlFor="ct">{t("profile.delete.typeToConfirm")}</Label>
                <Input
                  id="ct"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("profile.delete.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    deleteAccount();
                  }}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? "…" : t("profile.delete.confirmButton")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      </main>
    </div>
  );
}
