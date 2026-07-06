import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarClock, MapPin, Users, ArrowLeft, Coffee } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { VerifyEmailBanner } from "@/components/verify-email-banner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { fetchGathering, formatDateTime } from "@/lib/gatherings";

export const Route = createFileRoute("/gatherings/$id")({
  component: GatheringDetail,
});

function GatheringDetail() {
  const { id } = Route.useParams();
  const { user } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: g, isLoading } = useQuery({
    queryKey: ["gathering", id],
    queryFn: () => fetchGathering(id),
  });

  async function join() {
    if (!user) {
      navigate({ to: "/auth", search: { mode: "signup", redirect: `/gatherings/${id}` } });
      return;
    }
    const { error } = await supabase.from("gathering_attendees").insert({ gathering_id: id, user_id: user.id });
    if (error) return toast.error(error.message);
    toast.success("You're in. Save the date.");
    qc.invalidateQueries({ queryKey: ["gathering", id] });
  }

  async function leave() {
    if (!user) return;
    const { error } = await supabase.from("gathering_attendees").delete().eq("gathering_id", id).eq("user_id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Left the gathering");
    qc.invalidateQueries({ queryKey: ["gathering", id] });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!g) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="font-display text-4xl">Not found</h1>
          <p className="mt-2 text-muted-foreground">This gathering doesn't exist or isn't public.</p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/">Back to gatherings</Link>
          </Button>
        </div>
      </div>
    );
  }

  const attendees = (g.gathering_attendees ?? []) as Array<{ user_id: string }>;
  const isAttending = user ? attendees.some((a) => a.user_id === user.id) : false;
  const seatsLeft = Math.max(0, g.seats - attendees.length);
  const isHost = user?.id === g.host_id;
  const isOwner = user?.id === g.business?.owner_id;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        {g.business?.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={g.business.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-multiply" />
        )}
        <div className="relative mx-auto max-w-3xl px-4 py-16 text-primary-foreground">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-primary-foreground/80 hover:text-primary-foreground">
            <ArrowLeft className="h-4 w-4" /> All gatherings
          </Link>
          <div className="mt-4 flex items-center gap-2 text-xs uppercase tracking-wider text-sunshine">
            <Coffee className="h-4 w-4" /> Table {g.table?.label}
            {g.status !== "approved" && (
              <span className="ml-2 rounded-full bg-sunshine px-2 py-0.5 text-sunshine-foreground">
                {g.status}
              </span>
            )}
          </div>
          <h1 className="mt-3 font-display text-5xl leading-[1] sm:text-6xl">{g.subject}</h1>
          {g.description && <p className="mt-4 max-w-2xl text-primary-foreground/85">{g.description}</p>}
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="grid gap-4 rounded-3xl border border-border bg-card p-6 shadow-soft sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <CalendarClock className="h-4 w-4 text-primary" /> When
            </div>
            <div className="mt-1 font-display text-lg">{formatDateTime(g.starts_at)}</div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <MapPin className="h-4 w-4 text-tangerine" /> Where
            </div>
            <div className="mt-1 font-display text-lg">{g.business?.name}</div>
            <div className="text-xs text-muted-foreground">
              {g.business?.address}
              {g.business?.city ? `, ${g.business.city}` : ""}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Users className="h-4 w-4 text-primary" /> Seats
            </div>
            <div className="mt-1 font-display text-lg">
              {attendees.length} / {g.seats}
            </div>
            <div className="text-xs text-muted-foreground">
              {seatsLeft > 0 ? `${seatsLeft} left` : "Full"}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {g.status === "approved" && !isHost && !isOwner && (
            isAttending ? (
              <Button variant="outline" size="lg" onClick={leave} className="rounded-full">
                Leave gathering
              </Button>
            ) : (
              <Button size="lg" onClick={join} disabled={seatsLeft === 0} className="rounded-full bg-tangerine text-tangerine-foreground hover:bg-tangerine/90">
                {seatsLeft === 0 ? "Full" : "Join gathering"}
              </Button>
            )
          )}
          {g.status !== "approved" && (isHost || isOwner) && (
            <div className="rounded-full bg-sunshine px-4 py-2 text-sm text-sunshine-foreground">
              {g.status === "proposed"
                ? isOwner
                  ? "Approve this gathering from your business dashboard."
                  : "Waiting for the venue to approve."
                : "This gathering is cancelled."}
            </div>
          )}
          {isOwner && g.business && (
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/businesses/$id" params={{ id: g.business.id }}>
                Manage venue
              </Link>
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
