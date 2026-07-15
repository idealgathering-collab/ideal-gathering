import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/i18n";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — Ideal Gathering" }] }),
  component: ResetPasswordPage,
});

const pwSchema = z.string().min(6, "At least 6 characters").max(72);

function ResetPasswordPage() {
  const t = useT();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase parses the recovery hash and fires PASSWORD_RECOVERY.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setReady(true);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const p = pwSchema.parse(pw);
      if (p !== pw2) throw new Error(t("reset.mismatch"));
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: p });
      if (error) throw error;
      toast.success(t("reset.success"));
      await supabase.auth.signOut();
      navigate({ to: "/auth", search: { mode: "signin" } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-plum">
          <h1 className="font-display text-3xl">{t("reset.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("reset.subtitle")}</p>

          {!ready ? (
            <p className="mt-6 text-sm text-muted-foreground">{t("reset.waiting")}</p>
          ) : (
            <form onSubmit={submit} className="mt-6 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="pw">{t("reset.newPassword")}</Label>
                <Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6} maxLength={72} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pw2">{t("reset.confirmPassword")}</Label>
                <Input id="pw2" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} required minLength={6} maxLength={72} />
              </div>
              <Button type="submit" disabled={loading} className="h-11 rounded-full">
                {loading ? "…" : t("reset.submit")}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
