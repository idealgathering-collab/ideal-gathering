import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
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
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-16 sm:py-20">
        <article className="prose prose-invert max-w-none">
          <h1 className="font-display text-4xl sm:text-5xl">{t("ourStory.title")}</h1>

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
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
