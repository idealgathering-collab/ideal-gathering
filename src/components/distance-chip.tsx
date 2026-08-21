import { Navigation } from "lucide-react";
import { formatDistance } from "@/lib/geolocation";
import { useI18n, useT } from "@/i18n";

export function DistanceChip({ km }: { km: number }) {
  const t = useT();
  const { lang } = useI18n();
  return (
    <span className="inline-flex items-center gap-1.5">
      <Navigation className="h-3.5 w-3.5 text-tangerine" />
      {t("geo.away", { d: formatDistance(km, lang) })}
    </span>
  );
}
