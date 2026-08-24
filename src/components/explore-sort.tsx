import { Sparkles, CalendarClock, Crosshair, Loader2 } from "lucide-react";
import type { SortMode } from "@/lib/explore-sort";
import { useT } from "@/i18n";

export function ExploreSort({
  mode,
  onChange,
  showFit,
  showNear,
  locating,
}: {
  mode: SortMode;
  onChange: (mode: SortMode) => void;
  /** Only offer fit sorting when the viewer has quiz traits. */
  showFit: boolean;
  showNear: boolean;
  locating?: boolean;
}) {
  const t = useT();
  const options: Array<{ value: SortMode; label: string; icon: React.ReactNode }> = [
    ...(showFit
      ? [{ value: "fit" as const, label: t("explore.sort.fit"), icon: <Sparkles className="h-3.5 w-3.5" /> }]
      : []),
    { value: "soon", label: t("explore.sort.soon"), icon: <CalendarClock className="h-3.5 w-3.5" /> },
    ...(showNear
      ? [
          {
            value: "near" as const,
            label: t("explore.sort.near"),
            icon:
              locating && mode === "near" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Crosshair className="h-3.5 w-3.5" />
              ),
          },
        ]
      : []),
  ];

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-soft">
      <span className="ps-2 pe-1 text-xs text-muted-foreground">{t("explore.sort.label")}</span>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
            mode === o.value
              ? "bg-primary text-primary-foreground shadow-soft"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}
