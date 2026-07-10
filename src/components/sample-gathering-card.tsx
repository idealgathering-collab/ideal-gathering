import { MapPin, Clock } from "lucide-react";

export type SampleGathering = {
  topic: string;
  venue: string;
  when: string;
  seats: number;
  filled: { initials: string; from: string; to: string }[];
};

export const SAMPLE_GATHERINGS: SampleGathering[] = [
  {
    topic: "Building Startups over Espresso",
    venue: "MOC Kadıköy",
    when: "Thu · 19:00",
    seats: 5,
    filled: [
      { initials: "EM", from: "from-plum", to: "to-secondary" },
      { initials: "RT", from: "from-tangerine", to: "to-sunshine" },
      { initials: "AL", from: "from-sunshine", to: "to-tangerine" },
    ],
  },
  {
    topic: "Philosophy & Flat Whites",
    venue: "Petra Roasting Co.",
    when: "Fri · 18:30",
    seats: 4,
    filled: [
      { initials: "NK", from: "from-secondary", to: "to-plum" },
      { initials: "İD", from: "from-tangerine", to: "to-sunshine" },
      { initials: "MB", from: "from-plum", to: "to-secondary" },
    ],
  },
  {
    topic: "Books That Broke Us",
    venue: "Norm Coffee",
    when: "Sat · 15:00",
    seats: 5,
    filled: [
      { initials: "SY", from: "from-plum", to: "to-secondary" },
      { initials: "CO", from: "from-tangerine", to: "to-sunshine" },
      { initials: "PJ", from: "from-sunshine", to: "to-tangerine" },
    ],
  },
  {
    topic: "Design Crit Night",
    venue: "Kronotrop",
    when: "Sat · 20:00",
    seats: 4,
    filled: [
      { initials: "HK", from: "from-secondary", to: "to-plum" },
      { initials: "TM", from: "from-tangerine", to: "to-sunshine" },
      { initials: "LV", from: "from-plum", to: "to-secondary" },
    ],
  },
  {
    topic: "Analog Photography Club",
    venue: "Federal Coffee",
    when: "Sun · 11:00",
    seats: 5,
    filled: [
      { initials: "AR", from: "from-sunshine", to: "to-tangerine" },
      { initials: "DK", from: "from-plum", to: "to-secondary" },
      { initials: "NB", from: "from-tangerine", to: "to-sunshine" },
    ],
  },
  {
    topic: "Late-Night Ethics",
    venue: "Coffee Department",
    when: "Sun · 21:00",
    seats: 4,
    filled: [
      { initials: "ZE", from: "from-plum", to: "to-secondary" },
      { initials: "OY", from: "from-tangerine", to: "to-sunshine" },
      { initials: "KP", from: "from-secondary", to: "to-plum" },
    ],
  },
];

export function SampleGatheringCard({ g }: { g: SampleGathering }) {
  const openCount = g.seats - g.filled.length;
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-plum">
      <div className="absolute right-4 top-4 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        Preview
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3" /> {g.venue}
        <span>·</span>
        <Clock className="h-3 w-3" /> {g.when}
      </div>
      <h3 className="mt-2 font-display text-2xl leading-tight">{g.topic}</h3>

      {/* seat diagram */}
      <div className="mt-5 rounded-2xl bg-muted/50 p-4">
        <div className="flex items-center justify-center gap-2">
          {g.filled.map((s) => (
            <div
              key={s.initials}
              className={`grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br ${s.from} ${s.to} text-xs font-medium text-primary-foreground ring-2 ring-card`}
              title={s.initials}
            >
              {s.initials}
            </div>
          ))}
          {Array.from({ length: openCount }).map((_, i) => (
            <div
              key={i}
              className="grid h-10 w-10 place-items-center rounded-full border-2 border-dashed border-primary/40 text-primary/70 animate-pulse"
            >
              <span className="text-lg leading-none">+</span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-center text-[11px] text-muted-foreground">
          {g.filled.length} of {g.seats} seats taken ·{" "}
          <span className="font-medium text-primary">{openCount} open</span>
        </div>
      </div>

      <a
        href="#join"
        className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-plum transition hover:opacity-90"
      >
        Reserve seat
      </a>
    </article>
  );
}
