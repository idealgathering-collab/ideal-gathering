import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { passwordRecovery } from "@/integrations/supabase/recovery";
import { supabase } from "@/integrations/supabase/client";
import { cleanAuthLink, type LinkState } from "@/lib/auth-link-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/i18n";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — Havato" }] }),
  component: ResetPasswordPage,
});

const pwSchema = z.string().min(6, "At least 6 characters").max(72);

function ResetPasswordPage() {
  const t = useT();
  const navigate = useNavigate();
  const [linkState, setLinkState] = useState<LinkState>("checking");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const url = new URL(window.location.href);
    passwordRecovery().open(url).then((state) => {
      if (!active) return;
      setLinkState(state);
      window.history.replaceState(null, "", cleanAuthLink(url));
    }).catch(() => { if (active) setLinkState("invalid"); });
    return () => { active = false; };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (linkState !== "valid" || loading) return;
    try {
      const p = pwSchema.parse(pw);
      if (p !== pw2) throw new Error(t("reset.mismatch"));
      setLoading(true);
      const { signedOut } = await passwordRecovery().updatePassword(p);
      toast.success(t("reset.success"));
      let browserSignedOut = false;
      try { browserSignedOut = !(await supabase.auth.signOut({ scope: "local" })).error; } catch { /* Password was already saved. */ }
      if (!signedOut || !browserSignedOut) toast.warning(t("reset.signOutFailed"));
      navigate({ to: "/auth", search: { mode: "signin" } });
    } catch (err) {
      if (err instanceof Error && err.message === "recovery_required") setLinkState("expired");
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

          {linkState !== "valid" ? (
            <div className="mt-6 grid gap-4">
              <p role="status" className="text-sm text-muted-foreground">{t(linkState === "checking" ? "auth.link.checking" : `reset.${linkState}`)}</p>
              {linkState !== "checking" && <Link to="/auth" search={{ mode: "forgot" }} className="text-primary hover:underline">{t("reset.request")}</Link>}
            </div>
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
