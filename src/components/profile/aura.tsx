import type { SectionCompletion } from "@/lib/profile-completion";
import type { ProfileCardAura } from "@/lib/profile-card";
import { Sector, type SectorProps } from "@/components/profile/sector";
import { useT } from "@/i18n";

/**
 * Aura component - EXACT match to image design
 * Shows trait meters with icons and percentages in 2x2 grid
 */
export interface AuraProps extends Omit<SectorProps, "sector" | "hasData" | "children"> {
  aura: ProfileCardAura | null;
  completion?: SectionCompletion;
  isSelf?: boolean;
  children?: React.ReactNode;
}

const TRAIT_CONFIG = [
  { 
    key: "spark" as const, 
    labelKey: "profile.aura.spark", 
    icon: "⚡",
    color: "#8B5CF6",
  },
  { 
    key: "curiosity" as const, 
    labelKey: "profile.aura.curiosity", 
    icon: "🔍",
    color: "#F59E0B",
  },
  { 
    key: "warmth" as const, 
    labelKey: "profile.aura.warmth", 
    icon: "❤️",
    color: "#10B981",
  },
  { 
    key: "depth" as const, 
    labelKey: "profile.aura.depth", 
    icon: "🌊",
    color: "#3B82F6",
  },
] as const;

type TraitKey = typeof TRAIT_CONFIG[number]["key"];

function getTraitValue(aura: ProfileCardAura | null, key: TraitKey): number {
  const traitMap: Record<TraitKey, keyof ProfileCardAura> = {
    spark: "traitSpark",
    curiosity: "traitCuriosity",
    warmth: "traitWarmth",
    depth: "traitDepth",
  };
  const value = aura?.[traitMap[key]];
  return typeof value === "number" ? value : 0;
}

/**
 * Trait meter - EXACT from image: icon + label + percentage + progress bar
 */
function TraitMeter({
  icon,
  label,
  value,
  color,
  max = 100,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
  max?: number;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  const clampedValue = Math.round(value);

  return (
    <div className="flex items-center gap-3 w-[calc(50%-6px)]">
      {/* Icon */}
      <span className="text-2xl" style={{ color }}>{icon}</span>
      
      {/* Label and percentage */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-white truncate">{label}</span>
          <span className="text-sm font-bold text-white shrink-0">{clampedValue}%</span>
        </div>
        
        {/* Progress bar - EXACT from image */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${percentage}%`,
              backgroundColor: color,
              boxShadow: `0 0 8px ${color}60`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function Aura({ aura, completion, isSelf = false, children, ...props }: AuraProps) {
  const hasAura = aura && (
    aura.personaColor !== null ||
    aura.traitSpark !== null ||
    aura.traitCuriosity !== null ||
    aura.traitWarmth !== null ||
    aura.traitDepth !== null
  );

  const t = useT();

  return (
    <Sector 
      sector="aura" 
      hasData={!!hasAura}
      title={t("profile.sector.aura")}
      hint={t("profile.sector.auraHint")}
      completion={completion}
      isSelf={isSelf}
      {...props}
    >
      {/* 2x2 grid exactly as in image */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 w-full">
        {TRAIT_CONFIG.map((trait) => {
          const value = getTraitValue(aura, trait.key);
          return (
            <TraitMeter
              key={trait.key}
              icon={trait.icon}
              label={t(trait.labelKey)}
              value={value}
              color={trait.color}
            />
          );
        })}
      </div>

      {children}
    </Sector>
  );
}

export function AuraColorBadge({
  color,
  size = "medium",
}: {
  color: string | null;
  size?: "small" | "medium" | "large";
}) {
  if (!color) return null;

  const sizeClasses = {
    small: "h-3 w-3",
    medium: "h-4 w-4",
    large: "h-6 w-6",
  };

  return (
    <div
      className={`rounded-full ${sizeClasses[size]}`}
      style={{
        backgroundColor: color,
        boxShadow: `0 0 10px ${color}80`,
      }}
    />
  );
}
