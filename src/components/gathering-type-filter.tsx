import { useT } from "@/i18n";
import { GATHERING_TYPE_CATEGORIES, type GatheringType } from "@/lib/gathering-types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Tag } from "lucide-react";

interface GatheringTypeFilterProps {
  type: GatheringType | null;
  onChange: (type: GatheringType | null) => void;
}

export function GatheringTypeFilter({ type, onChange }: GatheringTypeFilterProps) {
  const t = useT();

  const selectedLabel = type ? t(`gatheringType.${type}`) : t("explore.allTypes");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full h-9 px-3"
        >
          <Tag className="me-1 h-3.5 w-3.5" />
          <span className="text-sm">{selectedLabel}</span>
          <ChevronDown className="ms-1 h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem onClick={() => onChange(null)}>
          <span className="text-sm">{t("explore.allTypes")}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {GATHERING_TYPE_CATEGORIES.map((category) => (
          <div key={category.id}>
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              {t(category.labelKey)}
            </div>
            {category.types.map((gtype) => (
              <DropdownMenuItem
                key={gtype}
                onClick={() => onChange(gtype)}
                className="text-sm"
              >
                {t(`gatheringType.${gtype}`)}
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
