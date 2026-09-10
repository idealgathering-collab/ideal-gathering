import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchRoles } from "@/lib/roles";
import { getOwnerActivity } from "@/lib/owner.functions";
import logoAsset from "@/assets/ideal-gathering-logo.png.asset.json";

export const Route = createFileRoute("/_authenticated/owner/activity")({
  beforeLoad: async ({ context }) => {
    const roles = await fetchRoles(context.user.id);
    if (!roles.has("owner")) throw redirect({ to: "/admin", replace: true });
  },
  head: () => ({
    meta: [
      { title: "Activity — Owner — Ideal Gathering" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OwnerActivityPage,
});

function OwnerActivityPage() {
  const activity = useQuery({
    queryKey: ["owner-activity"],
    queryFn: getOwnerActivity,
    refetchInterval: 10_000,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/owner" className="flex items-center gap-2">
            <img src={logoAsset.url} alt="" className="h-9 w-9 rounded-full object-contain" />
            <span className="font-display text-lg">Ideal <span className="italic text-primary">Gathering</span></span>
            <Badge variant="outline" className="ms-1 rounded-full">Owner · Activity</Badge>
          </Link>
          <Button asChild variant="ghost" className="rounded-full">
            <Link to="/owner"><ArrowLeft className="me-2 h-4 w-4" />Back to Owner</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 pb-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <Activity className="h-4 w-4 text-primary" /> Platform timeline
            </div>
            <h1 className="mt-2 font-display text-4xl">Activity</h1>
            <p className="mt-2 text-sm text-muted-foreground">Registrations, member creation, invitations and gatherings in one chronological stream.</p>
          </div>
          <Badge variant="outline" className="rounded-full">Auto refresh · 10s</Badge>
        </div>

        <section className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-soft">
          {activity.isLoading && <p className="py-12 text-center text-sm text-muted-foreground">Loading activity…</p>}
          {activity.isError && <p className="py-12 text-center text-sm text-destructive">{activity.error instanceof Error ? activity.error.message : "Could not load activity."}</p>}
          {!activity.isLoading && !activity.isError && (activity.data?.length ?? 0) === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">No activity yet.</p>
          )}
          <div className="divide-y divide-border">
            {(activity.data ?? []).map((item, index) => (
              <div key={`${item.type}-${item.created_at}-${index}`} className="flex gap-4 py-4">
                <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{item.title}</p>
                      <Badge variant="secondary" className="rounded-full text-[10px]">{item.type}</Badge>
                    </div>
                    <time className="text-xs text-muted-foreground">{formatDate(item.created_at)}</time>
                  </div>
                  {item.detail && <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}
