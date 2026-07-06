import { Link } from "@tanstack/react-router";
import { Users, MapPin, CalendarClock } from "lucide-react";
import type { GatheringCard as G } from "@/lib/gatherings";
import { formatDateTime } from "@/lib/gatherings";

export function GatheringCard({ g }: { g: G }) {
  const seatsLeft = Math.max(0, g.seats - g.attendee_count);
  const full = seatsLeft === 0;
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
            Table {g.table?.label ?? "—"}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide uppercase ${
              full ? "bg-destructive text-destructive-foreground" : "bg-sunshine text-sunshine-foreground"
            }`}
          >
            {full ? "Full" : `${seatsLeft} seat${seatsLeft === 1 ? "" : "s"} left`}
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
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5 text-primary" />
            {formatDateTime(g.starts_at)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-tangerine" />
            {g.business?.name}
            {g.business?.city ? `, ${g.business.city}` : ""}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary" />
            {g.attendee_count}/{g.seats}
          </span>
        </div>
      </div>
    </Link>
  );
}
