import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GatheringCard } from "@/components/gathering-card";
import { CityFilter } from "@/components/city-filter";
import { TakeQuizNudge } from "@/components/table-fit";
import { Button } from "@/components/ui/button";
import { fetchApprovedGatherings, fetchGatheringCities } from "@/lib/gatherings";
import { getTableFit } from "@/lib/matching.functions";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useI18n, useT } from "@/i18n";
import { localizedHead, jsonLdGatheringList, type SeoLang } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";

type ExploreSearch = { lang?: SeoLang; city?: string };

export const Route = createFileRoute("/explore")({
  component: Explore,
  validateSearch: (search: Record<string, unknown>): ExploreSearch => ({
    ...(search.lang === "tr" || search.lang === "fa" ? { lang: search.lang } : {}),
    ...(typeof search.city === "string" && search.city.trim() ? { city: search.city.trim() } : {}),
  }),
  head: ({ match }) => localizedHead("/explore", match.search.lang),
});

function Explore() {
  const t = useT();
  const { lang } = useI18n();
  const { user } = useSession();
  const navigate = useNavigate();
  const search = Route.useSearch();

  // Profile city is the default scope for signed-in users who haven't picked one in the URL.
  const { data: profileCity, isLoading: profileLoading } = useQuery({
    queryKey: ["profile-city", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("city")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data?.city ?? "").trim() || null;
    },
  });

  const explicitCity = search.city === "all" ? null : search.city ?? null;
  const hasExplicitChoice = !!search.city;
  const waitingForProfile = !!user && !hasExplicitChoice && profileLoading;
  const activeCity = hasExplicitChoice ? explicitCity : profileCity ?? null;

  const { data: cities } = useQuery({
    queryKey: ["gathering-cities"],
    queryFn: fetchGatheringCities,
  });

  const { data: gatherings, isLoading } = useQuery({
    queryKey: ["gatherings", "approved", activeCity ?? "all"],
    enabled: !waitingForProfile,
    queryFn: () => fetchApprovedGatherings(activeCity),
  });

  function setCity(city: string | null) {
    navigate({
      to: "/explore",
      search: (prev: ExploreSearch) => ({ ...prev, city: city ?? "all" }),
      replace: true,
    });
  }

  const ids = (gatherings ?? []).map((g) => g.id);
  const { data: fitData } = useQuery({
    queryKey: ["table-fit", user?.id, ids],
    enabled: !!user && ids.length > 0,
    queryFn: () => getTableFit({ data: { gatheringIds: ids } }),
  });
  const fitById = new Map((fitData?.fits ?? []).map((f) => [f.gatheringId, f]));
  const showQuizNudge = !!user && fitData?.viewerHasTraits === false;

  const busy = isLoading || waitingForProfile;
  const empty = !busy && (!gatherings || gatherings.length === 0);

  return (
    <div className="min-h-screen bg-background">
      {gatherings && gatherings.length > 0 && (
        <JsonLd data={jsonLdGatheringList(gatherings, lang)} />
      )}
      <SiteHeader />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-95" />
        <div className="relative mx-auto max-w-5xl px-4 py-16 text-primary-foreground sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-medium uppercase tracking-wide backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            {t("explore.badge")}
          </span>
          <h1 className="mt-6 font-display text-5xl leading-[0.95] sm:text-6xl">
            {t("explore.title")}
          </h1>
          <p className="mt-4 max-w-xl text-primary-foreground/85">{t("explore.subtitle")}</p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-8">
          <CityFilter city={activeCity} cities={cities ?? []} onChange={setCity} />
        </div>
        {showQuizNudge && (
          <div className="mb-8">
            <TakeQuizNudge />
          </div>
        )}
        {busy ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-3xl bg-card" />
            ))}
          </div>
        ) : empty ? (
          <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-10 text-center shadow-soft">
            <h2 className="font-display text-2xl">
              {activeCity ? t("explore.emptyCity.title", { city: activeCity }) : t("explore.empty.title")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("explore.empty.body")}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild className="rounded-full">
                <Link to="/create-gathering">
                  {t("explore.empty.cta")} <ArrowRight className="ms-1 h-4 w-4 rtl:rotate-180" />
                </Link>
              </Button>
              {activeCity && (
                <Button variant="outline" className="rounded-full" onClick={() => setCity(null)}>
                  {t("explore.emptyCity.browseAll")}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gatherings!.map((g) => (
              <GatheringCard key={g.id} g={g} fit={fitById.get(g.id)} showCity={!activeCity} />
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
