import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  Coffee,
  Armchair,
  ArrowRight,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GatheringCard } from "@/components/gathering-card";
import {
  SampleGatheringCard,
  SAMPLE_GATHERINGS,
} from "@/components/sample-gathering-card";
import { HeroPoster } from "@/components/hero-poster";
import { ManifestoSection } from "@/components/manifesto-section";
import { NeighborhoodsSection } from "@/components/neighborhoods-section";
import { Button } from "@/components/ui/button";
import { fetchApprovedGatherings } from "@/lib/gatherings";
import { useT } from "@/i18n";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const t = useT();
  const { data: gatherings, isLoading } = useQuery({
    queryKey: ["gatherings", "approved"],
    queryFn: fetchApprovedGatherings,
  });

  const hasLive = !!gatherings && gatherings.length > 0;

  const steps = [
    { n: "01", icon: Sparkles, title: t("how.s1.title"), body: t("how.s1.body") },
    { n: "02", icon: Armchair, title: t("how.s2.title"), body: t("how.s2.body") },
    { n: "03", icon: Coffee, title: t("how.s3.title"), body: t("how.s3.body") },
  ];


  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-95" />
        <div
          className="absolute inset-0 opacity-30 mix-blend-overlay"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, oklch(0.85 0.15 85) 0%, transparent 45%), radial-gradient(circle at 85% 70%, oklch(0.72 0.18 80) 0%, transparent 50%)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-12 px-4 pt-16 pb-24 sm:pt-24 sm:pb-32 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="text-primary-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-medium tracking-wide uppercase backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              {t("home.hero.badge")}
            </span>
            <h1 className="mt-6 font-display text-5xl leading-[0.95] sm:text-7xl">
              {t("home.hero.title1")}
              <br />
              <span className="italic text-sunshine">{t("home.hero.title2")}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-primary-foreground/85">
              {t("home.hero.tagline")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full bg-sunshine text-sunshine-foreground hover:bg-sunshine/90 shadow-tangerine">
                <Link to="/auth" search={{ mode: "signup" }}>{t("home.hero.signup")}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/explore">
                  {t("home.hero.explore")} <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 text-primary-foreground/90">
              {[
                { icon: Coffee, label: t("home.stats.venues"), value: t("home.stats.venuesVal") },
                { icon: Armchair, label: t("home.stats.tables"), value: t("home.stats.tablesVal") },
                { icon: Sparkles, label: t("home.stats.subjects"), value: t("home.stats.subjectsVal") },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex flex-col gap-1">
                  <Icon className="h-5 w-5 text-sunshine" />
                  <div className="font-display text-lg leading-tight">{value}</div>
                  <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <HeroPoster />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("how.badge")}
          </div>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl">
            {t("how.title1")} <span className="italic text-primary">{t("how.title2")}</span>
          </h2>
          <p className="mt-3 text-muted-foreground">{t("how.sub")}</p>
        </div>

        <div className="relative mt-14 grid gap-6 sm:grid-cols-3">
          <div
            aria-hidden
            className="pointer-events-none absolute left-[16.66%] right-[16.66%] top-8 hidden h-px border-t-2 border-dashed border-border sm:block"
          />
          {steps.map((s) => (
            <div key={s.n} className="relative rounded-3xl border border-border bg-card p-6 shadow-soft">
              <div className="relative z-10 mx-auto grid h-16 w-16 -translate-y-10 place-items-center rounded-2xl bg-gradient-cool text-primary-foreground shadow-plum">
                <s.icon className="h-6 w-6" />
              </div>
              <div className="-mt-6 text-center">
                <div className="font-display text-sm tracking-widest text-muted-foreground">{s.n}</div>
                <h3 className="mt-1 font-display text-2xl">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* UPCOMING */}
      <section id="tables" className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-xs font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                {t("sample.preview")}
              </div>
              <h2 className="mt-3 font-display text-4xl sm:text-5xl">
                {t("home.upcoming.title1")}{" "}
                <span className="italic text-primary">{t("home.upcoming.title2")}</span>
              </h2>
              <p className="mt-2 text-muted-foreground">{t("home.upcoming.subtitle")}</p>
            </div>
            <Button asChild variant="ghost" className="rounded-full">
              <Link to="/create-gathering">
                {t("home.upcoming.proposeOwn")} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-72 animate-pulse rounded-3xl bg-card" />
                ))
              : hasLive
              ? gatherings!.map((g) => <GatheringCard key={g.id} g={g} />)
              : SAMPLE_GATHERINGS.map((g) => (
                  <SampleGatheringCard key={g.topic} g={g} />
                ))}
          </div>
        </div>
      </section>

      {/* B2B TEASER */}
      <section className="mx-auto max-w-4xl px-4 py-20 sm:py-24">
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-soft sm:p-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-tangerine/20 px-3 py-1 text-xs font-medium uppercase tracking-wide text-tangerine-foreground">
            {t("b2b.badge")}
          </div>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl">
            {t("b2b.title1")}{" "}
            <span className="italic text-tangerine">{t("b2b.title2")}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{t("b2b.teaser")}</p>
          <div className="mt-8">
            <Button asChild size="lg" className="rounded-full">
              <Link to="/partnership">
                {t("b2b.learnMore")} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* MANIFESTO (replaces testimonials) */}
      <ManifestoSection />

      {/* NEIGHBORHOODS + PARTNER CAFES */}
      <NeighborhoodsSection />

      {/* JOIN CTA */}
      <section id="join" className="bg-gradient-hero">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-20 text-primary-foreground sm:grid-cols-[1.2fr_1fr] sm:items-center">
          <div>
            <h2 className="font-display text-4xl sm:text-5xl">
              {t("cta.title1")}{" "}
              <span className="italic text-sunshine">{t("cta.title2")}</span>
            </h2>
            <p className="mt-3 max-w-xl text-primary-foreground/85">{t("cta.body")}</p>
          </div>
          <div className="flex flex-wrap gap-3 sm:justify-end">
            <Button asChild size="lg" className="rounded-full bg-sunshine text-sunshine-foreground hover:bg-sunshine/90 shadow-tangerine">
              <Link to="/waitlist">{t("cta.join")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/register-business">{t("cta.register")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
