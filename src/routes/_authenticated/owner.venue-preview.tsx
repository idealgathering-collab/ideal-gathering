import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, Eye, MapPin, Store } from "lucide-react";
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
      { title: "View as Venue — Owner — Ideal Gathering" },
      { name: "description", content: "Open the real venue dashboard in read-only owner preview mode." },
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
  const initialId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("venue") ?? "" : "";
  const [selectedId, setSelectedId] = useState(initialId);

  const selected = useMemo(() => {
    const rows = venues.data ?? [];
    if (rows.length === 0) return null;
    return rows.find((v) => v.id === selectedId) ?? rows[0];
  }, [venues.data, selectedId]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
          <Link to="/owner" className="flex items-center gap-2">
            <img src={logoAsset.url} alt="" className="h-9 w-9 rounded-full object-contain" />
            <span className="font-display text-lg">Ideal <span className="italic text-primary">Gathering</span></span>
            <Badge variant="outline" className="ms-1 rounded-full">Owner · View as Venue</Badge>
          </Link>
          <Button asChild variant="ghost" className="rounded-full">
            <Link to="/owner"><ArrowLeft className="me-2 h-4 w-4" />Back to Owner</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 pb-24">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Owner preview</p>
          <h1 className="mt-2 font-display text-4xl">View as Venue</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Choose a registered café or venue, then open the real venue dashboard with editing and activation disabled.
          </p>
        </div>

        {venues.isLoading ? (
          <div className="py-20 text-center text-sm text-muted-foreground">Loading venues…</div>
        ) : (venues.data?.length ?? 0) === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
            No registered venues yet.
          </div>
        ) : (
          <section className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Venue</label>
                <Select value={selected?.id ?? ""} onValueChange={setSelectedId}>
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

              {selected && (
                <Button asChild className="rounded-full">
                  <a href={`/venue/dashboard?ownerPreview=${encodeURIComponent(selected.id)}`}>
                    <Eye className="me-2 h-4 w-4" />Open real venue dashboard
                  </a>
                </Button>
              )}
            </div>

            {selected && (
              <div className="mt-6 grid gap-4 rounded-2xl border border-border bg-background p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                {selected.cover_url ? (
                  <img src={selected.cover_url} alt="" className="h-16 w-16 rounded-2xl object-cover" />
                ) : (
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-muted"><Store className="h-6 w-6 text-muted-foreground" /></div>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-2xl">{selected.name}</h2>
                    <Badge variant={selected.status === "approved" ? "default" : "secondary"} className="rounded-full">{selected.status}</Badge>
                  </div>
                  <p className="mt-1 flex items-center gap-1 truncate text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />{[selected.address, selected.city].filter(Boolean).join(", ") || "No location"}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />{selected.venue_tables?.length ?? 0} tables
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
