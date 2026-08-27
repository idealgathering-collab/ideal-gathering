import type { ProfileSector } from "@/lib/profile-sectors";
import { useT } from "@/i18n";
import { HelpCircle, Sparkles, Users, Heart, BookOpen, Target } from "lucide-react";
import type { SectionCompletion } from "@/lib/profile-completion";
import { CompletionBadge, SectorCompletionPrompt } from "@/components/profile/completion-badge";

/**
 * Sector wrapper - EXACT match to image design
 * Each sector has: icon + title + hint + question mark icon
 */
export interface SectorProps {
  sector: ProfileSector;
  hasData: boolean;
  children: React.ReactNode;
  title?: string;
  hint?: string;
  /**
   * Completion data for this sector (optional).
   * If provided, shows completion badge or prompt.
   */
  completion?: SectionCompletion;
  /**
   * Whether this is the viewer's own profile.
   */
  isSelf?: boolean;
  /**
   * Click handler for completion prompt.
   */
  onComplete?: () => void;
}

function getSectorIcon(sector: ProfileSector) {
  const icons: Record<ProfileSector, React.ReactNode> = {
    aura: <Sparkles className="h-5 w-5 text-purple-400" />,
    style: <Users className="h-5 w-5 text-purple-400" />,
    loves: <Heart className="h-5 w-5 text-purple-400" />,
    here: <Target className="h-5 w-5 text-purple-400" />,
    story: <BookOpen className="h-5 w-5 text-purple-400" />,
  };
  return icons[sector];
}

function getSectorTitleKey(sector: ProfileSector): string {
  const keys: Record<ProfileSector, string> = {
    aura: "profile.sector.aura",
    style: "profile.sector.style",
    loves: "profile.sector.loves",
    here: "profile.sector.here",
    story: "profile.sector.story",
  };
  return keys[sector];
}

function getSectorHintKey(sector: ProfileSector): string {
  const keys: Record<ProfileSector, string> = {
    aura: "profile.sector.auraHint",
    style: "profile.sector.styleHint",
    loves: "profile.sector.lovesHint",
    here: "profile.sector.hereHint",
    story: "profile.sector.storyHint",
  };
  return keys[sector];
}

export function Sector({
  sector,
  hasData,
  children,
  title,
  hint,
  completion,
  isSelf = false,
  onComplete,
}: SectorProps) {
  const t = useT();
  
  // If we have completion data, check if it's complete
  const hasCompletionData = !!completion;
  const isComplete = hasCompletionData ? completion.isComplete : hasData;
  
  // If the sector is empty and we have completion data, show the prompt
  if (!hasData && hasCompletionData && !isComplete) {
    return (
      <section className="w-full">
        <SectorCompletionPrompt
          section={sector}
          isSelf={isSelf}
          onClick={onComplete}
        />
      </section>
    );
  }
  
  // If no data and no completion, don't render
  if (!hasData && !hasCompletionData) {
    return null;
  }

  const displayTitle = title ?? t(getSectorTitleKey(sector));
  const displayHint = hint ?? t(getSectorHintKey(sector));
  const icon = getSectorIcon(sector);

  return (
    <section className="w-full">
      {/* Sector header - EXACT from image: icon + title + hint + ? */}
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white">
              {displayTitle}
            </p>
            {/* Show completion badge if we have data */}
            {hasCompletionData && !isComplete && (
              <CompletionBadge
                completion={completion}
                isSelf={isSelf}
                size="small"
                showPrompt={false}
              />
            )}
          </div>
          {displayHint && (
            <p className="text-xs text-white/50">{displayHint}</p>
          )}
        </div>
        <HelpCircle className="h-4 w-4 text-white/40" />
      </div>
      
      {/* Sector content */}
      <div className="flex flex-wrap gap-3">
        {children}
      </div>
    </section>
  );
}

export interface SectorEmptyProps {
  sector: ProfileSector;
  message?: string;
}

export function SectorEmpty({ sector, message }: SectorEmptyProps) {
  const t = useT();
  
  const defaultMessages: Record<ProfileSector, string> = {
    aura: t("profile.sector.auraEmpty"),
    style: t("profile.sector.styleEmpty"),
    loves: t("profile.sector.lovesEmpty"),
    here: t("profile.sector.hereEmpty"),
    story: t("profile.sector.storyEmpty"),
  };
  
  const displayMessage = message ?? defaultMessages[sector];
  
  return (
    <p className="text-sm text-white/40 italic">{displayMessage}</p>
  );
}
