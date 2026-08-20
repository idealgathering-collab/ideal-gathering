import { MapPin, ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/i18n";

export function CityFilter({
  city,
  cities,
  onChange,
}: {
  /** null = all cities */
  city: string | null;
  cities: string[];
  onChange: (city: string | null) => void;
}) {
  const t = useT();
  const options = city && !cities.includes(city) ? [city, ...cities] : cities;
  const label = city ?? t("explore.city.all");

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground">{t("explore.city.browsing")}</span>
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 font-medium shadow-soft transition hover:border-primary/40">
          <MapPin className="h-3.5 w-3.5 text-tangerine" />
          {label}
          <span className="text-xs text-muted-foreground">· {t("explore.city.change")}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
          <DropdownMenuItem onSelect={() => onChange(null)}>
            <Check className={`me-2 h-4 w-4 ${city === null ? "opacity-100" : "opacity-0"}`} />
            {t("explore.city.all")}
          </DropdownMenuItem>
          {options.map((c) => (
            <DropdownMenuItem key={c} onSelect={() => onChange(c)}>
              <Check className={`me-2 h-4 w-4 ${city === c ? "opacity-100" : "opacity-0"}`} />
              {c}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
