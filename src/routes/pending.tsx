import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, LogOut, RefreshCw, Sparkles } from "lucide-react";
import { CosmicBackdrop } from "@/components/cosmic-backdrop";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useT } from "@/i18n";
import { useSession } from "@/hooks/use-session";
import { fetchAccessState } from "@/lib/access";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/ideal-gathering-logo.png.asset.json";

type PendingSearch = { as?: "venue" | "member" };

export const Route = createFileRoute("/pending")({
  validateSearch: (search: Record<string, unknown>): PendingSearch =>
    search.as === "venue" ? { as: "venue" } : {},
  component: PendingPage,
  head: () => ({
    meta: [
      { title: "You're on the list — Ideal Gathering" },
      { name: "description", content: "Ideal Gathering is in private beta. We're opening access gradually." },
      { property: "og:title", content: "You're on the list — Ideal Gathering" },
      { property: "og:description", content: "Ideal Gathering is in private beta. We're opening access gradually." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function PendingPage() {
  const t = useT();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, loading } = useSession();
  const { as } = Route.useSearch();

  const { data: access, isFetching } = useQuery({
    queryKey: ["access-state", user?.id],
    enabled: !!user,
    queryFn: () => fetchAccessState(user!.id),
  });

  const isVenue = as === "venue" || access?.isVenue;

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  // As soon as access opens up, let people through.
  if (access?.hasProductAccess && !isVenue) {
    void navigate({ to: "/dashboard", replace: true });
  }
  if (access?.hasVenueAccess && isVenue) {
    void navigate({ to: "/venue/dashboard", replace: true });
  }

  const bodyKey = isVenue
    ? access?.hasBusiness
      ? "pending.venue.applied"
      : "pending.venue.register"
    : access?.onboarded
    ? "pending.member.ready"
    : "pending.member.finishOnboarding";

  return (
    <div className="landing-dark cosmic-scene relative z-0 min-h-[100dvh] overflow-hidden">
      <CosmicBackdrop />

      <header className="relative z-20 mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-6">
        <Link to="/" className="flex items-center gap-2 text-white">
          <img src={logoAsset.url} alt="" aria-hidden className="h-9 w-9 rounded-full object-contain" />
          <span className="font-display text-lg">
            Ideal <span className="italic text-nebula-violet">Gathering</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              aria-label={t("nav.signOut")}
              className="rounded-full text-white hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center px-4 pb-24 pt-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[rgba(196,181,253,0.85)]">
          <Sparkles className="h-3 w-3 text-sunshine" />
          {t("beta.badge")}
        </div>

        <h1 className="font-serif-warm mt-7 text-[40px] font-extrabold leading-[1.05] tracking-[-0.03em] text-white sm:text-[60px]">
          {t("pending.title")}
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[rgba(221,214,254,0.82)]">
          {loading || !access ? t("common.loading") : t(bodyKey)}
        </p>

        <div className="cosmic-panel mt-10 w-full max-w-md p-6 text-start">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10">
              <Clock className="h-4 w-4 text-sunshine" />
            </span>
            <div>
              <p className="text-sm font-medium text-white">{t("pending.status.label")}</p>
              <p className="text-sm text-[rgba(221,214,254,0.7)]">
                {isVenue
                  ? access?.hasBusiness
                    ? t("pending.status.venueApplied")
                    : t("pending.status.venueNoApp")
                  : access?.onboarded
                  ? t("pending.status.memberReady")
                  : t("pending.status.memberOnboarding")}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-2">
            {!isVenue && !access?.onboarded && (
              <Button asChild className="h-11 rounded-full">
                <Link to="/onboarding" search={{ step: "welcome" }}>
                  {t("pending.action.onboarding")}
                </Link>
              </Button>
            )}
            {isVenue && (
              <Button asChild className="h-11 rounded-full">
                <Link to="/venue/dashboard">{t("pending.action.venue")}</Link>
              </Button>
            )}
            <Button
              variant="outline"
              className="h-11 rounded-full"
              disabled={isFetching}
              onClick={() => qc.invalidateQueries({ queryKey: ["access-state", user?.id] })}
            >
              <RefreshCw className={`me-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              {t("pending.action.refresh")}
            </Button>
          </div>
        </div>

        <p className="mt-8 text-xs uppercase tracking-[0.14em] text-[rgba(196,181,253,0.55)]">
          {t("pending.footnote")}
        </p>
      </main>
    </div>
  );
}
