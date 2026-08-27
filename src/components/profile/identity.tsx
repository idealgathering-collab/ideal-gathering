import type { GuestIdentity } from "@/lib/guest-profile";
import { getDisplayName, getLocationString } from "@/lib/guest-profile.functions";
import { getPersonaTitle, getPersonaTags, formatPersonaId } from "@/lib/persona";
import { useT } from "@/i18n";
import { MapPin } from "lucide-react";
import { MatchScoreBadge } from "@/components/profile/match-score";

/**
 * Identity component - EXACT match to the image design
 * Shows: cover + circular face with glow ring + name + persona title + location + tags
 */
export interface IdentityProps {
  identity: GuestIdentity | null;
  scores?: {
    spark: number | null;
    curiosity: number | null;
    warmth: number | null;
    depth: number | null;
  } | null;
  style?: {
    energyLevel: string | null;
    groupSize: string | null;
    talkStyle: string | null;
  } | null;
  intentions?: string[] | null;
  matchScore?: number | null;
  darkTheme?: boolean;
  className?: string;
}

const FALLBACK_COVER = "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80";

const PERSONA_COLORS: Record<string, string> = {
  spark: "#8B5CF6",
  curiosity: "#F59E0B",
  warmth: "#10B981",
  depth: "#3B82F6",
};

export function Identity({
  identity,
  scores,
  style,
  intentions,
  matchScore,
  darkTheme = true,
  className = "",
}: IdentityProps) {
  const t = useT();
  
  if (!identity) {
    return <IdentitySkeleton darkTheme={darkTheme} />;
  }

  const coverUrl = identity.coverUrl || FALLBACK_COVER;
  const avatarUrl = identity.avatarUrl;
  const displayName = getDisplayName(identity);
  const location = getLocationString(identity);
  const personaColor = identity.personaColor || PERSONA_COLORS.spark;
  const hasAvatar = !!avatarUrl;

  const personaTitle = scores ? getPersonaTitle({
    spark: scores.spark ?? null,
    curiosity: scores.curiosity ?? null,
    warmth: scores.warmth ?? null,
    depth: scores.depth ?? null,
  }, t) : null;

  const tags = (style || intentions) ? getPersonaTags({
    scores: scores ? {
      spark: scores.spark ?? null,
      curiosity: scores.curiosity ?? null,
      warmth: scores.warmth ?? null,
      depth: scores.depth ?? null,
    } : null,
    energyLevel: style?.energyLevel ?? null,
    groupSize: style?.groupSize ?? null,
    talkStyle: style?.talkStyle ?? null,
    intentions: intentions ?? null,
  }) : [];

  const displayTags = tags.slice(0, 2).join(" \u2022 ");

  return (
    <div className={`w-full overflow-hidden rounded-3xl ${darkTheme ? "bg-gradient-to-b from-gray-900 to-gray-800" : "bg-card border border-border"} shadow-2xl ${className}`}>
      {/* Cover with avatar overlay - EXACT from image */}
      <div className="relative h-48 w-full overflow-hidden">
        <img
          src={coverUrl}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
        
        {/* Dark overlay - matches image */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70" />
        
        {/* Persona color wash - subtle overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundColor: personaColor }}
        />
        
        {/* Match score badge - TOP RIGHT exactly as in image */}
        {matchScore !== null && matchScore !== undefined && (
          <div className="absolute top-4 right-4">
            <MatchScoreBadge score={matchScore} size="medium" />
          </div>
        )}
        
        {/* Circular avatar with glow ring - EXACT from image */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            {/* Outer glow ring */}
            <div
              className="absolute -inset-5 rounded-full border-4"
              style={{
                borderColor: personaColor + "40",
                boxShadow: `0 0 40px ${personaColor}50, 0 0 80px ${personaColor}20`,
              }}
            />
            
            {/* Avatar - circular with white border */}
            <div className="h-32 w-32 rounded-full border-4 border-white overflow-hidden shadow-2xl">
              {hasAvatar ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full grid place-items-center bg-gradient-to-br from-purple-600 to-pink-700">
                  <span className="text-5xl font-bold text-white">
                    {displayName.slice(0, 1).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info below cover - EXACT from image */}
      <div className="px-6 pb-6 pt-20">
        <div className="text-center">
          {/* Name and persona title on SAME line */}
          <h1 className="text-3xl font-bold text-white">
            {displayName}
            {personaTitle && (
              <span className="ml-2 text-xl font-medium text-white/80">
                {personaTitle}
              </span>
            )}
          </h1>
          
          {/* Location with icon */}
          {location && (
            <p className="mt-2 flex items-center justify-center gap-1 text-white/70">
              <MapPin className="h-4 w-4" />
              <span>{location}</span>
            </p>
          )}
          
          {/* Tags - EXACT from image (e.g., "Deep Conversations · Small Groups") */}
          {displayTags && (
            <p className="mt-3 text-sm text-white/60">
              {displayTags}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function IdentitySkeleton({ 
  darkTheme = true,
  size = "medium" 
}: { 
  darkTheme?: boolean;
  size?: "small" | "medium" | "large";
}) {
  return (
    <div className={`w-full overflow-hidden rounded-3xl ${darkTheme ? "bg-gradient-to-b from-gray-900 to-gray-800" : "bg-card border border-border"} shadow-2xl animate-pulse`}>
      <div className="relative h-48 w-full bg-muted/30" />
      <div className="px-6 pb-6 pt-20">
        <div className="text-center">
          <div className="h-8 w-48 rounded-full bg-muted/40 mx-auto mb-2" />
          <div className="h-4 w-32 rounded bg-muted/30 mx-auto mb-2" />
          <div className="h-3 w-24 rounded bg-muted/20 mx-auto" />
        </div>
      </div>
    </div>
  );
}
