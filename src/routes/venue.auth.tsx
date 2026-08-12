import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useT } from "@/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";


export const Route = createFileRoute("/venue/auth")({
  component: VenueAuth,
  head: () => localizedHead("/venue/auth", undefined),
});

const emailSchema = z.string().trim().email().max(255);
const passwordSchema = z.string().min(6).max(72);
const nameSchema = z.string().trim().min(1).max(120);

function VenueAuth() {
  const navigate = useNavigate();
  const t = useT();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.session.user.id)
        .eq("role", "venue")
        .maybeSingle();
      if (role) navigate({ to: "/venue/dashboard" });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const em = emailSchema.parse(email);
      const pw = passwordSchema.parse(password);
      setLoading(true);

      if (mode === "signup") {
        if (!agree) {
          toast.error(t("consent.required"));
          return;
        }
        const nm = nameSchema.parse(businessName);
        const { error } = await supabase.auth.signUp({
          email: em,
          password: pw,
          options: {
            emailRedirectTo: `${window.location.origin}/venue/dashboard`,
            data: { display_name: nm, account_type: "venue" },
          },
        });
        if (error) throw error;
        toast.success(t("venueAuth.welcome"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: em, password: pw });
        if (error) throw error;
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: role } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .eq("role", "venue")
            .maybeSingle();
          if (!role) {
            await supabase.auth.signOut();
            throw new Error(t("venueAuth.notVenue"));
          }
        }
        toast.success(t("auth.welcomeBack"));
      }
      navigate({ to: "/venue/dashboard" });
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
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) window.history.back();
              else navigate({ to: "/" });
            }}
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Button>
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-sunshine">
              <Store className="h-4 w-4 text-sunshine-foreground" />
            </span>
            <span className="font-display text-xl">
              Ideal <span className="italic">Gathering</span> · {t("venueAuth.for")}
            </span>
          </Link>
          <div className="ms-auto">
            <LanguageSwitcher />
          </div>
        </div>


        <div className="form-panel p-8">
          <h1 className="font-display text-3xl">
            {mode === "signup" ? t("venueAuth.title.signup") : t("venueAuth.title.signin")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signup" ? t("venueAuth.subtitle.signup") : t("venueAuth.subtitle.signin")}
          </p>

          <form onSubmit={submit} className="mt-6 grid gap-4">
            {mode === "signup" && (
              <div className="grid gap-2">
                <Label htmlFor="bname">{t("venueAuth.businessName")}</Label>
                <Input
                  id="bname"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  maxLength={120}
                  placeholder={t("venueAuth.businessNamePh")}
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
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

            {mode === "signup" && (
              <label className="field-hint flex items-start gap-2">
                <Checkbox checked={agree} onCheckedChange={(v) => setAgree(v === true)} className="mt-0.5" />
                <span>
                  {t("consent.agree")} <Link to="/privacy" className="text-primary hover:underline">{t("consent.privacy")}</Link>{" "}
                  {t("consent.and")} <Link to="/terms" className="text-primary hover:underline">{t("consent.terms")}</Link>.
                </span>
              </label>
            )}

            <Button type="submit" disabled={loading} className="mt-2 h-11 rounded-full text-base">
              {loading ? t("auth.submitting") : mode === "signup" ? t("auth.signUp") : t("auth.signIn")}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {mode === "signup"
              ? `${t("auth.haveAccount")} ${t("auth.switchSignin")}`
              : `${t("auth.noAccount")} ${t("auth.switchSignup")}`}
          </button>

          <div className="field-hint mt-3 text-center">
            {t("venueAuth.notVenueHint")}{" "}
            <Link to="/auth" className="text-primary hover:underline">
              {t("venueAuth.userLogin")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
