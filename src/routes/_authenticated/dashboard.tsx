import type { ElementType } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Compass, Plus, Users, MessageCircle, Calendar, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { GatheringCard } from "@/components/gathering-card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import type { GatheringCard as GCard } from "@/lib/gatherings";
import { useT } from "@/i18n";
import { TakeQuizNudge } from "@/components/table-fit";
import { traitsFromRow } from "@/lib/matching";


export const Route = createFileRoute("/_authenticated/dashboard")({
  beforeLoad: async ({ context, location }) => {
    const userId = context.user.id;
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("onboarded_at")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!profile?.onboarded_at) {
      throw redirect({ to: "/onboarding", search: { step: "welcome" }, replace: true });
    }
    const fromOnboarding = location.searchStr.includes("onboarded=1");
    return { onboarded: true, fromOnboarding };
  },
  loader: async ({ context }) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("trait_spark, trait_curiosity, trait_warmth, trait_depth")
      .eq("id", context.user.id)
      .maybeSingle();
    if (error) throw error;
    return { traits: traitsFromRow(data) };
  },
  component: Dashboard,
  errorComponent: () => <div className="p-8 text-center text-muted-foreground">Failed to load your dashboard.</div>,
});

const SELECT =
  "id, subject, description, starts_at, seats, status, host_id, venue_name, neighborhood, city, business:businesses(id,name,city,cover_url), table:venue_tables(id,label), gathering_attendees(user_id)";

type Row = {
  id: string;
  subject: string;
  description: string | null;
  starts_at: string;
  seats: number;
  status: string;
  host_id: string;
  venue_name: string | null;
  neighborhood: string | null;
  city: string | null;
  business: GCard["business"];
  table: GCard["table"];
  gathering_attendees: Array<{ user_id: string }> | null;
};

function toCard(r: Row): GCard {
  return {
    id: r.id,
    subject: r.subject,
    description: r.description,
    starts_at: r.starts_at,
    seats: r.seats,
    venue_name: r.venue_name ?? "",
    neighborhood: r.neighborhood ?? "",
    city: r.city ?? null,
    business: r.business,
    table: r.table,
    attendee_count: r.gathering_attendees?.length ?? 0,
  };
}

function Dashboard() {
  const { user } = useSession();
  const t = useT();
  const { traits } = Route.useLoaderData();
  const nowIso = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();


  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [hostedRes, attendedIdsRes, hostedCountRes] = await Promise.all([
        supabase
          .from("gatherings")
          .select(SELECT)
          .eq("host_id", user!.id)
          .gte("starts_at", nowIso)
          .neq("status", "rejected")
          .neq("status", "cancelled")
          .order("starts_at", { ascending: true }),
        supabase.from("gathering_attendees").select("gathering_id").eq("user_id", user!.id),
        supabase
          .from("gatherings")
          .select("*", { count: "exact", head: true })
          .eq("host_id", user!.id),
      ]);
      if (hostedRes.error) throw hostedRes.error;
      if (attendedIdsRes.error) throw attendedIdsRes.error;

      const hosted = ((hostedRes.data ?? []) as Row[]).map(toCard);
      const attendedIds = (attendedIdsRes.data ?? []).map((r) => r.gathering_id);
      let attending: GCard[] = [];
      if (attendedIds.length) {
        const res = await supabase
          .from("gatherings")
          .select(SELECT)
          .in("id", attendedIds)
          .gte("starts_at", nowIso)
          .neq("status", "rejected")
          .neq("status", "cancelled")
          .order("starts_at", { ascending: true });
        if (res.error) throw res.error;
        attending = ((res.data ?? []) as Row[]).map(toCard);
      }

      const hostedIds = new Set(hosted.map((r) => r.id));
      const allUpcoming = [...hosted, ...attending.filter((r) => !hostedIds.has(r.id))];
      allUpcoming.sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));

      return {
        next: allUpcoming[0] ?? null,
        upcomingCount: allUpcoming.length,
        hostedCount: hostedCountRes.count ?? 0,
      };
    },
  });

  const next = data?.next;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground">{t("dash.eyebrow")}</p>
            <h1 className="font-display text-4xl sm:text-5xl">{t("dash.title")}</h1>
          </div>
          <Button asChild className="rounded-full">
            <Link to="/create-gathering">
              <Plus className="me-1.5 h-4 w-4" /> {t("dash.propose")}
            </Link>
          </Button>
        </div>

        {!traits && (
          <div className="mt-8">
            <TakeQuizNudge />
          </div>
        )}

        <section className="mt-10">
          <h2 className="font-display text-2xl">{t("dash.next.title")}</h2>
          {isLoading ? (
            <div className="mt-4 h-64 animate-pulse rounded-3xl bg-card" />
          ) : next ? (
            <div className="mt-4">
              <GatheringCard g={next} />
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-start gap-4 rounded-2xl border border-dashed border-border bg-card p-8">
              <p className="text-muted-foreground">{t("dash.next.none")}</p>
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/explore">
                  <Compass className="me-1.5 h-4 w-4" /> {t("dash.next.find")}
                </Link>
              </Button>
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl">{t("dash.quick.title")}</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <QuickTile icon={Compass} label={t("dash.quick.browse")} to="/explore" />
            <QuickTile icon={Plus} label={t("dash.quick.host")} to="/create-gathering" />
            <QuickTile icon={Users} label={t("dash.quick.my")} to="/my-gatherings" />
            <QuickTile icon={MessageCircle} label={t("dash.quick.chat")} to="/chat" />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl">{t("dash.summary.title")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">{t("dash.summary.upcoming")}</span>
              </div>
              <p className="mt-2 font-display text-3xl">{isLoading ? "—" : data?.upcomingCount ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">{t("dash.summary.hosted")}</span>
              </div>
              <p className="mt-2 font-display text-3xl">{isLoading ? "—" : data?.hostedCount ?? 0}</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function QuickTile({ icon: Icon, label, to }: { icon: ElementType; label: string; to: string }) {

  return (
    <Link
      to={to}
      className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-5 transition hover:bg-muted/50"
    >
      <Icon className="h-6 w-6 text-primary" />
      <span className="font-display text-base">{label}</span>
      <ArrowRight className="mt-auto h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
