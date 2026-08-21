import { Link } from "@tanstack/react-router";
import { Users, MapPin, CalendarClock } from "lucide-react";
import type { GatheringCard as G } from "@/lib/gatherings";
import { formatDateTime } from "@/lib/gatherings";
import { TableFitChip } from "@/components/table-fit";
import { DistanceChip } from "@/components/distance-chip";
import type { TableFit } from "@/lib/matching.functions";
import { useI18n, useT } from "@/i18n";

export function GatheringCard({
  g,
  fit,
  showCity,
  distanceKm,
}: {
  g: G;
  fit?: TableFit;
  /** Show the city on the card — useful when the feed spans multiple cities. */
  showCity?: boolean;
  /** Distance from the viewer's device location, in km. */
  distanceKm?: number | null;
}) {
  const t = useT();
  const { lang } = useI18n();
  const seatsLeft = Math.max(0, g.seats - g.attendee_count);
  const full = seatsLeft === 0;


  const chipLabel = g.table?.label
    ? `${t("card.table")} ${g.table.label}`
    : g.neighborhood || t("card.gathering");
  const cityName = g.city ?? g.business?.city ?? null;
  const baseVenueLine = g.business
    ? `${g.business.name}${g.business.city ? `, ${g.business.city}` : ""}`
    : `${g.venue_name}${g.neighborhood ? ` · ${g.neighborhood}` : ""}`;
  const venueLine =
    showCity && cityName && !baseVenueLine.includes(cityName)
      ? `${baseVenueLine} · ${cityName}`
      : baseVenueLine;
  return (
    <Link
      to="/gatherings/$id"
      params={{ id: g.id }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-plum"
    >
      <div className="relative h-40 overflow-hidden bg-gradient-warm">
        {g.business?.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={g.business.cover_url}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-warm" />
        )}
        <div className="absolute inset-x-3 top-3 flex justify-between">
          <span className="rounded-full bg-background/90 px-3 py-1 text-[11px] font-medium tracking-wide uppercase text-foreground/80">
            {chipLabel}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide uppercase ${
              full ? "bg-destructive text-destructive-foreground" : "bg-sunshine text-sunshine-foreground"
            }`}
          >
            {full ? t("card.full") : t(seatsLeft === 1 ? "card.seatLeft" : "card.seatsLeft", { n: seatsLeft })}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-display text-2xl leading-tight text-foreground">
          {g.subject}
        </h3>
        {g.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{g.description}</p>
        ) : null}
        {fit ? (
          <div>
            <TableFitChip fit={fit} />
          </div>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5 text-primary" />
            {formatDateTime(g.starts_at, lang)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-tangerine" />
            {venueLine}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary" />
            {g.attendee_count}/{g.seats}
          </span>
          {typeof distanceKm === "number" ? <DistanceChip km={distanceKm} /> : null}
        </div>
      </div>
    </Link>
  );
}
