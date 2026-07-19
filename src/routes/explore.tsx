import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GatheringCard } from "@/components/gathering-card";
import { Button } from "@/components/ui/button";
import { fetchApprovedGatherings } from "@/lib/gatherings";
import { useT } from "@/i18n";

export const Route = createFileRoute("/explore")({
  component: Explore,
  head: () => ({
    meta: [
      { title: "Explore Gatherings · Ideal Gathering" },
      {
        name: "description",
        content:
          "Browse upcoming gatherings around a subject at cafes and restaurants near you.",
      },
    ],
  }),
});

function Explore() {
  const t = useT();
  const { data: gatherings, isLoading } = useQuery({
    queryKey: ["gatherings", "approved"],
    queryFn: fetchApprovedGatherings,
  });

  const empty = !isLoading && (!gatherings || gatherings.length === 0);

  return (
    <div className="min-h-screen bg-background">
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
              <GatheringCard key={g.id} g={g} />
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
