import { Sparkles } from "lucide-react";
import { GatheringCard } from "@/components/gathering-card";
import type { GatheringCard as G } from "@/lib/gatherings";
import type { TableFit } from "@/lib/matching.functions";
import { useT } from "@/i18n";

export function RecommendedRow({
  items,
  showCity,
}: {
  items: Array<{ g: G; fit?: TableFit; distanceKm?: number | null }>;
  showCity?: boolean;
}) {
  const t = useT();
  if (items.length === 0) return null;
  return (
    <section className="mb-10 rounded-[2rem] border border-primary/25 bg-primary/5 p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="font-display text-2xl leading-none text-foreground">
          {t("explore.recommended.title")}
        </h2>
        <p className="w-full text-sm text-muted-foreground sm:w-auto sm:ps-2">
          {t("explore.recommended.subtitle")}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ g, fit, distanceKm }) => (
          <GatheringCard key={g.id} g={g} fit={fit} showCity={showCity} distanceKm={distanceKm} highlight />
        ))}
      </div>
    </section>
  );
}
