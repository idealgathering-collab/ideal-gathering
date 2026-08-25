import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { fetchRoles, setAdminPreview } from "@/lib/roles";

export const Route = createFileRoute("/admin/auth")({
  component: AdminAuth,
  head: () => ({
    meta: [
      { title: "Owner sign-in — Ideal Gathering" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const emailSchema = z.string().trim().email().max(255);
const passwordSchema = z.string().min(6).max(72);

function AdminAuth() {
  const navigate = useNavigate();
  const t = useT();
  const [mode, setMode] = useState<"signin" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const roles = await fetchRoles(data.session.user.id);
      if (roles.has("admin")) {
        setAdminPreview(false);
        navigate({ to: "/admin", replace: true });
      }
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const em = emailSchema.parse(email);
      setLoading(true);

      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(em, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success(t("auth.forgot.sent"));
        setMode("signin");
        return;
      }

      const pw = passwordSchema.parse(password);
      const { error } = await supabase.auth.signInWithPassword({ email: em, password: pw });
      if (error) throw error;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t("auth.generic"));
      const roles = await fetchRoles(user.id);
      if (!roles.has("admin")) {
        await supabase.auth.signOut();
        throw new Error(t("adminAuth.notAdmin"));
      }
      setAdminPreview(false);
      toast.success(t("auth.welcomeBack"));
      navigate({ to: "/admin", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-hero opacity-90" />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
        <div className="mb-8 flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("common.back")}
            className="rounded-full text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
            onClick={() => navigate({ to: "/" })}
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Button>
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-sunshine">
              <Shield className="h-4 w-4 text-sunshine-foreground" />
            </span>
            <span className="font-display text-xl">
              Ideal <span className="italic">Gathering</span> · {t("adminAuth.for")}
            </span>
          </Link>
          <div className="ms-auto">
            <LanguageSwitcher />
          </div>
        </div>

        <div className="form-panel p-8">
          <h1 className="font-display text-3xl">
            {mode === "forgot" ? t("auth.forgot.title") : t("adminAuth.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "forgot" ? t("auth.forgot.subtitle") : t("adminAuth.subtitle")}
          </p>

          <form onSubmit={submit} className="mt-6 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
              />
            </div>
            {mode === "signin" && (
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-xs text-primary hover:underline"
                  >
                    {t("auth.forgot")}
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  maxLength={72}
                />
              </div>
            )}
            <Button type="submit" disabled={loading} className="mt-2 h-11 rounded-full text-base">
              {loading ? t("auth.submitting") : mode === "forgot" ? t("auth.forgot.send") : t("auth.signIn")}
            </Button>
          </form>

          {mode === "forgot" ? (
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              {t("auth.forgot.back")}
            </button>
          ) : (
            <div className="field-hint mt-4 text-center">
              {t("adminAuth.guestHint")}{" "}
              <Link to="/auth" className="text-primary hover:underline">
                {t("adminAuth.guestLogin")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
