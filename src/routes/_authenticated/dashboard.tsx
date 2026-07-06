import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Store, Users } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/gatherings";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useSession();

  const { data: businesses } = useQuery({
    queryKey: ["my-businesses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, city, cover_url, venue_tables(id), gatherings(id,status)")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

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

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground">Your space</p>
            <h1 className="font-display text-4xl sm:text-5xl">Dashboard</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/register-business">
                <Store className="mr-1.5 h-4 w-4" /> Register business
              </Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link to="/create-gathering">
                <Plus className="mr-1.5 h-4 w-4" /> Propose gathering
              </Link>
            </Button>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="font-display text-2xl">Your businesses</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {businesses && businesses.length > 0 ? (
              businesses.map((b) => {
                const pending = (b.gatherings ?? []).filter((g) => g.status === "proposed").length;
                return (
                  <Link
                    key={b.id}
                    to="/businesses/$id"
                    params={{ id: b.id }}
                    className="rounded-3xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-plum"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-warm text-tangerine-foreground">
                        <Store className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-display text-xl truncate">{b.name}</div>
                        {b.city && <div className="text-xs text-muted-foreground truncate">{b.city}</div>}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{b.venue_tables?.length ?? 0} tables</span>
                      {pending > 0 && (
                        <span className="rounded-full bg-sunshine px-2 py-0.5 text-sunshine-foreground">
                          {pending} to approve
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="col-span-full rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No businesses yet.{" "}
                <Link to="/register-business" className="text-primary underline underline-offset-2">
                  Register one
                </Link>
                .
              </div>
            )}
          </div>
        </section>

        <section className="mt-12 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl">Gatherings you host</h2>
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
                        {formatDateTime(g.starts_at)} · {g.business?.name} · Table {g.table?.label}
                      </div>
                    </div>
                    <span
                      className={`ml-3 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${
                        g.status === "approved"
                          ? "bg-primary text-primary-foreground"
                          : g.status === "proposed"
                            ? "bg-sunshine text-sunshine-foreground"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {g.status}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hosted gatherings yet.</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl">Gatherings you joined</h2>
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
                        {formatDateTime(g.starts_at)} · {g.business?.name} · Table {g.table?.label}
                      </div>
                    </div>
                    <Users className="h-4 w-4 text-primary" />
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Not joined any yet.</p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
