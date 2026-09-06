import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, KeyRound, Sparkles, Store } from "lucide-react";
import { useT } from "@/i18n";
import {
  localizedHead,
  normalizeLang,
  jsonLdOrganization,
  jsonLdWebSite,
  type SeoLang,
} from "@/lib/seo";
import { useSession } from "@/hooks/use-session";
import { homePathForUser } from "@/lib/roles";
import { CosmicBackdrop } from "@/components/cosmic-backdrop";
import { Reveal } from "@/components/landing/reveal";
import {
  CategoriesSection,
  DemoSection,
  DiffSection,
  HowSection,
  MatchingSection,
  SafetySection,
  VenuesSection,
  VisionSection,
} from "@/components/landing/sections";
import { SiteFooter } from "@/components/site-footer";
import { LanguageSwitcher } from "@/components/language-switcher";
import constellationAsset from "@/assets/constellation-people.png.asset.json";
import logoAsset from "@/assets/ideal-gathering-logo.png.asset.json";

export const Route = createFileRoute("/")({
  component: Home,
  validateSearch: (search: Record<string, unknown>): { lang?: SeoLang } =>
    search.lang === "ru" || search.lang === "fa" ? { lang: search.lang } : {},
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

function Home() {
  const t = useT();
  const { session, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) {
      homePathForUser(session.user.id).then((to) => navigate({ to, replace: true }));
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
    <div className="landing-dark cosmic-scene relative z-0 min-h-[100dvh] overflow-hidden">
      <CosmicBackdrop />

      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6">
        <Link to="/" className="flex items-center gap-2 text-white">
          <img src={logoAsset.url} alt="" aria-hidden className="h-9 w-9 rounded-full object-contain" />
          <span className="font-display text-lg">
            Ideal <span className="italic text-nebula-violet">Gathering</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link
            to="/auth"
            search={{ mode: "signin" }}
            className="cosmic-outline-btn hidden rounded-full px-5 py-2 text-sm font-medium sm:inline-flex"
          >
            {t("nav.signIn")}
          </Link>
        </div>
      </header>

      <main>
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-4 pb-20 pt-6 text-center sm:pt-12">
        <Reveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[rgba(196,181,253,0.85)]">
            <Sparkles className="h-3 w-3 text-sunshine" />
            {t("beta.badge")}
          </div>
        </Reveal>

        <Reveal delay={70}>
          <h1 className="font-serif-warm animate-headline-glow mt-7 text-[46px] font-extrabold leading-[1.03] tracking-[-0.04em] text-white sm:text-[76px]">
            {t("beta.hero.title")}
          </h1>
        </Reveal>

        <Reveal delay={140}>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[rgba(221,214,254,0.82)] sm:text-lg">
            {t("beta.hero.sub")}
          </p>
        </Reveal>

        <Reveal delay={210}>
          <div className="mt-10 flex w-full flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              to="/waitlist"
              className="cosmic-cta inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white"
            >
              {t("beta.cta.waitlist")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
            <Link
              to="/invite"
              className="cosmic-outline-btn inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 text-base font-medium"
            >
              <KeyRound className="h-4 w-4" />
              {t("beta.cta.invite")}
            </Link>
          </div>
        </Reveal>

        <Reveal delay={260}>
          <Link
            to="/venue/auth"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-medium text-[rgba(221,214,254,0.9)] transition hover:bg-white/[0.09]"
          >
            <Store className="h-4 w-4" />
            {t("beta.cta.venue")}
          </Link>
        </Reveal>

        <Reveal delay={320} className="w-full">
          <div className="cosmic-panel mx-auto mt-14 max-w-3xl overflow-hidden p-3">
            <img
              src={constellationAsset.url}
              alt="Friends sharing a table at a candlelit cafe with one empty chair"
              width={800}
              height={800}
              sizes="(max-width: 900px) 92vw, 700px"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="h-auto w-full rounded-[24px] object-cover"
            />
            <p className="px-3 py-4 text-xs leading-relaxed text-[rgba(196,181,253,0.72)]">
              {t("beta.hero.caption")}
            </p>
          </div>
        </Reveal>

        <Reveal delay={360}>
          <p className="mt-8 text-xs uppercase tracking-[0.14em] text-[rgba(196,181,253,0.55)]">
            {t("beta.hero.note")}
          </p>
        </Reveal>
      </div>

        <HowSection />
        <CategoriesSection />
        <DiffSection />
        <MatchingSection betaCta />
        <DemoSection betaCta />
        <SafetySection />
        <VenuesSection />
        <VisionSection />
      </main>

      <div className="relative z-20">
        <SiteFooter />
      </div>
    </div>
  );
}
