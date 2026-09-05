import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, MessageSquareMore } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ProfileCard, ProfileCardSkeleton } from "@/components/profile-card";
import { loadProfileCard } from "@/lib/profile-card.functions";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";
import type { ProfileCardData } from "@/lib/profile-card";

export const Route = createFileRoute("/_authenticated/people/$id")({
  head: () => ({
    meta: [
      { title: "Member profile — Ideal Gathering" },
      {
        name: "description",
        content: "See who you're sharing a table with: their vibe, interests and what they're looking for.",
      },
      { property: "og:title", content: "Member profile — Ideal Gathering" },
      {
        property: "og:description",
        content: "See who you're sharing a table with: their vibe, interests and what they're looking for.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),

  component: PeopleProfilePage,
});

function PeopleProfilePage() {
  const t = useT();
  const navigate = useNavigate();
  const router = useRouter();
  const { user } = useSession();
  
  const { id: userId } = Route.useParams();
  const isSelf = user?.id === userId;

  const [profile, setProfile] = useState<ProfileCardData | null>(null);
  const [viewerProfile, setViewerProfile] = useState<ProfileCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load both the viewed profile and the viewer's profile
  useEffect(() => {
    setLoading(true);
    Promise.all([
      loadProfileCard(userId),
      user ? loadProfileCard(user.id) : Promise.resolve(null),
    ])
      .then(([p, viewerP]) => {
        setProfile(p);
        setViewerProfile(viewerP);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error("Failed to load profile"));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId, user?.id]);

  const handleMessageClick = () => {
    navigate({ to: "/chat" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 pb-28 pt-6 sm:pb-16 sm:pt-10">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.history.back()}
              className="h-9 w-9 bg-white/10 border-white/20 hover:bg-white/20 text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="font-display text-xl text-white">{t("profile.loading")}</h1>
          </div>
          <ProfileCardSkeleton darkTheme={true} />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 pb-28 pt-6 sm:pb-16 sm:pt-10">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.history.back()}
              className="h-9 w-9 bg-white/10 border-white/20 hover:bg-white/20 text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="font-display text-xl text-white">{t("profile.title")}</h1>
          </div>
          <div className="rounded-3xl border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">{t("profile.error")}</p>
            <p className="mt-2 text-sm text-muted-foreground/70">{error.message}</p>
            <Button className="mt-4" onClick={() => navigate({ to: "/" })}>
              {t("nav.goHome")}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 pb-28 pt-6 sm:pb-16 sm:pt-10">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.history.back()}
              className="h-9 w-9 bg-white/10 border-white/20 hover:bg-white/20 text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="font-display text-xl text-white">{t("profile.notFound")}</h1>
          </div>
          <div className="rounded-3xl border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">{t("profile.notFoundMessage")}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pb-28 pt-6 sm:pb-16 sm:pt-10">
        {/* Back button and header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.history.back()}
            className="h-9 w-9 bg-white/10 border-white/20 hover:bg-white/20 text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="font-display text-xl text-white">{t("profile.title")}</h1>
        </div>

        {/* Profile card with dark theme - EXACT from image */}
        <ProfileCard
          profile={profile}
          darkTheme={true}
          interactive={true}
          isSelf={isSelf}
          viewerProfile={viewerProfile}
          
          showMatchBreakdown={!isSelf}
          onStoryItemClick={(item) => {
            navigate({ to: "/gatherings/$id", params: { id: item.gatheringId } });
          }}
        />

        {/* Message button (only for other users) - EXACT from image */}
        {!isSelf && (
          <div className="mt-6 flex justify-center">
            <Button
              onClick={handleMessageClick}
              className="w-full max-w-sm rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-purple-500/30 transition-all"
              size="lg"
            >
              <MessageSquareMore className="mr-2 h-5 w-5" />
              {t("profile.messageButton")}
            </Button>
          </div>
        )}

        {/* Self profile link */}
        {isSelf && (
          <div className="mt-6 text-center">
            <Link
              to="/profile"
              className="text-sm text-purple-400 hover:text-purple-300"
            >
              {t("profile.viewFullProfile")}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
