import { createFileRoute } from "@tanstack/react-router";
import { PublicHeader } from "@/components/landing/public-header";
import { CosmicBackdrop } from "@/components/cosmic-backdrop";
import { SiteFooter } from "@/components/site-footer";
import { useT } from "@/i18n";
import { localizedHead, type SeoLang } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  validateSearch: (search: Record<string, unknown>): { lang?: SeoLang } =>
    search.lang === "ru" || search.lang === "fa" ? { lang: search.lang } : {},
  head: ({ match }) => localizedHead("/privacy", match.search.lang),
  component: PrivacyPage,
});

function PrivacyPage() {
  const t = useT();
  return (
    <div className="landing-dark cosmic-scene relative z-0 min-h-screen overflow-hidden bg-background">
      <PublicHeader anchors={[]} fillOnScroll={false} />
      <CosmicBackdrop />
      <main className="relative z-10 mx-auto max-w-3xl px-4 pb-12 pt-28">
        <h1 className="font-display text-4xl">{t("privacy.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("privacy.updated")}</p>

        <Section title={t("privacy.intro.title")} body={t("privacy.intro.body")} />
        <Section title={t("privacy.collect.title")} body={t("privacy.collect.body")} />
        <Section title={t("privacy.use.title")} body={t("privacy.use.body")} />
        <Section title={t("privacy.share.title")} body={t("privacy.share.body")} />
        <Section title={t("privacy.retention.title")} body={t("privacy.retention.body")} />
        <Section title={t("privacy.rights.title")} body={t("privacy.rights.body")} />
        <Section title={t("privacy.kvkk.title")} body={t("privacy.kvkk.body")} />
        <Section title={t("privacy.contact.title")} body={t("privacy.contact.body")} />
      </main>
      <div className="relative z-10"><SiteFooter /></div>
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/80">{body}</p>
    </section>
  );
}
