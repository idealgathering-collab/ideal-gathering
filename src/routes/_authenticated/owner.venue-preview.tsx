import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, MapPin, Phone, Store, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchRoles } from "@/lib/roles";
import { listOwnerVenuePreviews } from "@/lib/owner-venue.functions";
import logoAsset from "@/assets/ideal-gathering-logo.png.asset.json";

export const Route = createFileRoute("/_authenticated/owner/venue-preview")({
  beforeLoad: async ({ context }) => {
    const roles = await fetchRoles(context.user.id);
    if (!roles.has("owner")) throw redirect({ to: "/admin", replace: true });
  },
  head: () => ({
    meta: [
      { title: "Venue Preview — Ideal Gathering" },
      { name: "description", content: "Read-only owner preview of registered venue dashboards." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OwnerVenuePreviewPage,
});

function OwnerVenuePreviewPage() {
  const venues = useQuery({
    queryKey: ["owner-venue-previews"],
    queryFn: listOwnerVenuePreviews,
  });
  const [selectedId, setSelectedId] = useState<string>("");

  const selected = useMemo(() => {
    const rows = venues.data ?? [];
    if (rows.length === 0) return null;
    return rows.find((v) => v.id === selectedId) ?? rows[0];
  }, [venues.data, selectedId]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link to="/owner" className="flex items-center gap-2">
            <img src={logoAsset.url} alt="" className="h-9 w-9 rounded-full object-contain" />
            <span className="font-display text-lg">Ideal <span className="italic text-primary">Gathering</span></span>
            <Badge variant="outline" className="ms-1 rounded-full">Owner · Venue Preview</Badge>
          </Link>
          <Button asChild variant="ghost" className="rounded-full">
            <Link to="/owner">
              <ArrowLeft className="me-2 h-4 w-4" /> Back to Owner
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 pb-24">
        <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
          <p className="font-medium">Read-only Venue Preview</p>
          <p className="mt-1 text-muted-foreground">
            You are viewing the venue experience as Owner. Nothing on this page changes the venue or transfers ownership.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Preview a registered venue</p>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl">Venue Dashboard Preview</h1>
          </div>
          <div className="w-full sm:w-80">
            <Select value={selected?.id ?? ""} onValueChange={setSelectedId} disabled={venues.isLoading || (venues.data?.length ?? 0) === 0}>
              <SelectTrigger className="rounded-full">
                <SelectValue placeholder="Choose a venue" />
              </SelectTrigger>
              <SelectContent>
                {(venues.data ?? []).map((venue) => (
                  <SelectItem key={venue.id} value={venue.id}>{venue.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {venues.isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading venues…</div>
        ) : !selected ? (
          <div className="mt-8 rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No registered venues yet. Once a café registers, it will appear here automatically.
          </div>
        ) : (
          <>
            <section className="mt-8 overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
              {selected.cover_url ? (
                <img src={selected.cover_url} alt="" className="h-56 w-full object-cover" />
              ) : (
                <div className="grid h-56 place-items-center bg-muted/40 text-muted-foreground">
                  <Store className="h-10 w-10" />
                </div>
              )}
              <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Venue portal</p>
                    <h2 className="mt-1 font-display text-3xl">{selected.name}</h2>
                  </div>
                  <Badge className="rounded-full" variant={selected.status === "approved" ? "default" : "secondary"}>
                    {selected.status}
                  </Badge>
                </div>

                {selected.description && <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">{selected.description}</p>}

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Info icon={MapPin} label="Location" value={[selected.address, selected.city].filter(Boolean).join(", ") || "Not added"} />
                  <Info icon={Phone} label="Contact" value={selected.mobile || selected.phone || "Not added"} />
                </div>
              </div>
            </section>

            <section className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-2xl">Tables</h3>
                  <p className="mt-1 text-sm text-muted-foreground">This is how the venue's gathering tables are represented.</p>
                </div>
                <Badge variant="outline" className="rounded-full">{selected.venue_tables?.length ?? 0} tables</Badge>
              </div>

              {(selected.venue_tables?.length ?? 0) === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No tables have been created yet.</p>
              ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {selected.venue_tables.map((table) => (
                    <div key={table.id} className="rounded-2xl border border-border bg-background p-4">
                      <Building2 className="h-4 w-4 text-primary" />
                      <div className="mt-3 font-display text-xl">Table {table.label}</div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" /> {table.capacity} seats
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-soft">
              <h3 className="font-display text-2xl">Venue tools</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                In the real venue account this area contains profile editing, tables, menu tools and gathering activation. Owner Preview stays read-only so you can inspect without accidentally changing a partner venue.
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  );
}
