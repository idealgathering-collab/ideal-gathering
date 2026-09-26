import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { MemberProfile } from "@/components/member-profile";
import { useSession } from "@/hooks/use-session";
import { useT } from "@/i18n";

export const Route = createFileRoute("/_authenticated/people/$id")({
  head: () => ({
    meta: [
      { title: "Member profile — Ideal Gathering" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
    ],
  }),
  component: PeopleProfilePage,
});

function PeopleProfilePage() {
  const { user } = useSession();
  const { id } = Route.useParams();
  const t = useT();
  if (user?.id === id) return <Navigate to="/profile" replace />;
  return (
    <div className="min-h-svh bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-6 px-4 pb-24 pt-6 sm:px-6">
        <Link
          to="/my-gatherings"
          className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
        >
          {t("life.myGatherings")}
        </Link>
        {user && <MemberProfile key={`${user.id}:${id}`} viewerId={user.id} userId={id} />}
      </main>
    </div>
  );
}
