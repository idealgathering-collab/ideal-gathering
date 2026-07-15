import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useT } from "@/i18n";
import { formatDateTime } from "@/lib/gatherings";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Ideal Gathering" }] }),
  component: AdminPage,
});

type AdminGathering = {
  id: string;
  subject: string;
  starts_at: string;
  seats: number;
  status: string;
  venue_name: string | null;
  neighborhood: string | null;
  host_id: string;
};

function AdminPage() {
  const t = useT();
  const { user, loading } = useSession();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<AdminGathering[]>([]);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    if (loading || !user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setAllowed(!!data));
  }, [user, loading]);

  useEffect(() => {
    if (!allowed) return;
    supabase
      .from("gatherings")
      .select("id, subject, starts_at, seats, status, venue_name, neighborhood, host_id")
      .in("status", ["proposed", "approved"])
      .order("starts_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        else setRows((data as AdminGathering[]) ?? []);
      });
  }, [allowed, refreshTick]);

  async function setStatus(id: string, status: "approved" | "rejected" | "cancelled") {
    const { error } = await supabase.from("gatherings").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(t(`admin.set.${status}`));
      setRefreshTick((n) => n + 1);
    }
  }

  if (loading || allowed === null) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-4xl px-4 py-12 text-sm text-muted-foreground">
          {t("common.loading")}
        </main>
      </div>
    );
  }
  if (!allowed) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-4 py-16 text-center">
          <h1 className="font-display text-3xl">{t("admin.forbidden.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("admin.forbidden.body")}</p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/">{t("common.home")}</Link>
          </Button>
        </main>
      </div>
    );
  }

  const pending = rows.filter((r) => r.status === "proposed");
  const live = rows.filter((r) => r.status === "approved");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="font-display text-4xl">{t("admin.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("admin.subtitle")}</p>

        <Tabs defaultValue="pending" className="mt-8">
          <TabsList>
            <TabsTrigger value="pending">
              {t("admin.tab.pending")} ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="live">
              {t("admin.tab.live")} ({live.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            {pending.length === 0 ? (
              <Empty text={t("admin.empty.pending")} />
            ) : (
              <div className="grid gap-3">
                {pending.map((g) => (
                  <Row key={g.id} g={g}>
                    <Button size="sm" className="rounded-full" onClick={() => setStatus(g.id, "approved")}>
                      {t("admin.approve")}
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => setStatus(g.id, "rejected")}>
                      {t("admin.reject")}
                    </Button>
                  </Row>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="live" className="mt-4">
            {live.length === 0 ? (
              <Empty text={t("admin.empty.live")} />
            ) : (
              <div className="grid gap-3">
                {live.map((g) => (
                  <Row key={g.id} g={g}>
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => setStatus(g.id, "cancelled")}>
                      {t("admin.cancel")}
                    </Button>
                  </Row>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Row({ g, children }: { g: AdminGathering; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="min-w-0 flex-1">
        <div className="font-display text-lg">{g.subject}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {g.venue_name ?? "—"} · {g.neighborhood ?? "—"} · {formatDateTime(g.starts_at)} · {g.seats} seats
        </div>
      </div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{text}</p>;
}
