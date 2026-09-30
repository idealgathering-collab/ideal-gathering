import { createFileRoute } from "@tanstack/react-router";
import { HavatoWaitlist } from "@/components/landing/havato-waitlist";
import { localizedHead, type SeoLang } from "@/lib/seo";
export const Route = createFileRoute("/waitlist")({
  validateSearch: (search: Record<string, unknown>): { lang?: SeoLang } =>
    search.lang === "en" || search.lang === "fa" ? { lang: search.lang } : {},
  head: ({ match }) => localizedHead("/waitlist", match.search.lang ?? "fa"),
  component: HavatoWaitlist,
});
