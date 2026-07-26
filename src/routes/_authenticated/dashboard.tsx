import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Users, Compass } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/gatherings";
import { useI18n, useT } from "@/i18n";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useSession();
  const t = useT();
  const { lang } = useI18n();

  const { data: hosted } = useQuery({
    queryKey: ["my-hosted", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gatherings")
        .select("id, subject, starts_at, status, business:businesses(name), table:venue_tables(label)")
        .eq("host_id", user!.id)
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: joined } = useQuery({
    queryKey: ["my-joined", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gathering_attendees")
        .select("gathering:gatherings(id,subject,starts_at,status,business:businesses(name),table:venue_tables(label))")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.gathering).filter(Boolean) as Array<{
        id: string;
        subject: string;
        starts_at: string;
        status: string;
        business: { name: string } | null;
        table: { label: string } | null;
      }>;
    },
  });

  function statusLabel(s: string) {
    if (s === "approved") return t("dash.status.approved");
    if (s === "proposed") return t("dash.status.proposed");
    if (s === "rejected") return t("dash.status.rejected");
    if (s === "cancelled") return t("dash.status.cancelled");
    return s;
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground">{t("dash.eyebrow")}</p>
            <h1 className="font-display text-4xl sm:text-5xl">{t("dash.title")}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/explore">
                <Compass className="me-1.5 h-4 w-4" /> {t("nav.explore")}
              </Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link to="/create-gathering">
                <Plus className="me-1.5 h-4 w-4" /> {t("dash.propose")}
              </Link>
            </Button>
          </div>
        </div>

        <section className="mt-10 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl">{t("dash.hosted")}</h2>
            <div className="mt-4 grid gap-3">
              {hosted && hosted.length > 0 ? (
                hosted.map((g) => (
                  <Link
                    key={g.id}
                    to="/gatherings/$id"
                    params={{ id: g.id }}
                    className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <div className="font-display text-lg truncate">{g.subject}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {formatDateTime(g.starts_at, lang)} · {g.business?.name} · {t("card.table")} {g.table?.label}
                      </div>
                    </div>
                    <span
                      className={`ms-3 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${
                        g.status === "approved"
                          ? "bg-primary text-primary-foreground"
                          : g.status === "proposed"
                            ? "bg-sunshine text-sunshine-foreground"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {statusLabel(g.status)}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{t("dash.noHosted")}</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl">{t("dash.joined")}</h2>
            <div className="mt-4 grid gap-3">
              {joined && joined.length > 0 ? (
                joined.map((g) => (
                  <Link
                    key={g.id}
                    to="/gatherings/$id"
                    params={{ id: g.id }}
                    className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <div className="font-display text-lg truncate">{g.subject}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {formatDateTime(g.starts_at, lang)} · {g.business?.name} · {t("card.table")} {g.table?.label}
                      </div>
                    </div>
                    <Users className="h-4 w-4 text-primary" />
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{t("dash.noJoined")}</p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
