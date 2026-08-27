import { useT } from "@/i18n";
import { HelpCircle, Sparkles, Users, Heart, Target, BookOpen, User } from "lucide-react";
import type { ProfileSection, SectionCompletion } from "@/lib/profile-completion";
import { getCompletionColor, getCompletionLevel } from "@/lib/profile-completion";

/**
 * Completion badge component for profile sections.
 * Shows a colored badge with completion percentage and prompt.
 */
export interface CompletionBadgeProps {
  /**
   * The section completion data.
   */
  completion: SectionCompletion;
  
  /**
   * Whether this is the viewer's own profile (shows action prompts).
   */
  isSelf?: boolean;
  
  /**
   * Size variant: "small" | "medium" | "large"
   */
  size?: "small" | "medium" | "large";
  
  /**
   * Whether to show the prompt text.
   */
  showPrompt?: boolean;
  
  /**
   * Custom className.
   */
  className?: string;
}

/**
 * Get icon for a section.
 */
function getSectionIcon(section: ProfileSection) {
  const icons: Record<ProfileSection, React.ReactNode> = {
    aura: <Sparkles className="h-4 w-4" />,
    style: <Users className="h-4 w-4" />,
    loves: <Heart className="h-4 w-4" />,
    here: <Target className="h-4 w-4" />,
    story: <BookOpen className="h-4 w-4" />,
    identity: <User className="h-4 w-4" />,
  };
  return icons[section];
}

/**
 * Get the size classes for the badge.
 */
function getSizeClasses(size: "small" | "medium" | "large") {
  const sizes = {
    small: {
      badge: "text-xs",
      icon: "h-3 w-3",
      text: "text-xs",
      percent: "text-sm",
    },
    medium: {
      badge: "text-sm",
      icon: "h-4 w-4",
      text: "text-sm",
      percent: "text-base",
    },
    large: {
      badge: "text-base",
      icon: "h-5 w-5",
      text: "text-sm",
      percent: "text-lg",
    },
  };
  return sizes[size] || sizes.medium;
}

export function CompletionBadge({
  completion,
  isSelf = false,
  size = "medium",
  showPrompt = true,
  className = "",
}: CompletionBadgeProps) {
  const t = useT();
  const level = getCompletionLevel(completion.completionPercent);
  const color = getCompletionColor(level);
  const sizeClasses = getSizeClasses(size);

  if (completion.isComplete) {
    // Show a checkmark or completed indicator
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-2 py-1 text-white/60 ${sizeClasses.badge} ${className}`}
        style={{ borderColor: color + "40" }}
      >
        {getSectionIcon(completion.section)}
        <span className={sizeClasses.text}>{t(`profile.completion.${completion.section}.title`)}</span>
      </span>
    );
  }

  // Show completion prompt
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Progress badge */}
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-2 py-0.5 ${sizeClasses.badge}`}
        style={{ borderColor: color + "40" }}
      >
        <span
          className={sizeClasses.percent}
          style={{ color }}
        >
          {completion.completionPercent}%
        </span>
      </span>
      
      {/* Prompt text (only for self) */}
      {showPrompt && isSelf && (
        <span className="text-xs text-white/40">
          {t(completion.promptKey)}
        </span>
      )}
    </div>
  );
}

/**
 * Full completion card for the profile header.
 * Shows overall completion with all sections.
 */
export interface ProfileCompletionCardProps {
  /**
   * Overall completion percentage.
   */
  overallPercent: number;
  
  /**
   * Number of completed sections.
   */
  completedSections: number;
  
  /**
   * Total number of sections.
   */
  totalSections: number;
  
  /**
   * Whether this is the viewer's own profile.
   */
  isSelf: boolean;
  
  /**
   * Click handler for the complete profile button.
   */
  onComplete?: () => void;
}

export function ProfileCompletionCard({
  overallPercent,
  completedSections,
  totalSections,
  isSelf,
  onComplete,
}: ProfileCompletionCardProps) {
  const t = useT();
  const level = getCompletionLevel(overallPercent);
  const color = getCompletionColor(level);
  const isComplete = completedSections >= totalSections;

  if (isComplete) {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 p-3">
        <Sparkles className="h-5 w-5 text-purple-400" />
        <span className="text-sm text-white">{t("profile.completion.complete")}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 p-3">
      {/* Progress bar */}
      <div className="relative h-3 flex-1 rounded-full bg-white/10 overflow-hidden">
        <div
          className="absolute inset-0 rounded-full transition-all duration-500"
          style={{
            width: `${overallPercent}%`,
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}60`,
          }}
        />
      </div>
      
      {/* Percentage */}
      <span
        className="text-sm font-medium"
        style={{ color }}
      >
        {t("profile.completion.overall", { percent: overallPercent })}
      </span>
      
      {/* Complete button (only for self) */}
      {isSelf && onComplete && (
        <button
          type="button"
          onClick={onComplete}
          className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
        >
          {t("profile.completion.continue")}
        </button>
      )}
    </div>
  );
}

/**
 * Empty state for a sector with completion prompt.
 */
export function SectorCompletionPrompt({
  section,
  isSelf,
  onClick,
}: {
  section: ProfileSection;
  isSelf: boolean;
  onClick?: () => void;
}) {
  const t = useT();
  
  // Get the completion info for this section
  const prompts: Record<ProfileSection, { icon: React.ReactNode; promptKey: string }> = {
    aura: { icon: <Sparkles className="h-5 w-5" />, promptKey: "profile.completion.aura.prompt" },
    style: { icon: <Users className="h-5 w-5" />, promptKey: "profile.completion.style.prompt" },
    loves: { icon: <Heart className="h-5 w-5" />, promptKey: "profile.completion.loves.prompt" },
    here: { icon: <Target className="h-5 w-5" />, promptKey: "profile.completion.here.prompt" },
    story: { icon: <BookOpen className="h-5 w-5" />, promptKey: "profile.completion.story.prompt" },
    identity: { icon: <User className="h-5 w-5" />, promptKey: "profile.completion.identity.prompt" },
  };
  
  const info = prompts[section];

  return (
    <div
      className={`rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-6 text-center cursor-pointer hover:bg-white/10 transition-colors ${onClick ? "cursor-pointer" : "cursor-default"}`}
      onClick={onClick}
    >
      <div className="text-white/60 mb-2">{info.icon}</div>
      <p className="text-sm text-white/80">{t(`profile.sector.${section}Empty`)}</p>
      {isSelf && (
        <p className="text-xs text-white/50 mt-1">{t(info.promptKey)}</p>
      )}
    </div>
  );
}
