import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Your profile — Ideal Gathering" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const t = useT();
  const { user } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(async ({ data }) => {
        setDisplayName(data?.display_name ?? "");
        setAvatarPath(data?.avatar_url ?? null);
        if (data?.avatar_url) {
          const { data: signed } = await supabase.storage
            .from("avatars")
            .createSignedUrl(data.avatar_url, 3600);
          setAvatarUrl(signed?.signedUrl ?? null);
        }
      });
  }, [user]);

  async function saveName() {
    if (!user) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim() })
        .eq("id", user.id);
      if (error) throw error;
      toast.success(t("profile.saved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.generic"));
    } finally {
      setSaving(false);
    }
  }

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      setUploading(true);
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${user.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar_url: path })
        .eq("id", user.id);
      if (updErr) throw updErr;
      setAvatarPath(path);
      const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
      setAvatarUrl(signed?.signedUrl ?? null);
      toast.success(t("profile.avatarUpdated"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.generic"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

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
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="font-display text-4xl">{t("profile.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>

        <section className="mt-8 rounded-3xl border border-border bg-card p-6">
          <h2 className="font-display text-xl">{t("profile.avatar")}</h2>
          <div className="mt-4 flex items-center gap-4">
            <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-muted">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-display">
                  {(displayName || user?.email || "?").slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onAvatarChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="rounded-full"
              >
                {uploading ? "…" : t("profile.uploadAvatar")}
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">{t("profile.avatarHint")}</p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-border bg-card p-6">
          <h2 className="font-display text-xl">{t("profile.displayName")}</h2>
          <div className="mt-4 grid gap-3">
            <Label htmlFor="dn">{t("profile.displayName")}</Label>
            <Input id="dn" value={displayName} maxLength={80} onChange={(e) => setDisplayName(e.target.value)} />
            <Button onClick={saveName} disabled={saving} className="rounded-full w-fit">
              {saving ? "…" : t("profile.save")}
            </Button>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-destructive/40 bg-card p-6">
          <h2 className="font-display text-xl text-destructive">{t("profile.danger")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("profile.delete.body")}</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="mt-4 rounded-full">
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
                <Input id="ct" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" />
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
