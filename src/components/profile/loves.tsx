import type { GuestLoves } from "@/lib/guest-profile";
import { Sector, type SectorProps } from "@/components/profile/sector";
import { getInterestVisualMedium } from "@/lib/interest-visuals";
import { useT } from "@/i18n";
import { interestLabel } from "@/lib/interests";
import { Edit3 } from "lucide-react";

/**
 * Loves component - EXACT match to image design
 * Shows interests as circular photo tiles with icons
 */
export interface LovesProps extends Omit<SectorProps, "sector" | "hasData"> {
  loves: GuestLoves | null;
  maxDisplay?: number;
  showEdit?: boolean;
  onEdit?: () => void;
  completion?: SectionCompletion;
  isSelf?: boolean;
}

const INTEREST_ICONS: Record<string, string> = {
  coffee: "☕",
  travel: "✈️",
  technology: "💻",
  books: "📚",
  exploring: "🗺️",
  food: "🍽️",
  music: "🎵",
  film: "🎬",
  art: "🎨",
  sports: "⚽",
  hiking: "⛰️",
  yoga: "🧘",
  gaming: "🎮",
};

function getInterestIcon(interest: string): string {
  return INTEREST_ICONS[interest] || "✨";
}

/**
 * Interest tile - EXACT from image: circular photo with icon overlay
 */
function InterestTile({
  icon,
  label,
  imageUrl,
}: {
  icon: string;
  label: string;
  imageUrl: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 group">
      {/* Circular tile with image - EXACT from image */}
      <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-white/20 shadow-lg group-hover:scale-105 transition-transform">
        <img
          src={imageUrl}
          alt={label}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        {/* Icon overlay - dark background */}
        <div className="absolute inset-0 bg-black/50 grid place-items-center">
          <span className="text-2xl drop-shadow-lg">{icon}</span>
        </div>
      </div>
      
      {/* Label below */}
      <span className="text-xs font-medium text-white truncate w-20 text-center">{label}</span>
    </div>
  );
}

export function Loves({ 
  loves, 
  maxDisplay = 8, 
  showEdit = false,
  onEdit,
  children,
  ...props 
}: LovesProps) {
  const t = useT();
  
  const interests = loves?.interests || [];
  const hasLoves = interests.length > 0;

  if (!hasLoves) {
    return null;
  }

  const displayedInterests = interests.slice(0, maxDisplay);
  const remainingCount = interests.length - displayedInterests.length;

  return (
    <Sector 
      sector="loves" 
      hasData={true}
      completion={completion}
      isSelf={isSelf}
      {...props}
    >
      <div className="flex flex-wrap gap-3 w-full">
        {displayedInterests.map((interest) => (
          <InterestTile
            key={interest}
            icon={getInterestIcon(interest)}
            label={interestLabel(t, interest)}
            imageUrl={getInterestVisualMedium(interest)}
          />
        ))}
        
        {remainingCount > 0 && (
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="h-20 w-20 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center">
              <span className="text-2xl text-white/60">+{remainingCount}</span>
            </div>
            <span className="text-xs text-white/40">more</span>
          </div>
        )}
        
        {showEdit && onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="flex flex-col items-center justify-center gap-1.5 hover:bg-white/5 rounded-2xl p-2 transition-colors"
          >
            <div className="h-20 w-20 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center">
              <Edit3 className="h-6 w-6 text-white/60" />
            </div>
            <span className="text-xs text-white/60">{t("common.edit")}</span>
          </button>
        )}
      </div>
      
      {children}
    </Sector>
  );
}
