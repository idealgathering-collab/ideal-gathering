import { Map as MapIcon, ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { areaLabel } from "@/lib/yerevan-areas";
import { useI18n, useT } from "@/i18n";

export function AreaFilter({
  area,
  areas,
  onChange,
}: {
  /** null = all areas */
  area: string | null;
  areas: string[];
  onChange: (area: string | null) => void;
}) {
  const t = useT();
  const { lang } = useI18n();
  const options = area && !areas.includes(area) ? [area, ...areas] : areas;
  const label = area ? areaLabel(area, lang) : t("explore.area.all");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium shadow-soft transition hover:border-primary/40">
        <MapIcon className="h-3.5 w-3.5 text-tangerine" />
        {label}
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
        <DropdownMenuItem onSelect={() => onChange(null)}>
          <Check className={`me-2 h-4 w-4 ${area === null ? "opacity-100" : "opacity-0"}`} />
          {t("explore.area.all")}
        </DropdownMenuItem>
        {options.map((a) => (
          <DropdownMenuItem key={a} onSelect={() => onChange(a)}>
            <Check className={`me-2 h-4 w-4 ${area === a ? "opacity-100" : "opacity-0"}`} />
            {areaLabel(a, lang)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
