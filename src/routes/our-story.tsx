import { createFileRoute } from "@tanstack/react-router";
import { HavatoStory } from "@/components/landing/havato-story";
import { localizedHead, type SeoLang } from "@/lib/seo";

export const Route = createFileRoute("/our-story")({
  validateSearch: (search: Record<string, unknown>): { lang?: SeoLang } =>
    search.lang === "en" || search.lang === "fa" || search.lang === "ru"
      ? { lang: search.lang }
      : {},
  head: ({ match }) => localizedHead("/our-story", match.search.lang ?? "fa"),
  component: HavatoStory,
});
