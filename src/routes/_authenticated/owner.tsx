import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Building2,
  CalendarDays,
  Check,
  Crown,
  Eye,
  LogOut,
  RefreshCw,
  Shield,
  Store,
  Ticket,
  UserRoundCheck,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BetaSection } from "@/components/admin/beta-section";
import { supabase } from "@/integrations/supabase/client";
import { claimInitialOwner, fetchRoles, setAdminPreview } from "@/lib/roles";
import { getOwnerSnapshot } from "@/lib/owner.functions";
import { useSession } from "@/hooks/use-session";
import logoAsset from "@/assets/ideal-gathering-logo.png.asset.json";

export const Route = createFileRoute("/_authenticated/owner")({
  beforeLoad: async ({ context }) => {
    const roles = await fetchRoles(context.user.id);
    if (!roles.has("owner") && !roles.has("admin")) {
      throw redirect({ to: "/dashboard", replace: true });
    }
  },
  head: () => ({
    meta: [
      { title: "Owner Console — Ideal Gathering" },
      { name: "description", content: "Owner command center for Ideal Gathering." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OwnerPage,
});

function OwnerPage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const rolesQuery = useQuery({
    queryKey: ["owner-roles", user?.id],
    enabled: !!user,
    queryFn: () => fetchRoles(user!.id),
  });
  const isOwner = rolesQuery.data?.has("owner") === true;

  const snapshot = useQuery({
    queryKey: ["owner-snapshot"],
    enabled: isOwner,
    queryFn: getOwnerSnapshot,
    refetchInterval: 10_000,
  });

  async function activateOwner() {
    try {
      const ok = await claimInitialOwner();
      if (!ok) throw new Error("Owner access is already assigned to another account.");
      await rolesQuery.refetch();
      toast.success("Owner access activated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not activate owner access.");
    }
  }

  async function signOut() {
    setAdminPreview(false);
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/admin/auth", replace: true });
  }

  if (!isOwner && !rolesQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <OwnerHeader onSignOut={signOut} />
        <main className="mx-auto max-w-xl px-4 py-20">
          <section className="rounded-3xl border border-primary/20 bg-card p-8 shadow-soft">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <h1 className="mt-5 font-display text-3xl">Activate Owner Access</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              This is a one-time bootstrap. Only an existing admin can claim ownership, and it works only while the platform has no owner.
            </p>
            <Button className="mt-6 rounded-full" onClick={activateOwner}>
              <Crown className="me-2 h-4 w-4" />
              Activate Owner Access
            </Button>
          </section>
        </main>
      </div>
    );
  }

  const data = snapshot.data;
  const cards = [
    { label: "Waiting list", value: data?.waitlist ?? 0, icon: Users },
    { label: "Registered venues", value: data?.registeredVenues ?? 0, icon: Building2 },
    { label: "Pending venues", value: data?.pendingVenues ?? 0, icon: UserRoundCheck },
    { label: "Member accounts", value: data?.users ?? 0, icon: Users },
    { label: "Invitations", value: data?.invitations ?? 0, icon: Ticket },
    { label: "Gatherings today", value: data?.gatheringsToday ?? 0, icon: CalendarDays },
  ];

  return (
    <div className="min-h-screen bg-background">
      <OwnerHeader onSignOut={signOut} />
      <main className="mx-auto max-w-6xl px-4 py-10 pb-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <Crown className="h-3.5 w-3.5 text-primary" /> Owner
            </div>
            <h1 className="mt-2 font-display text-4xl sm:text-5xl">Command Center</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Monitor and control Ideal Gathering from one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-full" disabled={snapshot.isFetching} onClick={() => snapshot.refetch()}>
              <RefreshCw className={`me-2 h-4 w-4 ${snapshot.isFetching ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/admin"><Shield className="me-2 h-4 w-4" /> Staff Admin</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/owner/venue-preview"><Store className="me-2 h-4 w-4" /> Preview Venue</Link>
            </Button>
            <Button className="rounded-full" onClick={() => { setAdminPreview(true); navigate({ to: "/explore" }); }}>
              <Eye className="me-2 h-4 w-4" /> Preview Member App
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="mt-8">
          <TabsList className="flex h-auto flex-wrap justify-start gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="venues">Venue control</TabsTrigger>
            <TabsTrigger value="beta">Beta & invitations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <section className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
              <div className="flex items-center gap-3">
                <span className={`h-2.5 w-2.5 rounded-full ${data?.betaLaunched ? "bg-primary" : "bg-muted-foreground/50"}`} />
                <div>
                  <p className="text-sm font-medium">Beta access</p>
                  <p className="text-xs text-muted-foreground">Owner access bypasses this setting.</p>
                </div>
              </div>
              <Badge variant={data?.betaLaunched ? "default" : "secondary"} className="rounded-full">
                {data?.betaLaunched ? "OPEN" : "CLOSED"}
              </Badge>
            </section>

            <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
                  <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{label}</span><Icon className="h-4 w-4 text-primary" /></div>
                  <div className="mt-3 font-display text-4xl">{snapshot.isLoading ? "—" : value.toLocaleString()}</div>
                </div>
              ))}
            </section>

            <section className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display flex items-center gap-2 text-2xl"><Activity className="h-5 w-5 text-primary" /> Live Activity</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Newest registrations, invitations and gatherings.</p>
                </div>
                <Badge variant="outline" className="rounded-full">Auto · 10s</Badge>
              </div>
              <div className="mt-5 divide-y divide-border">
                {snapshot.isLoading && <p className="py-8 text-center text-sm text-muted-foreground">Loading activity…</p>}
                {!snapshot.isLoading && (data?.recentActivity.length ?? 0) === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No activity yet.</p>}
                {(data?.recentActivity ?? []).map((item, index) => (
                  <div key={`${item.type}-${item.created_at}-${index}`} className="flex gap-4 py-4">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium">{item.title}</p><time className="text-xs text-muted-foreground">{formatActivityTime(item.created_at)}</time></div>
                      {item.detail && <p className="mt-1 truncate text-xs text-muted-foreground">{item.detail}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="venues" className="mt-6">
            <OwnerVenueControl onChanged={() => snapshot.refetch()} />
          </TabsContent>

          <TabsContent value="beta" className="mt-6">
            <BetaSection />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

type OwnerVenue = {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  status: "pending" | "approved" | "rejected";
};

function OwnerVenueControl({ onChanged }: { onChanged: () => void }) {
  const qc = useQueryClient();
  const venues = useQuery({
    queryKey: ["owner-venue-control"],
    queryFn: async () => {
      const { listAdminBusinesses } = await import("@/lib/business.functions");
      return (await listAdminBusinesses()) as OwnerVenue[];
    },
  });

  async function setStatus(id: string, status: "approved" | "rejected") {
    const { error } = await supabase.from("businesses").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(status === "approved" ? "Venue approved." : "Venue rejected.");
    await qc.invalidateQueries({ queryKey: ["owner-venue-control"] });
    onChanged();
  }

  const pending = (venues.data ?? []).filter((v) => v.status === "pending");
  const other = (venues.data ?? []).filter((v) => v.status !== "pending");

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-display text-2xl">Venue approvals</h2><p className="mt-1 text-sm text-muted-foreground">Review and act on new café and venue registrations without leaving Owner.</p></div>
          <Button asChild variant="outline" className="rounded-full"><Link to="/owner/venue-preview"><Eye className="me-2 h-4 w-4" />Preview venues</Link></Button>
        </div>
        <div className="mt-5 grid gap-3">
          {venues.isLoading && <p className="py-8 text-center text-sm text-muted-foreground">Loading venues…</p>}
          {!venues.isLoading && pending.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No venues waiting for approval.</p>}
          {pending.map((v) => (
            <div key={v.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border p-4">
              <Store className="h-5 w-5 text-primary" />
              <div className="min-w-0 flex-1"><p className="font-medium">{v.name}</p><p className="truncate text-xs text-muted-foreground">{[v.city, v.address].filter(Boolean).join(" · ") || "No location"}</p></div>
              <Button size="sm" className="rounded-full" onClick={() => setStatus(v.id, "approved")}><Check className="me-1 h-4 w-4" />Approve</Button>
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => setStatus(v.id, "rejected")}><X className="me-1 h-4 w-4" />Reject</Button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <h2 className="font-display text-xl">All venues</h2>
        <div className="mt-4 grid gap-2">
          {other.slice(0, 20).map((v) => (
            <div key={v.id} className="flex items-center gap-3 rounded-2xl border border-border/70 px-4 py-3">
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{v.name}</span>
              <span className="text-xs text-muted-foreground">{v.city ?? "—"}</span>
              <Badge variant={v.status === "approved" ? "default" : "secondary"} className="rounded-full">{v.status}</Badge>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function OwnerHeader({ onSignOut }: { onSignOut: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/owner" className="flex items-center gap-2">
          <img src={logoAsset.url} alt="" className="h-9 w-9 rounded-full object-contain" />
          <span className="font-display text-lg">Ideal <span className="italic text-primary">Gathering</span></span>
          <Badge variant="outline" className="ms-1 rounded-full"><Crown className="me-1 h-3 w-3" />Owner</Badge>
        </Link>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={onSignOut} aria-label="Sign out"><LogOut className="h-4 w-4" /></Button>
      </div>
    </header>
  );
}

function formatActivityTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}
