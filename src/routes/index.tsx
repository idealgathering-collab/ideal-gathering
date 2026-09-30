import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { HavatoWaitlist } from "@/components/landing/havato-waitlist";
import { useSession } from "@/hooks/use-session";
import { homePathForUser } from "@/lib/roles";
import { localizedHead, type SeoLang } from "@/lib/seo";
export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { lang?: SeoLang } =>
    search.lang === "en" || search.lang === "fa" ? { lang: search.lang } : {},
  head: ({ match }) => localizedHead("/", match.search.lang ?? "fa"),
  component: Home,
});
function Home() {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && session)
      homePathForUser(session.user.id).then((to) => navigate({ to, replace: true }));
  }, [loading, session, navigate]);
  return <HavatoWaitlist />;
}
