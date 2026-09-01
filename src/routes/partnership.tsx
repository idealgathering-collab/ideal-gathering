import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { PublicHeader } from "@/components/landing/public-header";
import { CosmicBackdrop } from "@/components/cosmic-backdrop";
import { SiteFooter } from "@/components/site-footer";
import { VenueDashboardPreview } from "@/components/venue-dashboard-preview";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";
import { localizedHead, type SeoLang } from "@/lib/seo";

export const Route = createFileRoute("/partnership")({
  validateSearch: (search: Record<string, unknown>): { lang?: SeoLang } =>
    search.lang === "ru" || search.lang === "fa" ? { lang: search.lang } : {},
  head: ({ match }) => localizedHead("/partnership", match.search.lang),
  component: Partnership,
});

function Partnership() {
  const t = useT();
  const points = [t("b2b.point1"), t("b2b.point2"), t("b2b.point3")];
  const feats = [t("b2b.feat1"), t("b2b.feat2"), t("b2b.feat3")];

  return (
    <div className="landing-dark cosmic-scene relative z-0 min-h-screen overflow-hidden bg-background">
      <PublicHeader anchors={[]} fillOnScroll={false} />
      <CosmicBackdrop />

      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-28 sm:pb-28 sm:pt-36">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-tangerine/20 px-3 py-1 text-xs font-medium uppercase tracking-wide text-tangerine-foreground">
              {t("partner.eyebrow")}
            </div>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl">
              {t("b2b.title1")}{" "}
              <span className="italic text-tangerine">{t("b2b.title2")}</span>
            </h1>
            <p className="mt-4 text-muted-foreground">{t("partner.intro")}</p>

            <h2 className="mt-8 font-display text-xl">{t("partner.how.title")}</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {points.map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Button asChild size="lg" className="rounded-full">
                <Link to="/venue/auth">
                  {t("b2b.register")} <ArrowRight className="ms-1 h-4 w-4 rtl:rotate-180" />
                </Link>
              </Button>
            </div>
          </div>

          <VenueDashboardPreview />
        </div>

        <div className="mt-14 grid gap-3 sm:grid-cols-3">
          {feats.map((label) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-warm text-tangerine-foreground">
                <Check className="h-4 w-4" />
              </span>
              {label}
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 bg-gradient-hero">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-20 text-primary-foreground sm:grid-cols-[1.2fr_1fr] sm:items-center">
          <div>
            <h2 className="font-display text-4xl sm:text-5xl">
              {t("partner.cta.title")}
            </h2>
            <p className="mt-3 max-w-xl text-primary-foreground/85">
              {t("partner.cta.body")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 sm:justify-end">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-sunshine text-sunshine-foreground hover:bg-sunshine/90 shadow-tangerine"
            >
              <Link to="/venue/auth">{t("b2b.register")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="relative z-10"><SiteFooter /></div>
    </div>
  );
}
