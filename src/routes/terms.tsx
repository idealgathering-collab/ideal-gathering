import { createFileRoute } from "@tanstack/react-router";
import { HavatoLegal } from "@/components/landing/havato-legal";
import { localizedHead, type SeoLang } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  validateSearch: (search: Record<string, unknown>): { lang?: SeoLang } =>
    search.lang === "en" || search.lang === "fa" ? { lang: search.lang } : {},
  head: ({ match }) => localizedHead("/terms", match.search.lang ?? "fa"),
  component: () => <HavatoLegal document="terms" />,
});
