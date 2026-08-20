import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { GatheringCard } from "@/components/gathering-card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import type { GatheringCard as GCard } from "@/lib/gatherings";
import { useT } from "@/i18n";

export const Route = createFileRoute("/_authenticated/my-gatherings")({
  component: MyGatherings,
  head: () => ({
    meta: [
      { title: "My Gatherings — Ideal Gathering" },
      { name: "description", content: "Gatherings you are attending and hosting." },
    ],
  }),
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

function MyGatherings() {
  const { user } = useSession();
  const t = useT();
  const nowIso = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

  const { data, isLoading } = useQuery({
    queryKey: ["my-gatherings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [hostedRes, attendedIdsRes] = await Promise.all([
        supabase
          .from("gatherings")
          .select(SELECT)
          .eq("host_id", user!.id)
          .gte("starts_at", nowIso)
          .neq("status", "rejected")
          .neq("status", "cancelled")
          .order("starts_at", { ascending: true }),
        supabase.from("gathering_attendees").select("gathering_id").eq("user_id", user!.id),
      ]);
      if (hostedRes.error) throw hostedRes.error;
      if (attendedIdsRes.error) throw attendedIdsRes.error;

      const attendedIds = (attendedIdsRes.data ?? []).map((r) => r.gathering_id);
      let attended: Row[] = [];
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
        attended = (res.data ?? []) as Row[];
      }
      // Exclude hosted from attending list to avoid duplicates
      const hostedIds = new Set(((hostedRes.data ?? []) as Row[]).map((r) => r.id));
      return {
        hosted: ((hostedRes.data ?? []) as Row[]).map(toCard),
        attending: attended.filter((r) => !hostedIds.has(r.id)).map(toCard),
      };
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground">{t("myg.eyebrow")}</p>
            <h1 className="font-display text-4xl sm:text-5xl">{t("myg.title")}</h1>
          </div>
          <Button asChild className="rounded-full">
            <Link to="/create-gathering">
              <Plus className="me-1.5 h-4 w-4" /> {t("dash.propose")}
            </Link>
          </Button>
        </div>

        <Section title={t("myg.attending")} empty={t("myg.noAttending")} loading={isLoading} items={data?.attending} />
        <Section title={t("myg.hosting")} empty={t("myg.noHosting")} loading={isLoading} items={data?.hosted} />
        <PastHosted />
      </main>
    </div>
  );
}

function PastHosted() {
  const t = useT();
  const { lang } = useI18n();
  const { user } = useSession();
  const runSummary = useServerFn(listHostAttendanceSummary);
  const { data } = useQuery({
    queryKey: ["host-attendance-summary", user?.id],
    enabled: !!user,
    queryFn: () => runSummary(),
  });

  if (!data || data.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl">{t("att.past.title")}</h2>
      <ul className="mt-4 grid gap-2">
        {data.map((s) => (
          <li key={s.gathering_id} className="rounded-2xl border border-border bg-card px-4 py-3">
            <Link to="/gatherings/$id" params={{ id: s.gathering_id }} className="font-medium hover:underline">
              {s.subject}
            </Link>
            <div className="text-xs text-muted-foreground">
              {formatDateTime(s.starts_at, lang)} · {t("att.attendedOf", { done: s.attended, total: s.joined })}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Section({
  title,
  empty,
  loading,
  items,
}: {
  title: string;
  empty: string;
  loading: boolean;
  items?: GCard[];
}) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl">{title}</h2>
      {loading ? (
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-3xl bg-card" />
          ))}
        </div>
      ) : items && items.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((g) => (
            <GatheringCard key={g.id} g={g} />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">{empty}</p>
      )}
    </section>
  );
}
