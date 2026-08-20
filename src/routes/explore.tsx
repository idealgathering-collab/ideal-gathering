import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GatheringCard } from "@/components/gathering-card";
import { TakeQuizNudge } from "@/components/table-fit";
import { Button } from "@/components/ui/button";
import { fetchApprovedGatherings } from "@/lib/gatherings";
import { getTableFit } from "@/lib/matching.functions";
import { useSession } from "@/hooks/use-session";
import { useI18n, useT } from "@/i18n";
import { localizedHead, jsonLdGatheringList, type SeoLang } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";

export const Route = createFileRoute("/explore")({
  component: Explore,
  validateSearch: (search: Record<string, unknown>): { lang?: SeoLang } =>
    search.lang === "tr" || search.lang === "fa" ? { lang: search.lang } : {},
  head: ({ match }) => localizedHead("/explore", match.search.lang),
});

function Explore() {
  const t = useT();
  const { lang } = useI18n();
  const { user } = useSession();
  const { data: gatherings, isLoading } = useQuery({
    queryKey: ["gatherings", "approved"],
    queryFn: fetchApprovedGatherings,
  });

  const ids = (gatherings ?? []).map((g) => g.id);
  const { data: fitData } = useQuery({
    queryKey: ["table-fit", user?.id, ids],
    enabled: !!user && ids.length > 0,
    queryFn: () => getTableFit({ data: { gatheringIds: ids } }),
  });
  const fitById = new Map((fitData?.fits ?? []).map((f) => [f.gatheringId, f]));
  const showQuizNudge = !!user && fitData?.viewerHasTraits === false;

  const empty = !isLoading && (!gatherings || gatherings.length === 0);


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
        {showQuizNudge && (
          <div className="mb-8">
            <TakeQuizNudge />
          </div>
        )}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-3xl bg-card" />
            ))}
          </div>
        ) : empty ? (
          <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-10 text-center shadow-soft">
            <h2 className="font-display text-2xl">{t("explore.empty.title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("explore.empty.body")}</p>
            <Button asChild className="mt-6 rounded-full">
              <Link to="/create-gathering">
                {t("explore.empty.cta")} <ArrowRight className="ms-1 h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gatherings!.map((g) => (
              <GatheringCard key={g.id} g={g} fit={fitById.get(g.id)} />
            ))}
          </div>
        )}
      </main>


      <SiteFooter />
    </div>
  );
}
