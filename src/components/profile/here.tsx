import type { SectionCompletion } from "@/lib/profile-completion";
import type { ProfileCardHere } from "@/lib/profile-card";
import { Sector, type SectorProps } from "@/components/profile/sector";
import { getIntentionVisualMedium } from "@/lib/intention-visuals";
import { useT } from "@/i18n";

export interface HereProps extends Omit<SectorProps, "sector" | "hasData" | "children"> {
  here: ProfileCardHere | null;
  maxDisplay?: number;
  completion?: SectionCompletion;
  isSelf?: boolean;
  children?: React.ReactNode;
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

function PurposeCard({ icon, label, imageUrl }: { icon: string; label: string; imageUrl: string }) {
  return (
    <div className="group relative min-h-28 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35 transition duration-300 group-hover:scale-105" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/20" />
      <div className="relative flex min-h-28 flex-col justify-end p-3">
        <span className="mb-2 text-xl">{icon}</span>
        <span className="text-sm font-semibold leading-tight text-white">{label}</span>
      </div>
    </div>
  );
}

export function Here({ here, maxDisplay = 6, children, ...props }: HereProps) {
  const t = useT();
  const intentions = here?.intentions || [];
  if (intentions.length === 0) return null;

  function getIntentionLabel(intention: string): string {
    const key = `onboarding.prefs.intentions.${intention}`;
    const label = t(key);
    return label === key || !label ? intention.replace(/_/g, " ") : label;
  }

  const displayedIntentions = intentions.slice(0, maxDisplay);
  const remainingCount = intentions.length - displayedIntentions.length;

  return (
    <Sector sector="here" hasData={true} {...props}>
      <div className="grid w-full grid-cols-2 gap-2">
        {displayedIntentions.map((intention) => (
          <PurposeCard
            key={intention}
            icon={getIntentionIcon(intention)}
            label={getIntentionLabel(intention)}
            imageUrl={getIntentionVisualMedium(intention)}
          />
        ))}
        {remainingCount > 0 && (
          <div className="grid min-h-28 place-items-center rounded-2xl border border-dashed border-white/15 bg-white/5 text-sm font-medium text-white/55">
            +{remainingCount} more
          </div>
        )}
      </div>
      {children}
    </Sector>
  );
}
