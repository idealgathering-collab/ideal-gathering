import { MapPin } from "lucide-react";
import { useT } from "@/i18n";

const HOODS: { name: string; cafes: string[] }[] = [
  { name: "Kentron", cafes: ["Mirzoyan Library", "The Green Bean", "Aeon"] },
  { name: "Cascade", cafes: ["Jazzve", "Charles", "Anteb"] },
  { name: "Arabkir", cafes: ["Artbridge", "Tuff", "Coffeestory"] },
  { name: "Nor Nork", cafes: ["247 Café", "Sam's Café", "Big Story"] },
];

export function NeighborhoodsSection() {
  const t = useT();
  return (
    <section id="partners" className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {t("hoods.badge")}
          </div>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl">
            {t("hoods.title1")}{" "}
            <span className="italic text-primary">{t("hoods.title2")}</span>
          </h2>
          <p className="mt-3 text-muted-foreground">{t("hoods.body")}</p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HOODS.map((h) => (
            <article
              key={h.name}
              className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-plum"
            >
              <div
                aria-hidden
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 80% 0%, oklch(0.85 0.15 85 / 0.35) 0%, transparent 55%), radial-gradient(circle at 0% 100%, oklch(0.42 0.22 280 / 0.18) 0%, transparent 55%)",
                }}
              />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> Yerevan
                  </div>
                  <span className="rounded-full bg-sunshine/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                    {t("hoods.soon")}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-3xl leading-tight">{h.name}</h3>
                <ul className="mt-5 space-y-2">
                  {h.cafes.map((c) => (
                    <li key={c} className="flex items-center gap-2 text-sm">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-cool text-[11px] font-medium text-primary-foreground">
                        {c
                          .split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")}
                      </span>
                      <span className="text-foreground/90">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
