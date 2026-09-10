import type { ProfileCardIdentity } from "@/lib/profile-card";
import { getDisplayName, getLocationString } from "@/lib/profile-card.functions";
import { getPersonaTitle, getPersonaTags } from "@/lib/persona";
import { useT } from "@/i18n";
import { Camera, MapPin, Sparkles } from "lucide-react";
import { MatchScoreBadge } from "@/components/profile/match-score";

export interface IdentityProps {
  identity: ProfileCardIdentity | null;
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
  isSelf?: boolean;
  onPickAvatar?: () => void;
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
  isSelf,
  onPickAvatar,
}: IdentityProps) {
  const t = useT();
  if (!identity) return <IdentitySkeleton darkTheme={darkTheme} />;

  const displayName = getDisplayName(identity);
  const location = getLocationString(identity);
  const coverUrl = identity.coverUrl || FALLBACK_COVER;
  const personaColor = identity.personaColor || PERSONA_COLORS.spark;
  const hasScores = !!scores && Object.values(scores).some((score) => score !== null);
  const normalizedScores = hasScores
    ? {
        spark: scores?.spark ?? 0,
        curiosity: scores?.curiosity ?? 0,
        warmth: scores?.warmth ?? 0,
        depth: scores?.depth ?? 0,
      }
    : null;
  const personaTitle = getPersonaTitle(normalizedScores, t);
  const tags = getPersonaTags({
    scores: normalizedScores,
    energyLevel: style?.energyLevel ?? null,
    groupSize: style?.groupSize ?? null,
    talkStyle: style?.talkStyle ?? null,
    intentions: intentions ?? null,
  }).slice(0, 3);

  return (
    <div className={`w-full overflow-hidden rounded-[2rem] ${darkTheme ? "bg-gradient-to-b from-gray-950 via-gray-900 to-gray-900" : "bg-card border border-border"} shadow-2xl ${className}`}>
      <div className="relative h-52 w-full overflow-hidden">
        <img src={coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/45 to-gray-950" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundColor: personaColor }} />

        {matchScore !== null && matchScore !== undefined && (
          <div className="absolute right-4 top-4">
            <MatchScoreBadge score={matchScore} size="medium" />
          </div>
        )}

        <div className="absolute bottom-0 left-1/2 translate-y-1/2 -translate-x-1/2">
          <div className="relative">
            <div
              className="absolute -inset-4 rounded-full border"
              style={{ borderColor: `${personaColor}70`, boxShadow: `0 0 35px ${personaColor}55` }}
            />
            <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-gray-800 shadow-2xl">
              {identity.avatarUrl ? (
                <img src={identity.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center bg-gradient-to-br from-purple-600 to-pink-700 text-5xl font-bold text-white">
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            {isSelf && onPickAvatar && (
              <button
                type="button"
                onClick={onPickAvatar}
                className="absolute bottom-0 right-0 z-10 grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
                aria-label={t("profile.uploadAvatar")}
                title={t("profile.uploadAvatar")}
              >
                <Camera className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pb-8 pt-20 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">{displayName}</h1>

        {personaTitle && (
          <div className="mt-2 flex items-center justify-center gap-1.5 text-base font-semibold" style={{ color: personaColor }}>
            <Sparkles className="h-4 w-4" />
            <span>{personaTitle}</span>
          </div>
        )}

        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/75">
                {tag}
              </span>
            ))}
          </div>
        )}

        {location && (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-white/55">
            <MapPin className="h-4 w-4" />
            <span>{location}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export function IdentitySkeleton({ darkTheme = true }: { darkTheme?: boolean; size?: "small" | "medium" | "large" }) {
  return (
    <div className={`w-full overflow-hidden rounded-[2rem] ${darkTheme ? "bg-gradient-to-b from-gray-950 to-gray-900" : "bg-card border border-border"} shadow-2xl animate-pulse`}>
      <div className="h-52 w-full bg-muted/30" />
      <div className="px-6 pb-8 pt-20 text-center">
        <div className="mx-auto h-8 w-48 rounded-full bg-muted/40" />
        <div className="mx-auto mt-3 h-4 w-36 rounded bg-muted/30" />
        <div className="mx-auto mt-4 h-3 w-28 rounded bg-muted/20" />
      </div>
    </div>
  );
}
