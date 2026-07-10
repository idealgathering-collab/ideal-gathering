import { MapPin, Sparkles, Clock } from "lucide-react";
import heroCafe from "@/assets/hero-cafe.jpg.asset.json";

const filled = [
  { initials: "AY", from: "from-tangerine", to: "to-sunshine" },
  { initials: "MK", from: "from-plum", to: "to-secondary" },
  { initials: "SD", from: "from-sunshine", to: "to-tangerine" },
];

export function HeroPoster() {
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-md">
      {/* backdrop */}
      <div className="absolute inset-0 overflow-hidden rounded-[2rem] border border-primary-foreground/20 shadow-plum">
        <img
          src={heroCafe.url}
          alt=""
          className="h-full w-full object-cover"
          width={1024}
          height={1280}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-plum/80 via-plum/20 to-transparent" />
      </div>

      {/* secondary chip — top left */}
      <div className="absolute -left-4 top-8 hidden rounded-2xl border border-border/60 bg-card/95 px-4 py-3 shadow-soft backdrop-blur sm:block">
        <div className="flex items-center gap-2 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tangerine opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-tangerine" />
          </span>
          <span className="font-medium">New table · Kadıköy</span>
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">2 seats left</div>
      </div>

      {/* main gathering card — bottom right */}
      <div className="absolute inset-x-4 bottom-4 rounded-3xl border border-border/60 bg-card/95 p-5 shadow-plum backdrop-blur-xl sm:inset-x-6 sm:bottom-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-sunshine/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
              <Sparkles className="h-3 w-3" /> Tonight
            </div>
            <h3 className="mt-2 font-display text-xl leading-tight">
              Philosophy & Flat Whites
            </h3>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> Petra Roasting Co.
              <span className="mx-1">·</span>
              <Clock className="h-3 w-3" /> 19:30
            </div>
          </div>
          <div className="shrink-0 rounded-2xl bg-gradient-cool px-2.5 py-1.5 text-center text-primary-foreground">
            <div className="font-display text-lg leading-none">94%</div>
            <div className="text-[9px] uppercase tracking-wide opacity-80">Vibe</div>
          </div>
        </div>

        {/* seats */}
        <div className="mt-4 flex items-center justify-between gap-2">
          {filled.map((s) => (
            <div
              key={s.initials}
              className={`grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br ${s.from} ${s.to} font-medium text-xs text-primary-foreground ring-2 ring-card`}
            >
              {s.initials}
            </div>
          ))}
          {[0, 1].map((i) => (
            <div
              key={i}
              className="grid h-10 w-10 place-items-center rounded-full border-2 border-dashed border-primary/40 text-primary/60 animate-pulse"
              aria-label="Open seat"
            >
              <span className="text-lg leading-none">+</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>3 of 5 seats taken</span>
          <span className="font-medium text-primary">2 open</span>
        </div>
      </div>
    </div>
  );
}
