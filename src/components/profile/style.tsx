import type { SectionCompletion } from "@/lib/profile-completion";
import type { GuestStyle } from "@/lib/guest-profile";
import { Sector, type SectorProps } from "@/components/profile/sector";
import { useT } from "@/i18n";

/**
 * Style component - EXACT match to image design
 * Shows icon tiles in a row for: energy / size / talk / new people
 */
export interface StyleProps extends Omit<SectorProps, "sector" | "hasData" | "children"> {
  style: GuestStyle | null;
  completion?: SectionCompletion;
  isSelf?: boolean;
  children?: React.ReactNode;
}

const STYLE_ICONS: Record<string, { icon: string; labelKey: string; color: string }> = {
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
};

/**
 * Style tile - EXACT from image: square tile with icon and label
 */
function StyleTile({
  icon,
  label,
  subtitle,
  color,
}: {
  icon: string;
  label: string;
  subtitle?: string;
  color: string;
}) {
  return (
    <div
      className="flex flex-col items-center gap-1 p-2.5 text-center rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 min-w-[80px]"
      style={{ color }}
    >
      <span className="text-xl" style={{ color }}>{icon}</span>
      <span className="text-xs font-medium text-white truncate">{label}</span>
      {subtitle && <span className="text-xs text-white/60">{subtitle}</span>}
    </div>
  );
}

export function Style({ style, children, ...props }: StyleProps) {
  const t = useT();
  
  const hasStyle = style && (
    style.energyLevel !== null ||
    style.groupSize !== null ||
    style.talkStyle !== null ||
    style.newPeople !== null
  );

  if (!hasStyle) {
    return null;
  }

  const energyConfig = style.energyLevel ? STYLE_ICONS[style.energyLevel] : null;
  const sizeConfig = style.groupSize ? STYLE_ICONS[style.groupSize] : null;
  const talkConfig = style.talkStyle ? STYLE_ICONS[style.talkStyle] : null;
  const newPeopleConfig = style.newPeople ? STYLE_ICONS[style.newPeople] : null;

  // i18n labels for subtitles
  const energySubtitle = t("profile.style.energy");
  const sizeSubtitle = t("profile.style.groupSize");
  const talkSubtitle = t("profile.style.talkStyle");
  const newPeopleSubtitle = t("profile.style.newPeople");

  const tiles = [
    energyConfig && (
      <StyleTile
        key="energy"
        icon={energyConfig.icon}
        label={t(energyConfig.labelKey)}
        subtitle={energySubtitle}
        color={energyConfig.color}
      />
    ),
    sizeConfig && (
      <StyleTile
        key="size"
        icon={sizeConfig.icon}
        label={t(sizeConfig.labelKey)}
        subtitle={sizeSubtitle}
        color={sizeConfig.color}
      />
    ),
    talkConfig && (
      <StyleTile
        key="talk"
        icon={talkConfig.icon}
        label={t(talkConfig.labelKey)}
        subtitle={talkSubtitle}
        color={talkConfig.color}
      />
    ),
    newPeopleConfig && (
      <StyleTile
        key="newPeople"
        icon={newPeopleConfig.icon}
        label={t(newPeopleConfig.labelKey)}
        subtitle={newPeopleSubtitle}
        color={newPeopleConfig.color}
      />
    ),
  ].filter(Boolean);

  if (tiles.length === 0) {
    return null;
  }

  return (
    <Sector 
      sector="style" 
      hasData={true}
      {...props}
    >
      {tiles}
      {children}
    </Sector>
  );
}
