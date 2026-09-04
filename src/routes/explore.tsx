import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, ArrowRight, Tag } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GatheringCard } from "@/components/gathering-card";
import { CityFilter } from "@/components/city-filter";
import { AreaFilter } from "@/components/area-filter";
import { ExploreSort } from "@/components/explore-sort";
import { GatheringTypeFilter } from "@/components/gathering-type-filter";
import { RecommendedRow } from "@/components/recommended-row";
import { TakeQuizNudge } from "@/components/table-fit";
import { Button } from "@/components/ui/button";
import { fetchApprovedGatherings, fetchGatheringCities, gatheringCoords } from "@/lib/gatherings";
import { useDeviceLocation, haversineKm } from "@/lib/geolocation";
import { sortGatherings, pickRecommended, isSortMode, type SortMode } from "@/lib/explore-sort";
import { toast } from "sonner";
import { getTableFit } from "@/lib/matching.functions";
import { composeRank, preferenceScore } from "@/lib/recommend";
import { hasAnyAnswer, loadMyGatheringPreferences } from "@/lib/gathering-preferences";
import { GATHERING_TYPES, type GatheringType } from "@/lib/gathering-types";
import { YEREVAN_AREA_NAMES, isYerevan } from "@/lib/yerevan-areas";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useI18n, useT } from "@/i18n";
import { localizedHead, jsonLdGatheringList, type SeoLang } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";

type ExploreSearch = { lang?: SeoLang; city?: string; area?: string; sort?: SortMode; type?: GatheringType };

export const Route = createFileRoute("/explore")({
  component: Explore,
  validateSearch: (search: Record<string, unknown>): ExploreSearch => ({
    ...(search.lang === "ru" || search.lang === "fa" ? { lang: search.lang } : {}),
    ...(typeof search.city === "string" && search.city.trim() ? { city: search.city.trim() } : {}),
    ...(typeof search.area === "string" && search.area.trim() ? { area: search.area.trim() } : {}),
    ...(isSortMode(search.sort) ? { sort: search.sort } : {}),
    ...(typeof search.type === "string" && GATHERING_TYPES.includes(search.type as GatheringType) ? { type: search.type as GatheringType } : {}),
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
  const { data: profileTaste, isLoading: profileLoading } = useQuery({
    queryKey: ["profile-taste", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data, error }, prefs] = await Promise.all([
        supabase.from("profiles").select("city, interests").eq("id", user!.id).maybeSingle(),
        loadMyGatheringPreferences(user!.id).catch(() => null),
      ]);
      if (error) throw error;
      const interests = Array.isArray(data?.interests)
        ? (data!.interests as unknown[]).filter((v): v is string => typeof v === "string")
        : [];
      return {
        city: (data?.city ?? "").trim() || null,
        interests,
        prefs: prefs && hasAnyAnswer(prefs) ? prefs : null,
      };
    },
  });
  const profileCity = profileTaste?.city ?? null;

  const explicitCity = search.city === "all" ? null : search.city ?? null;
  const hasExplicitChoice = !!search.city;
  const waitingForProfile = !!user && !hasExplicitChoice && profileLoading;
  const activeCity = hasExplicitChoice ? explicitCity : profileCity ?? null;
  const activeType = search.type ?? null;
  const showAreaFilter = isYerevan(activeCity);
  const activeArea = showAreaFilter ? search.area ?? null : null;

  const { data: cities } = useQuery({
    queryKey: ["gathering-cities"],
    queryFn: fetchGatheringCities,
  });

  const { data: gatherings, isLoading } = useQuery({
    queryKey: ["gatherings", "approved", activeCity ?? "all", activeType ?? "all"],
    enabled: !waitingForProfile,
    queryFn: () => fetchApprovedGatherings(activeCity, activeType),
  });

  function setCity(city: string | null) {
    navigate({
      to: "/explore",
      search: (prev: ExploreSearch) => ({ ...prev, city: city ?? "all" }),
      replace: true,
    });
  }

  function setArea(area: string | null) {
    navigate({
      to: "/explore",
      search: (prev: ExploreSearch) => ({ ...prev, area: area ?? undefined }),
      replace: true,
    });
  }

  function setGatheringType(type: GatheringType | null) {
    navigate({
      to: "/explore",
      search: (prev: ExploreSearch) => ({ ...prev, type: type ?? undefined }),
      replace: true,
    });
  }

  const geo = useDeviceLocation();

  const ids = (gatherings ?? []).map((g) => g.id);
  const { data: fitData } = useQuery({
    queryKey: ["table-fit", user?.id, ids],
    enabled: !!user && ids.length > 0,
    queryFn: () => getTableFit({ data: { gatheringIds: ids } }),
  });
  const fitById = new Map((fitData?.fits ?? []).map((f) => [f.gatheringId, f]));
  const showQuizNudge = !!user && fitData?.viewerHasTraits === false;
  const hasTaste = Boolean(profileTaste?.prefs) || (profileTaste?.interests.length ?? 0) > 0;
  const canRecommend = fitData?.viewerHasSignal === true || fitData?.viewerHasTraits === true || hasTaste;

  // Fit-first is the default once we have any taste signal (quiz, prefs, or
  // interests). Everyone else keeps the soonest-first order.
  const sortMode: SortMode =
    search.sort && (search.sort !== "fit" || canRecommend)
      ? search.sort
      : canRecommend
        ? "fit"
        : "soon";
  const nearMe = sortMode === "near";

  async function setSort(mode: SortMode) {
    if (mode === "near" && !geo.fix) {
      const fix = await geo.request();
      if (!fix) {
        toast.error(t("geo.failed"));
        return;
      }
    }
    navigate({
      to: "/explore",
      search: (prev: ExploreSearch) => ({ ...prev, sort: mode }),
      replace: true,
    });
  }

  const visible = activeArea
    ? (gatherings ?? []).filter((g) => (g.neighborhood ?? "").trim() === activeArea)
    : gatherings ?? [];

  const withDistance = visible.map((g) => {
    const coords = gatheringCoords(g);
    const distanceKm = nearMe && geo.fix && coords ? haversineKm(geo.fix, coords) : null;
    const fitRow = fitById.get(g.id);
    const pref = preferenceScore(g, profileTaste?.prefs ?? null, profileTaste?.interests ?? []);
    return {
      id: g.id,
      starts_at: g.starts_at,
      g,
      fit: fitRow,
      rank: composeRank(fitRow?.fit ?? null, pref.score),
      distanceKm,
    };
  });
  const sorted = sortGatherings(
    withDistance.map((row) => ({ ...row, fit: row.fit?.fit ?? null, fitRow: row.fit })),
    sortMode,
  );
  const recommended = canRecommend ? pickRecommended(sorted, 3) : [];

  const busy = isLoading || waitingForProfile;
  const empty = !busy && visible.length === 0;


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
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <CityFilter city={activeCity} cities={cities ?? []} onChange={setCity} />
          {showAreaFilter && (
            <AreaFilter area={activeArea} areas={YEREVAN_AREA_NAMES} onChange={setArea} />
          )}
          <GatheringTypeFilter type={activeType} onChange={setGatheringType} />
          <ExploreSort
            mode={sortMode}
            onChange={setSort}
            showFit={canRecommend}
            showNear={geo.supported}
            locating={geo.status === "locating"}
          />
        </div>
        {showQuizNudge && (
          <div className="mb-8">
            <TakeQuizNudge />
          </div>
        )}
        {!busy && recommended.length >= 2 && (
          <RecommendedRow
            items={recommended.map(({ g, fitRow, distanceKm }) => ({ g, fit: fitRow, distanceKm }))}
            showCity={!activeCity}
          />
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
            {sorted.map(({ g, fitRow, distanceKm }) => (
              <GatheringCard
                key={g.id}
                g={g}
                fit={fitRow}
                showCity={!activeCity}
                distanceKm={distanceKm}
              />
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
