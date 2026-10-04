import { createFileRoute } from "@tanstack/react-router";
import { HavatoWaitlist } from "@/components/landing/havato-waitlist";
import { localizedHead, type SeoLang } from "@/lib/seo";

// Retain the old public URL with the current controlled Early Access page.
export const Route = createFileRoute("/preview")({
  validateSearch: (search: Record<string, unknown>): { lang?: SeoLang } =>
    search.lang === "en" || search.lang === "fa" ? { lang: search.lang } : {},
  head: ({ match }) => {
    const head = localizedHead("/", match.search.lang ?? "fa");
    return { ...head, meta: [...head.meta, { name: "robots", content: "noindex" }] };
  },
  component: HavatoWaitlist,
});
