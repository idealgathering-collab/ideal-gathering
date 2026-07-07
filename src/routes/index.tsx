import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Coffee, Utensils, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { GatheringCard } from "@/components/gathering-card";
import { Button } from "@/components/ui/button";
import { fetchApprovedGatherings } from "@/lib/gatherings";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { data: gatherings, isLoading } = useQuery({
    queryKey: ["gatherings", "approved"],
    queryFn: fetchApprovedGatherings,
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-95" />
        <div
          className="absolute inset-0 opacity-30 mix-blend-overlay"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, oklch(0.88 0.18 95) 0%, transparent 45%), radial-gradient(circle at 85% 70%, oklch(0.72 0.19 55) 0%, transparent 50%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-24 sm:pt-24 sm:pb-32">
          <div className="max-w-3xl text-primary-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-medium tracking-wide uppercase backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Pull up a chair
            </span>
            <h1 className="mt-6 font-display text-5xl leading-[0.95] sm:text-7xl">
              Meet over coffee,
              <br />
              <span className="italic text-sunshine">around a subject.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-primary-foreground/85">
              Ideal Gathering turns cafes and restaurants into hosts for conversations
              worth having. Pick a table, pick a topic, show up.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full bg-sunshine text-sunshine-foreground hover:bg-sunshine/90 shadow-tangerine">
                <Link to="/waitlist">
                  Join the waitlist
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link to="/register-business">
                  Register your cafe <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 text-primary-foreground/90">
              {[
                { icon: Coffee, label: "Venues", value: "Cafes & restaurants" },
                { icon: Utensils, label: "Tables", value: "Reserved seats" },
                { icon: Sparkles, label: "Subjects", value: "Every gathering" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex flex-col gap-1">
                  <Icon className="h-5 w-5 text-sunshine" />
                  <div className="font-display text-lg leading-tight">{value}</div>
                  <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-4xl sm:text-5xl">
              Upcoming <span className="italic text-primary">gatherings</span>
            </h2>
            <p className="mt-2 text-muted-foreground">
              Fresh subjects, real tables. Grab a seat before it's taken.
            </p>
          </div>
          <Button asChild variant="ghost" className="rounded-full">
            <Link to="/create-gathering">
              Propose your own <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-3xl bg-muted" />
            ))
          ) : gatherings && gatherings.length > 0 ? (
            gatherings.map((g) => <GatheringCard key={g.id} g={g} />)
          ) : (
            <div className="col-span-full rounded-3xl border border-dashed border-border bg-card p-12 text-center">
              <h3 className="font-display text-2xl">No gatherings yet</h3>
              <p className="mt-2 text-muted-foreground">
                Be the first to set a table. Register your cafe or propose a subject.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button asChild className="rounded-full">
                  <Link to="/register-business">Register a venue</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/create-gathering">Host a gathering</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:py-24 md:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl sm:text-5xl">
              Two sides of <span className="italic text-tangerine">the same table.</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Whether you're pouring the coffee or pulling up a chair, Ideal Gathering
              gives you a simple way to bring people together around ideas.
            </p>
          </div>
          <div className="grid gap-4">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <div className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground">
                <Utensils className="h-4 w-4" />
              </div>
              <h3 className="font-display text-2xl">For cafes & restaurants</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Register your venue, set up your tables, approve gatherings guests
                propose, or host your own. Fill quiet hours with meaningful traffic.
              </p>
              <Button asChild variant="link" className="mt-3 px-0 text-primary">
                <Link to="/register-business">Register your business →</Link>
              </Button>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <div className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-tangerine text-tangerine-foreground">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="font-display text-2xl">For everyone else</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Browse gatherings by subject. Join with a tap. Or propose your own
                idea at a table you love — the venue confirms.
              </p>
              <Button asChild variant="link" className="mt-3 px-0 text-primary">
                <Link to="/create-gathering">Host a gathering →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center">
          <div className="font-display text-lg text-foreground">
            Ideal <span className="italic text-primary">Gathering</span>
          </div>
          <div>© {new Date().getFullYear()} — Set the table. Set the subject.</div>
        </div>
      </footer>
    </div>
  );
}
