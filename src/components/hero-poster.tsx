import { MapPin, Sparkles, Clock } from "lucide-react";
import { useT } from "@/i18n";

const filled = [
  { initials: "AY", from: "from-tangerine", to: "to-sunshine" },
  { initials: "MK", from: "from-plum", to: "to-secondary" },
  { initials: "SD", from: "from-sunshine", to: "to-tangerine" },
];

export function HeroPoster() {
  const t = useT();
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-md">
      {/* pure-CSS backdrop — no baked text, no image */}
      <div className="absolute inset-0 overflow-hidden rounded-[2rem] border border-primary-foreground/20 shadow-plum">
        <div className="absolute inset-0 bg-gradient-to-br from-plum via-secondary to-plum" />
        <div
          className="absolute inset-0 opacity-60 mix-blend-soft-light"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 20%, oklch(0.85 0.15 85 / 0.55) 0%, transparent 45%), radial-gradient(circle at 80% 75%, oklch(0.72 0.18 55 / 0.5) 0%, transparent 55%), radial-gradient(circle at 60% 40%, oklch(0.42 0.22 280 / 0.4) 0%, transparent 50%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-plum/85 via-plum/20 to-transparent" />
        {/* floating soft dots for cafe ambience */}
        <div className="absolute start-8 top-14 h-24 w-24 rounded-full bg-sunshine/20 blur-2xl" />
        <div className="absolute end-6 top-24 h-16 w-16 rounded-full bg-tangerine/30 blur-xl" />
      </div>

      {/* secondary chip — top left */}
      <div className="absolute -start-4 top-8 hidden rounded-2xl border border-border/60 bg-card/95 px-4 py-3 shadow-soft backdrop-blur sm:block">
        <div className="flex items-center gap-2 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tangerine opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-tangerine" />
          </span>
          <span className="font-medium">{t("poster.newTable")}</span>
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">{t("poster.seatsLeft")}</div>
      </div>

      {/* main gathering card — bottom */}
      <div className="absolute inset-x-4 bottom-4 rounded-3xl border border-border/60 bg-card/95 p-5 shadow-plum backdrop-blur-xl sm:inset-x-6 sm:bottom-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-sunshine/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
              <Sparkles className="h-3 w-3" /> {t("poster.tonight")}
            </div>
            <h3 className="mt-2 font-display text-xl leading-tight">
              Philosophy &amp; Flat Whites
            </h3>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> Petra Roasting Co.
              <span className="mx-1">·</span>
              <Clock className="h-3 w-3" /> 19:30
            </div>
          </div>
          <div className="shrink-0 rounded-2xl bg-gradient-cool px-2.5 py-1.5 text-center text-primary-foreground">
            <div className="font-display text-lg leading-none">94%</div>
            <div className="text-[9px] uppercase tracking-wide opacity-80">{t("poster.vibe")}</div>
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
              aria-label="+"
            >
              <span className="text-lg leading-none">+</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{t("poster.taken")}</span>
          <span className="font-medium text-primary">{t("poster.open")}</span>
        </div>
      </div>
    </div>
  );
}
