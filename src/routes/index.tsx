import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowLeft, ArrowRight as ArrowRightIcon } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { GatheringCard } from "@/components/gathering-card";
import { RoundTable, SEATS } from "@/components/round-table/RoundTable";
import { fetchApprovedGatherings } from "@/lib/gatherings";
import { useT } from "@/i18n";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const t = useT();
  const [active, setActive] = useState(0);
  const [tablesOpen, setTablesOpen] = useState(false);
  const { data: gatherings } = useQuery({
    queryKey: ["gatherings", "approved"],
    queryFn: fetchApprovedGatherings,
    enabled: tablesOpen,
  });

  // Keyboard arrows rotate seats
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        setActive((i) => (i + 1) % SEATS.length);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        setActive((i) => (i - 1 + SEATS.length) % SEATS.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const seat = SEATS[active];

  return (
    <div className="flex min-h-[100dvh] flex-col bg-parchment text-ink-navy">
      <SiteHeader />

      <main className="relative flex flex-1 flex-col overflow-hidden">
        {/* subtle ambient background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, color-mix(in oklab, var(--ember) 18%, transparent) 0%, transparent 45%), radial-gradient(circle at 85% 80%, color-mix(in oklab, var(--sage) 20%, transparent) 0%, transparent 50%)",
          }}
        />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-6 px-4 pb-3 pt-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-8">
          {/* Table stage */}
          <div className="order-1 flex h-[54vh] items-center justify-center lg:h-full">
            <RoundTable activeIndex={active} onActiveChange={setActive} t={t} />
          </div>

          {/* Panel */}
          <div className="order-2 flex flex-col justify-center">
            <SeatPanel
              seatId={seat.id}
              t={t}
              onOpenTables={() => setTablesOpen(true)}
            />

            {/* Dot pagination (mobile a11y) */}
            <div className="mt-5 flex items-center justify-center gap-2 lg:hidden">
              {SEATS.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={t(s.labelKey)}
                  aria-current={i === active ? "true" : undefined}
                  className={`h-2 rounded-full transition-all ${
                    i === active ? "w-6 bg-ember" : "w-2 bg-ink-navy/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* SR-only content mirror (SEO) */}
        <div className="sr-only">
          <h1>{t("landing.table.seo.h1")}</h1>
          {SEATS.map((s) => (
            <section key={s.id}>
              <h2>{t(s.labelKey)}</h2>
              <p>{t(`landing.table.panel.${s.id}.body`)}</p>
            </section>
          ))}
        </div>

        {/* Persistent footer bar */}
        <FooterBar t={t} />
      </main>

      <Dialog open={tablesOpen} onOpenChange={setTablesOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-serif-warm)" }}>
              {t("landing.table.panel.tables.title")}
            </DialogTitle>
            <DialogDescription>
              {t("landing.table.panel.tables.body")}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {gatherings && gatherings.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {gatherings.slice(0, 6).map((g) => (
                  <GatheringCard key={g.id} g={g} />
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {t("landing.table.panel.tables.empty")}
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <Button asChild variant="ghost" className="rounded-full">
              <Link to="/explore">
                {t("landing.table.panel.tables.viewAll")} <ArrowRight className="ms-1 h-4 w-4 rtl:hidden" />
                <ArrowLeft className="ms-1 hidden h-4 w-4 rtl:inline" />
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SeatPanel({
  seatId,
  t,
  onOpenTables,
}: {
  seatId: string;
  t: (k: string) => string;
  onOpenTables: () => void;
}) {
  const eyebrow = t(`landing.table.panel.${seatId}.eyebrow`);
  const title = t(`landing.table.panel.${seatId}.title`);
  const body = t(`landing.table.panel.${seatId}.body`);
  return (
    <div
      key={seatId}
      className="animate-fade-in rounded-3xl border border-ink-navy/10 bg-parchment/70 p-6 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.35)] backdrop-blur sm:p-8"
    >
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-ember">
        {eyebrow}
      </div>
      <h2
        className="mt-3 text-3xl leading-tight sm:text-4xl"
        style={{ fontFamily: "var(--font-serif-warm)" }}
      >
        {title}
      </h2>
      <p
        className="mt-4 text-base leading-relaxed text-ink-navy/75"
        style={{ fontFamily: "var(--font-sans-humanist)" }}
      >
        {body}
      </p>

      {seatId === "tables" ? (
        <div className="mt-6">
          <Button
            onClick={onOpenTables}
            className="rounded-full bg-ember text-parchment hover:bg-ember/90"
          >
            {t("landing.table.panel.tables.open")}{" "}
            <ArrowRightIcon className="ms-1 h-4 w-4 rtl:rotate-180" />
          </Button>
        </div>
      ) : seatId === "cafes" ? (
        <div className="mt-6">
          <Button asChild variant="outline" className="rounded-full border-ink-navy/30">
            <Link to="/partnership">{t("landing.table.panel.cafes.cta")}</Link>
          </Button>
        </div>
      ) : seatId === "guests" ? (
        <div className="mt-6">
          <Button asChild className="rounded-full bg-ink-navy text-parchment hover:bg-ink-navy/90">
            <Link to="/auth" search={{ mode: "signup" }}>
              {t("landing.table.panel.guests.cta")}
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function FooterBar({ t }: { t: (k: string) => string }) {
  return (
    <div className="relative z-10 border-t border-ink-navy/10 bg-parchment/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm lg:px-8">
        <div className="flex items-center gap-4 text-ink-navy/70">
          <Link to="/privacy" className="hover:text-ink-navy">
            {t("footer.privacy")}
          </Link>
          <Link to="/terms" className="hover:text-ink-navy">
            {t("footer.terms")}
          </Link>
        </div>
        <Button
          asChild
          size="sm"
          className="rounded-full bg-ember text-parchment hover:bg-ember/90"
        >
          <Link to="/auth" search={{ mode: "signup" }}>
            {t("landing.table.footer.cta")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
