import { createFileRoute } from "@tanstack/react-router";
import { PublicHeader } from "@/components/landing/public-header";
import { CosmicBackdrop } from "@/components/cosmic-backdrop";
import { SiteFooter } from "@/components/site-footer";
import { useT } from "@/i18n";
import { localizedHead, type SeoLang } from "@/lib/seo";

export const Route = createFileRoute("/our-story")({
  validateSearch: (search: Record<string, unknown>): { lang?: SeoLang } =>
    search.lang === "tr" || search.lang === "fa" ? { lang: search.lang } : {},
  head: ({ match }) => localizedHead("/our-story", match.search.lang),
  component: OurStoryPage,
});

function OurStoryPage() {
  const t = useT();
  return (
    <div className="landing-dark cosmic-scene relative z-0 min-h-screen overflow-hidden bg-background">
      <PublicHeader anchors={[]} fillOnScroll={false} />
      <CosmicBackdrop />
      <main className="relative z-10 mx-auto max-w-2xl px-4 pb-16 pt-28 sm:pb-20 sm:pt-32">
        <h1 className="font-display text-4xl sm:text-5xl text-dark-heading">{t("ourStory.title")}</h1>

        <div className="mt-10 space-y-6 text-lg leading-8 text-foreground/85">
          <p>{t("ourStory.p1")}</p>
          <p>{t("ourStory.p2")}</p>
          <p>{t("ourStory.p3")}</p>
          <p>{t("ourStory.p4")}</p>
          <p>{t("ourStory.p5")}</p>
          <p>{t("ourStory.p6")}</p>
          <p>{t("ourStory.p7")}</p>
          <p>{t("ourStory.p8")}</p>
        </div>

        <p className="mt-10 text-base font-medium text-foreground/70">
          {t("ourStory.signature")}
        </p>
      </main>
      <div className="relative z-10"><SiteFooter /></div>
    </div>
  );
}
