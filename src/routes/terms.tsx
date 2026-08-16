import { createFileRoute } from "@tanstack/react-router";
import { PublicHeader } from "@/components/landing/public-header";
import { CosmicBackdrop } from "@/components/cosmic-backdrop";
import { SiteFooter } from "@/components/site-footer";
import { useT } from "@/i18n";
import { localizedHead, type SeoLang } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  validateSearch: (search: Record<string, unknown>): { lang?: SeoLang } =>
    search.lang === "tr" || search.lang === "fa" ? { lang: search.lang } : {},
  head: ({ match }) => localizedHead("/terms", match.search.lang),
  component: TermsPage,
});

function TermsPage() {
  const t = useT();
  return (
    <div className="landing-dark cosmic-scene relative z-0 min-h-screen overflow-hidden bg-background">
      <PublicHeader anchors={[]} fillOnScroll={false} />
      <CosmicBackdrop />
      <main className="relative z-10 mx-auto max-w-3xl px-4 pb-12 pt-28">
        <h1 className="font-display text-4xl">{t("terms.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("terms.updated")}</p>

        <Section title={t("terms.accept.title")} body={t("terms.accept.body")} />
        <Section title={t("terms.use.title")} body={t("terms.use.body")} />
        <Section title={t("terms.conduct.title")} body={t("terms.conduct.body")} />
        <Section title={t("terms.hosts.title")} body={t("terms.hosts.body")} />
        <Section title={t("terms.content.title")} body={t("terms.content.body")} />
        <Section title={t("terms.termination.title")} body={t("terms.termination.body")} />
        <Section title={t("terms.liability.title")} body={t("terms.liability.body")} />
        <Section title={t("terms.law.title")} body={t("terms.law.body")} />
        <Section title={t("terms.contact.title")} body={t("terms.contact.body")} />
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
