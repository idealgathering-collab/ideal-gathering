import type { SectionCompletion } from "@/lib/profile-completion";
import type { ProfileCardStyle } from "@/lib/profile-card";
import { Sector, type SectorProps } from "@/components/profile/sector";
import { useT } from "@/i18n";

export interface StyleProps extends Omit<SectorProps, "sector" | "hasData" | "children"> {
  style: ProfileCardStyle | null;
  completion?: SectionCompletion;
  isSelf?: boolean;
  children?: React.ReactNode;
}

const STYLE_ICONS: Record<string, { icon: string; labelKey?: string; label?: string; color: string }> = {
  high: { icon: "⚡", labelKey: "profile.style.energyHigh", color: "#EF4444" },
  medium: { icon: "⚡", labelKey: "profile.style.energyMedium", color: "#F59E0B" },
  low: { icon: "⚡", labelKey: "profile.style.energyLow", color: "#10B981" },
  intimate: { icon: "👥", labelKey: "profile.style.sizeIntimate", color: "#8B5CF6" },
  small: { icon: "👥", labelKey: "profile.style.sizeSmall", color: "#3B82F6" },
  large: { icon: "👥", labelKey: "profile.style.sizeLarge", color: "#EF4444" },
  listener: { icon: "🗣️", labelKey: "profile.style.talkListener", color: "#10B981" },
  balanced: { icon: "🗣️", labelKey: "profile.style.talkBalanced", color: "#F59E0B" },
  talker: { icon: "🗣️", labelKey: "profile.style.talkTalker", color: "#EF4444" },
  love: { icon: "❤️", labelKey: "profile.style.newPeopleLove", color: "#EF4444" },
  neutral: { icon: "😐", labelKey: "profile.style.newPeopleNeutral", color: "#6B7280" },
  avoid: { icon: "🚫", labelKey: "profile.style.newPeopleAvoid", color: "#374151" },
  spontaneous: { icon: "✨", label: "Spontaneous", color: "#A855F7" },
  balanced_spontaneity: { icon: "🌓", label: "Flexible", color: "#6366F1" },
  planned: { icon: "🗓️", label: "Planned", color: "#0EA5E9" },
};

function StyleTile({ icon, label, subtitle, color }: { icon: string; label: string; subtitle?: string; color: string }) {
  return (
    <div className="flex min-w-[84px] flex-1 flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-3 text-center backdrop-blur-sm">
      <span className="text-xl" style={{ color }}>{icon}</span>
      <span className="max-w-[100px] truncate text-xs font-semibold text-white">{label}</span>
      {subtitle && <span className="text-[11px] text-white/50">{subtitle}</span>}
    </div>
  );
}

export function Style({ style, children, ...props }: StyleProps) {
  const t = useT();
  const hasStyle = style && (
    style.energyLevel !== null ||
    style.groupSize !== null ||
    style.talkStyle !== null ||
    style.newPeople !== null ||
    style.spontaneity !== null
  );

  if (!hasStyle) return null;

  const entries = [
    [style.energyLevel, t("profile.style.energy")],
    [style.groupSize, t("profile.style.groupSize")],
    [style.talkStyle, t("profile.style.talkStyle")],
    [style.newPeople, t("profile.style.newPeople")],
    [style.spontaneity, "Planning"],
  ] as const;

  const tiles = entries.flatMap(([value, subtitle], index) => {
    if (!value) return [];
    const config = STYLE_ICONS[value];
    if (!config) return [];
    const label = config.label ?? (config.labelKey ? t(config.labelKey) : value.replace(/_/g, " "));
    return [<StyleTile key={`${index}-${value}`} icon={config.icon} label={label} subtitle={subtitle} color={config.color} />];
  });

  if (tiles.length === 0) return null;

  return (
    <Sector sector="style" hasData={true} {...props}>
      <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
        {tiles}
      </div>
      {children}
    </Sector>
  );
}
