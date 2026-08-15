import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import logoAsset from "@/assets/ideal-gathering-logo.png.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { localizedHead } from "@/lib/seo";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup", "forgot"]).optional().default("signin"),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  component: AuthPage,
  head: () => localizedHead("/auth", undefined),
});

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(6, "At least 6 characters").max(72);
const nameSchema = z.string().trim().min(1, "Enter your name").max(80);

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const { mode, redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [current, setCurrent] = useState<Mode>(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const t = useT();

  useEffect(() => setCurrent(mode), [mode]);

  useEffect(() => {
    if (current === "forgot") return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: redirect ?? "/dashboard" });
    });
  }, [navigate, redirect, current]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const em = emailSchema.parse(email);
      setLoading(true);

      if (current === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(em, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success(t("auth.forgot.sent"));
        setCurrent("signin");
        return;
      }

      const pw = passwordSchema.parse(password);
      if (current === "signup") {
        if (!agree) {
          toast.error(t("consent.required"));
          return;
        }
        const nm = nameSchema.parse(name);
        const { error } = await supabase.auth.signUp({
          email: em,
          password: pw,
          options: {
            emailRedirectTo: `${window.location.origin}${redirect ?? ""}`,
            data: { display_name: nm, account_type: "user" },
          },
        });
        if (error) throw error;
        toast.success(t("auth.welcomeIn"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: em, password: pw });
        if (error) throw error;
        toast.success(t("auth.welcomeBack"));
      }
      navigate({ to: redirect ?? "/dashboard" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("auth.generic");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const isSignup = current === "signup";
  const isForgot = current === "forgot";

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
            <img
              src={logoAsset.url}
              alt=""
              className="h-9 w-9 rounded-full object-contain animate-logo-spin"
            />
            <span className="font-display text-xl">
              Ideal <span className="italic">Gathering</span>
            </span>
          </Link>
          <div className="ms-auto">
            <LanguageSwitcher />
          </div>
        </div>


        <div className="rounded-3xl border border-border bg-card p-8 shadow-plum">
          <h1 className="font-display text-3xl">
            {isForgot ? t("auth.forgot.title") : isSignup ? t("auth.title.signup") : t("auth.title.signin")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isForgot ? t("auth.forgot.subtitle") : isSignup ? t("auth.subtitle.signup") : t("auth.subtitle.signin")}
          </p>

          {!isForgot && (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={async () => {
                  try {
                    setLoading(true);
                    const result = await lovable.auth.signInWithOAuth("google", {
                      redirect_uri: `${window.location.origin}${redirect ?? ""}`,
                    });
                    if (result.error) throw result.error;
                    if (result.redirected) return;
                    navigate({ to: redirect ?? "/dashboard" });
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : t("auth.googleFailed");
                    toast.error(msg);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="mt-6 h-11 w-full rounded-full text-base"
              >
                <svg className="me-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.44-1.7 4.22-5.5 4.22-3.31 0-6-2.74-6-6.12s2.69-6.12 6-6.12c1.88 0 3.14.8 3.86 1.49l2.63-2.53C16.83 3.5 14.66 2.5 12 2.5 6.75 2.5 2.5 6.75 2.5 12s4.25 9.5 9.5 9.5c5.48 0 9.12-3.85 9.12-9.28 0-.62-.07-1.1-.16-1.52H12z"/>
                </svg>
                {t("auth.google")}
              </Button>

              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                <span>{t("auth.or")}</span>
                <span className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          {isSignup && !isForgot && <QuizSavedNote />}

          <form onSubmit={handleSubmit} className="grid gap-4">

            {isSignup && !isForgot && (
              <div className="grid gap-2">
                <Label htmlFor="name">{t("auth.name")}</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
            </div>
            {!isForgot && (
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  {!isSignup && (
                    <button
                      type="button"
                      onClick={() => setCurrent("forgot")}
                      className="text-xs text-primary hover:underline"
                    >
                      {t("auth.forgot")}
                    </button>
                  )}
                </div>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} maxLength={72} />
              </div>
            )}

            {isSignup && (
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={agree}
                  onCheckedChange={(v) => setAgree(v === true)}
                  className="mt-0.5"
                />
                <span>
                  {t("consent.agree")}{" "}
                  <Link to="/privacy" className="text-primary hover:underline">
                    {t("consent.privacy")}
                  </Link>{" "}
                  {t("consent.and")}{" "}
                  <Link to="/terms" className="text-primary hover:underline">
                    {t("consent.terms")}
                  </Link>
                  .
                </span>
              </label>
            )}

            <Button type="submit" disabled={loading} className="mt-2 h-11 rounded-full text-base">
              {loading
                ? t("auth.submitting")
                : isForgot
                ? t("auth.forgot.send")
                : isSignup
                ? t("auth.signUp")
                : t("auth.signIn")}
            </Button>
          </form>

          {isForgot ? (
            <button
              type="button"
              onClick={() => setCurrent("signin")}
              className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              {t("auth.forgot.back")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrent(isSignup ? "signin" : "signup")}
              className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              {isSignup ? `${t("auth.haveAccount")} ${t("auth.switchSignin")}` : `${t("auth.noAccount")} ${t("auth.switchSignup")}`}
            </button>
          )}

          <div className="mt-2 text-center text-xs text-muted-foreground">
            {t("auth.venueHint")}{" "}
            <Link to="/venue/auth" className="text-primary hover:underline">
              {t("auth.venueLink")}
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
