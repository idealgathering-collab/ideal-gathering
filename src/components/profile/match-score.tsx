import { useT } from "@/i18n";
import { Heart, Sparkles, Users, Clock } from "lucide-react";
import type { UserMatchResult } from "@/lib/user-match";
import { getMatchLevel, getMatchLevelColor } from "@/lib/user-match";

/**
 * Match score display component for profile card.
 * Shows the match percentage and breakdown.
 */
export interface MatchScoreProps {
  /**
   * Match result between viewer and profile.
   */
  matchResult: UserMatchResult | null;
  
  /**
   * Whether to show the breakdown.
   */
  showBreakdown?: boolean;
  
  /**
   * Size variant.
   */
  size?: "small" | "medium" | "large";
  
  /**
   * Custom className.
   */
  className?: string;
}

export function MatchScore({
  matchResult,
  showBreakdown = false,
  size = "medium",
  className = "",
}: MatchScoreProps) {
  const t = useT();
  
  if (!matchResult) {
    return null;
  }

  const level = getMatchLevel(matchResult.score);
  const color = getMatchLevelColor(level);

  const sizeClasses = {
    small: "text-lg",
    medium: "text-2xl",
    large: "text-3xl",
  };

  const badgeClasses = {
    small: "px-3 py-1 text-sm",
    medium: "px-4 py-2 text-xl",
    large: "px-5 py-3 text-2xl",
  };

  if (!showBreakdown) {
    // Simple badge
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md px-4 py-2 text-xl font-bold text-gray-900 shadow-xl ${className}`}
        style={{
          borderColor: color + "40",
          boxShadow: `0 0 20px ${color}30`,
        }}
      >
        <Sparkles className="h-5 w-5" style={{ color }} />
        <span>{matchResult.score}%</span>
      </span>
    );
  }

  // Full breakdown
  return (
    <div className={`rounded-2xl bg-gray-900/80 backdrop-blur-lg border border-white/10 p-4 ${className}`}>
      {/* Main score */}
      <div className="flex items-center gap-3 mb-4">
        <span
          className={`rounded-full bg-white/95 backdrop-blur-md ${badgeClasses[size]} font-bold text-gray-900`}
          style={{
            borderColor: color + "40",
            boxShadow: `0 0 15px ${color}30`,
          }}
        >
          {matchResult.score}%
        </span>
        <span className="text-white font-medium">
          {t(`landing.v3.matching.match.level.${level}`)}
        </span>
      </div>

      {/* Breakdown */}
      <div className="space-y-2">
        {matchResult.hasTraitData && matchResult.traitScore !== null && (
          <MatchBreakdownItem
            icon={<Sparkles className="h-4 w-4" />}
            label={t("match.explanation.traits", { score: matchResult.traitScore })}
            value={matchResult.traitScore}
          />
        )}
        
        {matchResult.hasInterestData && matchResult.interestScore !== null && (
          <MatchBreakdownItem
            icon={<Heart className="h-4 w-4" />}
            label={t("match.explanation.interests", { score: matchResult.interestScore })}
            value={matchResult.interestScore}
          />
        )}
        
        {matchResult.hasAgeData && (
          <MatchBreakdownItem
            icon={<Clock className="h-4 w-4" />}
            label={t(`match.explanation.age.${level}`)}
            value={Math.round(matchResult.ageFactor * 100)}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Individual breakdown item.
 */
function MatchBreakdownItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  const level = getMatchLevel(value);
  const color = getMatchLevelColor(level);

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-white/60">{icon}</span>
      <span className="text-white/80 flex-1">{label}</span>
      <span
        className="font-medium"
        style={{ color }}
      >
        {value}%
      </span>
    </div>
  );
}

/**
 * Match score badge for the identity header.
 * This is what's shown at the top-right of the cover.
 */
export function MatchScoreBadge({
  score,
  size = "medium",
  className = "",
}: {
  score: number | null;
  size?: "small" | "medium" | "large";
  className?: string;
}) {
  if (score === null || score === undefined) {
    return null;
  }

  const level = getMatchLevel(score);
  const color = getMatchLevelColor(level);

  const sizeClasses = {
    small: "px-2 py-0.5 text-sm",
    medium: "px-4 py-2 text-xl",
    large: "px-5 py-3 text-2xl",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md font-bold text-gray-900 shadow-xl ${sizeClasses[size]} ${className}`}
      style={{
        boxShadow: `0 0 20px ${color}30`,
      }}
    >
      <Sparkles className="h-4 w-4" style={{ color }} />
      <span>{score}%</span>
    </span>
  );
}

/**
 * Match compatibility details.
 * Shows which factors contribute to the match.
 */
export function MatchCompatibility({
  matchResult,
  className = "",
}: {
  matchResult: UserMatchResult | null;
  className?: string;
}) {
  const t = useT();
  
  if (!matchResult) {
    return null;
  }

  const items: Array<{ icon: React.ReactNode; label: string; value: number | null }> = [];
  
  if (matchResult.traitScore !== null) {
    items.push({
      icon: <Sparkles className="h-4 w-4" />,
      label: t("profile.aura.spark"),
      value: matchResult.traitScore,
    });
  }
  
  if (matchResult.interestScore !== null) {
    items.push({
      icon: <Heart className="h-4 w-4" />,
      label: t("profile.sector.loves"),
      value: matchResult.interestScore,
    });
  }
  
  if (matchResult.hasAgeData) {
    items.push({
      icon: <Clock className="h-4 w-4" />,
      label: t("profile.age"),
      value: Math.round(matchResult.ageFactor * 100),
    });
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((item, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-2 py-1 text-xs text-white/80"
        >
          {item.icon}
          <span>{item.value}%</span>
        </span>
      ))}
    </div>
  );
}
