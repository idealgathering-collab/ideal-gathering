import { useState } from "react";
import { Clock, MapPin, Check, Plus } from "lucide-react";
import { useT } from "@/i18n";

type DemoTable = {
  id: string;
  topicKey: string;
  venue: string;
  whenKey: string;
  seats: number;
  taken: number;
  people: string[];
};

const TABLES: DemoTable[] = [
  {
    id: "t1",
    topicKey: "landing.v3.demo.card1.topic",
    venue: "MOC Kadıköy",
    whenKey: "landing.v3.demo.card1.when",
    seats: 5,
    taken: 3,
    people: ["EM", "RT", "AL"],
  },
  {
    id: "t2",
    topicKey: "landing.v3.demo.card2.topic",
    venue: "Petra Roasting Co.",
    whenKey: "landing.v3.demo.card2.when",
    seats: 4,
    taken: 2,
    people: ["NK", "İD"],
  },
  {
    id: "t3",
    topicKey: "landing.v3.demo.card3.topic",
    venue: "Norm Coffee",
    whenKey: "landing.v3.demo.card3.when",
    seats: 6,
    taken: 4,
    people: ["SY", "CO", "PJ", "HK"],
  },
];

export function TableDemo() {
  const t = useT();
  const [claimed, setClaimed] = useState<Record<string, boolean>>({});

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {TABLES.map((tbl) => {
        const isClaimed = !!claimed[tbl.id];
        const taken = tbl.taken + (isClaimed ? 1 : 0);
        const open = tbl.seats - taken;
        return (
          <article
            key={tbl.id}
            className="cosmic-panel flex flex-col p-5 text-start sm:p-6"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full border border-white/12 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[rgba(221,214,254,0.7)]">
                {t("landing.v3.demo.tag")}
              </span>
              <span className="text-[11px] font-medium text-sunshine">
                {t("landing.v3.demo.seatsOpen", { n: open })}
              </span>
            </div>

            <h3 className="font-serif-warm mt-4 text-xl font-semibold leading-snug text-white">
              {t(tbl.topicKey)}
            </h3>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[rgba(196,181,253,0.72)]">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {tbl.venue}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> {t(tbl.whenKey)}
              </span>
            </div>

            <div className="mt-5 flex items-center gap-2">
              {tbl.people.map((p) => (
                <span
                  key={p}
                  className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] text-[11px] font-semibold text-white ring-2 ring-[rgba(12,7,26,0.9)]"
                >
                  {p}
                </span>
              ))}
              {isClaimed && (
                <span className="grid h-9 w-9 place-items-center rounded-full bg-sunshine text-[11px] font-bold text-sunshine-foreground ring-2 ring-[rgba(12,7,26,0.9)]">
                  <Check className="h-4 w-4" />
                </span>
              )}
              {Array.from({ length: Math.max(open, 0) }).map((_, i) => (
                <span
                  key={i}
                  className="grid h-9 w-9 place-items-center rounded-full border border-dashed border-[rgba(167,139,250,0.55)] text-[rgba(167,139,250,0.75)]"
                >
                  <Plus className="h-3.5 w-3.5" />
                </span>
              ))}
            </div>

            <div className="mt-2 text-[11px] text-[rgba(196,181,253,0.6)]">
              {t("landing.v3.demo.taken", { filled: taken, seats: tbl.seats })}
            </div>

            <button
              type="button"
              onClick={() => setClaimed((c) => ({ ...c, [tbl.id]: !c[tbl.id] }))}
              aria-pressed={isClaimed}
              className={
                "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition " +
                (isClaimed
                  ? "border border-sunshine/60 bg-sunshine/15 text-sunshine"
                  : "cosmic-outline-btn")
              }
            >
              {isClaimed ? (
                <>
                  <Check className="h-4 w-4" /> {t("landing.v3.demo.claimed")}
                </>
              ) : (
                t("landing.v3.demo.claim")
              )}
            </button>
          </article>
        );
      })}
    </div>
  );
}
