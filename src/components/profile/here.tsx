import type { GuestHere } from "@/lib/guest-profile";
import { Sector, type SectorProps } from "@/components/profile/sector";
import { getIntentionVisualMedium } from "@/lib/intention-visuals";
import { useT } from "@/i18n";

/**
 * Here component - EXACT match to image design
 * Shows intentions as circular photo tiles with icons (same style as Loves)
 */
export interface HereProps extends Omit<SectorProps, "sector" | "hasData"> {
  here: GuestHere | null;
  maxDisplay?: number;
  completion?: SectionCompletion;
  isSelf?: boolean;
}

const INTENTION_ICONS: Record<string, string> = {
  meaningful_conversations: "💬",
  new_experiences: "✨",
  interesting_people: "👥",
  make_friends: "🤝",
  learn_something: "📚",
  do_things_together: "🎯",
  meet_new_people: "👋",
  discover_places: "🗺️",
  shared_interests: "🎨",
  get_out: "🚶",
};

function getIntentionIcon(intention: string): string {
  return INTENTION_ICONS[intention] || "✨";
}

/**
 * Intention tile - EXACT from image: circular photo with icon overlay
 * Same style as InterestTile in Loves component
 */
function IntentionTile({
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

export function Here({ here, maxDisplay = 8, children, ...props }: HereProps) {
  const t = useT();
  
  const intentions = here?.intentions || [];
  const hasHere = intentions.length > 0;

  if (!hasHere) {
    return null;
  }

  const displayedIntentions = intentions.slice(0, maxDisplay);
  const remainingCount = intentions.length - displayedIntentions.length;

  // Get i18n label for intention
  function getIntentionLabel(intention: string): string {
    // Try to get from i18n first
    const key = `onboarding.prefs.intentions.${intention}`;
    const label = t(key);
    // If the key doesn't exist or returns the key itself, format the intention
    if (label === key || !label) {
      return intention.replace(/_/g, " ");
    }
    return label;
  }

  return (
    <Sector 
      sector="here" 
      hasData={true}
      completion={completion}
      isSelf={isSelf}
      {...props}
    >
      <div className="flex flex-wrap gap-3 w-full">
        {displayedIntentions.map((intention) => (
          <IntentionTile
            key={intention}
            icon={getIntentionIcon(intention)}
            label={getIntentionLabel(intention)}
            imageUrl={getIntentionVisualMedium(intention)}
          />
        ))}
        
        {remainingCount > 0 && (
          <div className="flex flex-col items-center gap-1.5">
            <div className="h-20 w-20 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center">
              <span className="text-2xl text-white/60">+{remainingCount}</span>
            </div>
            <span className="text-xs text-white/40">more</span>
          </div>
        )}
      </div>
      
      {children}
    </Sector>
  );
}
