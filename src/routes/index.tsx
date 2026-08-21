import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { useT } from "@/i18n";
import {
  localizedHead,
  normalizeLang,
  jsonLdOrganization,
  jsonLdWebSite,
  type SeoLang,
} from "@/lib/seo";
import { useSession } from "@/hooks/use-session";
import { PublicHeader } from "@/components/landing/public-header";
import { CosmicBackdrop } from "@/components/cosmic-backdrop";
import {
  DemoSection,
  FeaturesSection,
  FinalCtaSection,
  HowSection,
  MatchingSection,
  ProblemSection,
  TractionSection,
  VenuesSection,
  VisionSection,
} from "@/components/landing/sections";
import { Reveal } from "@/components/landing/reveal";
import { SiteFooter } from "@/components/site-footer";
import constellationAsset from "@/assets/constellation-people.png.asset.json";
import logoAsset from "@/assets/ideal-gathering-logo.png.asset.json";

export const Route = createFileRoute("/")({
  component: Home,
  validateSearch: (search: Record<string, unknown>): { lang?: SeoLang } =>
    search.lang === "tr" || search.lang === "fa" ? { lang: search.lang } : {},
  head: ({ match }) => {
    const seo = localizedHead("/", match.search.lang);
    return {
      links: [
        {
          rel: "preload",
          as: "image",
          href: constellationAsset.url,
          type: "image/jpeg",
          fetchPriority: "high",
        },
        ...seo.links,
      ],
      meta: [...seo.meta, { property: "og:type", content: "website" }],
      scripts: [
        ...seo.scripts,
        {
          type: "application/ld+json",
          children: JSON.stringify(jsonLdOrganization(normalizeLang(match.search.lang))),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(jsonLdWebSite(normalizeLang(match.search.lang))),
        },
      ],
    };
  },
});

function HeroSection() {
  const t = useT();
  return (
    <section className="relative z-10 flex min-h-[100dvh] items-center px-4 pb-16 pt-28 sm:pt-32">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="text-center lg:text-start">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[rgba(196,181,253,0.85)]">
              <Sparkles className="h-3 w-3 text-sunshine" />
              {t("landing.v3.hero.eyebrow")}
            </div>
          </Reveal>

          <Reveal delay={70}>
            <h1 className="font-serif-warm animate-headline-glow mt-6 whitespace-pre-line text-[38px] font-extrabold leading-[1.04] tracking-[-0.03em] text-white sm:text-[56px] lg:text-[62px]">
              {t("landing.v3.hero.title")}
            </h1>
          </Reveal>

          <Reveal delay={140}>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[rgba(221,214,254,0.82)] sm:text-lg lg:mx-0">
              {t("landing.v3.hero.sub")}
            </p>
          </Reveal>

          <Reveal delay={210}>
            <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="cosmic-cta inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white"
              >
                {t("landing.v3.hero.cta")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <a
                href="#demo"
                className="cosmic-outline-btn inline-flex items-center justify-center rounded-full px-7 py-4 text-base font-medium"
              >
                {t("landing.v3.hero.secondary")}
              </a>
              <Link
                to="/waitlist"
                className="cosmic-outline-btn inline-flex items-center justify-center rounded-full px-7 py-4 text-base font-medium"
              >
                {t("landing.v3.hero.waitlist")}
              </Link>
            </div>
          </Reveal>

          <Reveal delay={280}>
            <p className="mt-6 text-xs uppercase tracking-[0.14em] text-[rgba(196,181,253,0.55)]">
              {t("landing.v3.hero.note")}
            </p>
          </Reveal>
        </div>

        <Reveal delay={160} className="relative">
          <div
            aria-hidden
            className="cosmic-aura pointer-events-none absolute -inset-8 -z-10 rounded-[60px] blur-2xl"
            style={{
              background:
                "radial-gradient(ellipse at 50% 45%, rgba(124,58,237,0.45) 0%, rgba(167,139,250,0.2) 45%, transparent 72%)",
            }}
          />
          <div className="cosmic-panel overflow-hidden p-3">
            <img
              src={constellationAsset.url}
              alt="Friends sharing a table at a candlelit cafe with one empty chair"
              width={800}
              height={800}
              sizes="(max-width: 1024px) 90vw, 520px"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="h-auto w-full rounded-[24px] object-cover"
            />
            <div className="flex items-center gap-3 px-3 py-4">
              <img
                src={logoAsset.url}
                alt=""
                aria-hidden
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-contain"
              />
              <p className="text-xs leading-relaxed text-[rgba(196,181,253,0.72)]">
                {t("landing.v3.hero.caption")}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Home() {
  const { session, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [loading, session, navigate]);

  if (loading) {
    return (
      <div className="landing-dark cosmic-scene relative flex min-h-[100dvh] items-center justify-center overflow-hidden">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  return (
    <div className="landing-dark cosmic-scene relative z-0 overflow-hidden">
      <PublicHeader />

      <CosmicBackdrop />

      <main>
        <HeroSection />
        <DemoSection />
        <HowSection />
        <MatchingSection />
        <ProblemSection />
        <FeaturesSection />
        <VenuesSection />
        <TractionSection />
        <VisionSection />
        <FinalCtaSection />
      </main>

      <div className="relative z-20">
        <SiteFooter />
      </div>
    </div>
  );
}
