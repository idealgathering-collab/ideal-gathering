import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { CosmicBackdrop } from "@/components/cosmic-backdrop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useT } from "@/i18n";
import { checkInvitation, normalizeCode, rememberInvite } from "@/lib/access";
import logoAsset from "@/assets/ideal-gathering-logo.png.asset.json";

export const Route = createFileRoute("/invite")({
  component: InvitePage,
  head: () => ({
    meta: [
      { title: "Enter your invitation — Ideal Gathering" },
      {
        name: "description",
        content: "Have an invitation to the Ideal Gathering private beta? Enter your code to create your account.",
      },
      { property: "og:title", content: "Enter your invitation — Ideal Gathering" },
      {
        property: "og:description",
        content: "Have an invitation to the Ideal Gathering private beta? Enter your code to create your account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function InvitePage() {
  const t = useT();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = normalizeCode(code);
    if (!value) return;
    setLoading(true);
    try {
      const ok = await checkInvitation(value);
      if (!ok) {
        toast.error(t("invite.invalid"));
        return;
      }
      rememberInvite(value);
      toast.success(t("invite.valid"));
      navigate({ to: "/auth", search: { mode: "signup", invite: value } });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="landing-dark cosmic-scene relative z-0 min-h-[100dvh] overflow-hidden">
      <CosmicBackdrop />
      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-4 py-12">
        <div className="mb-8 flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("common.back")}
            className="rounded-full text-white hover:bg-white/10 hover:text-white"
            onClick={() => navigate({ to: "/" })}
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Button>
          <Link to="/" className="inline-flex items-center gap-2 text-white">
            <img src={logoAsset.url} alt="" aria-hidden className="h-9 w-9 rounded-full object-contain" />
            <span className="font-display text-xl">
              Ideal <span className="italic text-nebula-violet">Gathering</span>
            </span>
          </Link>
          <div className="ms-auto">
            <LanguageSwitcher />
          </div>
        </div>

        <div className="cosmic-panel p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[rgba(196,181,253,0.85)]">
            <KeyRound className="h-3 w-3 text-sunshine" />
            {t("beta.badge")}
          </div>
          <h1 className="font-display mt-4 text-3xl text-white">{t("invite.title")}</h1>
          <p className="mt-2 text-sm text-[rgba(221,214,254,0.75)]">{t("invite.sub")}</p>

          <form onSubmit={submit} className="mt-6 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="code" className="text-[rgba(221,214,254,0.9)]">
                {t("invite.label")}
              </Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="IG-XXXX-XXXX"
                autoComplete="off"
                maxLength={40}
                required
                className="bg-white/5 text-white placeholder:text-white/35"
              />
            </div>
            <Button type="submit" disabled={loading} className="h-11 rounded-full text-base">
              {loading ? t("common.loading") : t("invite.submit")}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-[rgba(221,214,254,0.7)]">
            {t("invite.noCode")}{" "}
            <Link to="/waitlist" className="text-nebula-violet hover:underline">
              {t("beta.cta.waitlist")}
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-[rgba(221,214,254,0.55)]">
            <Link to="/auth" search={{ mode: "signin" }} className="hover:underline">
              {t("auth.haveAccount")} {t("auth.switchSignin")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
