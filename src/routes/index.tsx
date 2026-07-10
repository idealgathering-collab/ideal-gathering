import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  Coffee,
  Armchair,
  ArrowRight,
  Check,
  BarChart3,
  Gavel,
  Users,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GatheringCard } from "@/components/gathering-card";
import {
  SampleGatheringCard,
  SAMPLE_GATHERINGS,
} from "@/components/sample-gathering-card";
import { HeroPoster } from "@/components/hero-poster";
import { VenueDashboardPreview } from "@/components/venue-dashboard-preview";
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

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* ============ HERO ============ */}
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
              <Button
                asChild
                size="lg"
                className="rounded-full bg-sunshine text-sunshine-foreground hover:bg-sunshine/90 shadow-tangerine"
              >
                <Link to="/waitlist">{t("home.hero.joinWaitlist")}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link to="/register-business">
                  {t("home.hero.registerCafe")} <ArrowRight className="ml-1 h-4 w-4" />
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

      {/* ============ HOW IT WORKS ============ */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            How it works
          </div>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl">
            Three steps to your <span className="italic text-primary">next table.</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            No endless swiping. No awkward group chats. Just a seat waiting for you.
          </p>
        </div>

        <div className="relative mt-14 grid gap-6 sm:grid-cols-3">
          <div
            aria-hidden
            className="pointer-events-none absolute left-[16.66%] right-[16.66%] top-8 hidden h-px border-t-2 border-dashed border-border sm:block"
          />
          {[
            {
              n: "01",
              icon: Sparkles,
              title: "Tell us your vibe",
              body: "A quick, seamless personality and interest snapshot — no long forms.",
            },
            {
              n: "02",
              icon: Armchair,
              title: "Grab a seat",
              body: "Pick a curated topic table at a top local partner cafe near you.",
            },
            {
              n: "03",
              icon: Coffee,
              title: "Just show up",
              body: "Meet your hand-picked small group. Skip the small talk. Connect.",
            },
          ].map((s) => (
            <div
              key={s.n}
              className="relative rounded-3xl border border-border bg-card p-6 shadow-soft"
            >
              <div className="relative z-10 mx-auto grid h-16 w-16 -translate-y-10 place-items-center rounded-2xl bg-gradient-cool text-primary-foreground shadow-plum">
                <s.icon className="h-6 w-6" />
              </div>
              <div className="-mt-6 text-center">
                <div className="font-display text-sm tracking-widest text-muted-foreground">
                  {s.n}
                </div>
                <h3 className="mt-1 font-display text-2xl">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ UPCOMING GATHERINGS ============ */}
      <section id="tables" className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-xs font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Live feed
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

      {/* ============ B2B PARTNER SECTION ============ */}
      <section id="partners" className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-tangerine/20 px-3 py-1 text-xs font-medium uppercase tracking-wide text-tangerine-foreground">
              For cafes & restaurants
            </div>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl">
              A marketplace that fills your{" "}
              <span className="italic text-tangerine">quiet hours.</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Ideal Gathering isn't a discount app. Partner venues get analytics,
              bidding tools, and a targeted stream of guests who came to actually
              stay, order, and talk.
            </p>

            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Table utilization analytics across every hour of the week",
                "Bid on promotional placement to fill your quiet hours",
                "Targeted, high-intent guest traffic — no coupon hunters",
                "Full control: approve every gathering, host your own",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full">
                <Link to="/register-business">
                  Register your venue <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full"
              >
                <a href="mailto:partners@idealgathering.co">Talk to partnerships</a>
              </Button>
            </div>
          </div>

          <VenueDashboardPreview />
        </div>

        <div className="mt-14 grid gap-3 sm:grid-cols-3">
          {[
            { icon: BarChart3, label: "Table utilization analytics" },
            { icon: Gavel, label: "Promotional placement bidding" },
            { icon: Users, label: "Targeted guest traffic" },
          ].map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-warm text-tangerine-foreground">
                <f.icon className="h-4 w-4" />
              </span>
              {f.label}
            </div>
          ))}
        </div>
      </section>

      {/* ============ TRUST / VIBE ============ */}
      <section id="vibe" className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                quote:
                  "I walked in a stranger and left with three people I actually want to see again. That never happens.",
                who: "Ayşe, guest · Kadıköy",
              },
              {
                quote:
                  "Our Tuesday afternoons used to be dead. Now they're our favorite tables of the week.",
                who: "Emre, owner · Petra Roasting Co.",
              },
            ].map((q) => (
              <figure
                key={q.who}
                className="rounded-3xl border border-border bg-card p-8 shadow-soft"
              >
                <blockquote className="font-display text-2xl leading-snug">
                  "{q.quote}"
                </blockquote>
                <figcaption className="mt-4 text-sm text-muted-foreground">
                  — {q.who}
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 opacity-70">
            {["MOC", "Petra", "Norm", "Kronotrop", "Federal"].map((n) => (
              <span
                key={n}
                className="font-display text-xl tracking-wide text-muted-foreground"
              >
                {n}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ JOIN CTA BAND ============ */}
      <section id="join" className="bg-gradient-hero">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-20 text-primary-foreground sm:grid-cols-[1.2fr_1fr] sm:items-center">
          <div>
            <h2 className="font-display text-4xl sm:text-5xl">
              Save your seat at the <span className="italic text-sunshine">next table.</span>
            </h2>
            <p className="mt-3 max-w-xl text-primary-foreground/85">
              Guests join by invitation. Drop your details and we'll open the door as
              tables free up in your city.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 sm:justify-end">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-sunshine text-sunshine-foreground hover:bg-sunshine/90 shadow-tangerine"
            >
              <Link to="/waitlist">Join the waitlist</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link to="/register-business">Register your cafe</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
