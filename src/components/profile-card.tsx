import { useState, useEffect, useMemo } from "react";
import type { ProfileCardData } from "@/lib/profile-card";
import { loadProfileCardData } from "@/lib/profile-card.functions";
import { PROFILE_SECTORS } from "@/lib/profile-sectors";
import { Identity, IdentitySkeleton } from "@/components/profile/identity";
import { Aura } from "@/components/profile/aura";
import { Style } from "@/components/profile/style";
import { Loves } from "@/components/profile/loves";
import { Here } from "@/components/profile/here";
import { Story } from "@/components/profile/story";
import { ProfileCompletionCard } from "@/components/profile/completion-badge";
import { MatchCompatibility } from "@/components/profile/match-score";
import { getProfileCompletion, getSectionCompletion } from "@/lib/profile-completion";
import { calculateUserMatch } from "@/lib/user-match";

/**
 * Guest Profile Card - EXACT match to image design
 * Photo-first phone card (430px column)
 * Sectors: aura → style → loves → here → story
 * Trust is OFF - not included
 * Dark theme with purple/black background
 */
export interface ProfileCardProps {
  userId?: string;
  profile?: ProfileCardData | null;
  loading?: boolean;
  darkTheme?: boolean;
  matchScore?: number | null;
  interactive?: boolean;
  onStoryItemClick?: (item: ProfileCardData["story"][0]) => void;
  className?: string;
  /**
   * Whether this is the viewer's own profile.
   * Used to show completion prompts.
   */
  isSelf?: boolean;
  /**
   * Click handler for completion prompts.
   */
  onComplete?: () => void;
  /**
   * Viewer's profile (for calculating match score between viewer and profile).
   */
  viewerProfile?: ProfileCardData | null;
  /**
   * Viewer's date of birth (for age compatibility).
   */
  viewerDob?: string | null;
  /**
   * Whether to show match breakdown.
   */
  showMatchBreakdown?: boolean;
}

/**
 * Skeleton loader - EXACT match to image
 */
export function ProfileCardSkeleton({
  darkTheme = true,
  className = "",
}: {
  darkTheme?: boolean;
  className?: string;
}) {
  return (
    <div className={`w-full max-w-[430px] mx-auto ${className}`}>
      <IdentitySkeleton darkTheme={darkTheme} />
      
      <div className="-mt-6 px-4 pb-4">
        <div className="rounded-3xl bg-gray-900/80 backdrop-blur-lg border border-white/10 p-4 space-y-6">
          {PROFILE_SECTORS.map((sector) => (
            <div key={sector} className="animate-pulse">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-5 w-5 rounded bg-white/10" />
                <div className="h-4 w-24 rounded bg-white/10 flex-1" />
                <div className="h-4 w-4 rounded bg-white/10" />
              </div>
              <div className="flex gap-2">
                <div className="h-20 w-20 rounded-2xl bg-white/5" />
                <div className="h-20 w-20 rounded-2xl bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfileCard({
  userId,
  profile: propProfile,
  loading: propLoading,
  darkTheme = true,
  matchScore,
  interactive = false,
  onStoryItemClick,
  className = "",
  isSelf,
  onComplete,
  viewerProfile,
  viewerDob,
  showMatchBreakdown,
}: ProfileCardProps) {
  const [profile, setProfile] = useState<ProfileCardData | null>(propProfile ?? null);
  const [loading, setLoading] = useState(propLoading ?? !propProfile);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (userId && !propProfile && !profile) {
      setLoading(true);
      loadProfileCardData(userId)
        .then((p) => {
          setProfile(p);
          setError(null);
        })
        .catch((err) => {
          setError(err instanceof Error ? err : new Error("Failed to load profile"));
          setProfile(null);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [userId, propProfile, profile]);

  useEffect(() => {
    if (propProfile !== undefined) {
      setProfile(propProfile);
    }
  }, [propProfile]);

  // Calculate match score if we have a viewer profile (hook must run before early returns)
  const matchResult = useMemo(() => {
    if (!viewerProfile || !profile || isSelf) return null;
    return calculateUserMatch(viewerProfile, profile, viewerDob ?? null, profile.dateOfBirth ?? null);
  }, [viewerProfile, profile, viewerDob, isSelf]);

  if (loading) {
    return <ProfileCardSkeleton darkTheme={darkTheme} className={className} />;
  }

  if (error) {
    return (
      <div className={`w-full max-w-[430px] mx-auto ${className}`}>
        <div className="rounded-3xl border border-border bg-card p-6 text-center">
          <p className="text-muted-foreground">Error loading profile</p>
          <p className="text-sm text-muted-foreground/70">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={`w-full max-w-[430px] mx-auto ${className}`}>
        <div className="rounded-3xl border border-border bg-card p-6 text-center">
          <p className="text-muted-foreground">Profile not found</p>
        </div>
      </div>
    );
  }

  // Extract sector data
  const identity = {
    id: profile.id,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    coverUrl: profile.coverUrl,
    city: profile.city,
    neighborhood: profile.neighborhood,
    country: profile.country,
    personaColor: profile.personaColor,
  };

  const scores = {
    spark: profile.traitSpark,
    curiosity: profile.traitCuriosity,
    warmth: profile.traitWarmth,
    depth: profile.traitDepth,
  };

  const style = {
    energyLevel: profile.energyLevel,
    groupSize: profile.groupSize,
    talkStyle: profile.talkStyle,
  };

  const aura = {
    personaColor: profile.personaColor,
    traitSpark: profile.traitSpark,
    traitCuriosity: profile.traitCuriosity,
    traitWarmth: profile.traitWarmth,
    traitDepth: profile.traitDepth,
  };

  const styleData = {
    energyLevel: profile.energyLevel,
    groupSize: profile.groupSize,
    talkStyle: profile.talkStyle,
    newPeople: profile.newPeople,
  };

  const loves = {
    interests: profile.interests,
  };

  const here = {
    intentions: profile.intentions,
  };

  const story = {
    items: profile.story,
  };

  // Calculate completion
  const isSelfProfile = isSelf ?? false;
  const completion = getProfileCompletion(profile, isSelfProfile);
  const sectionCompletions = {
    aura: getSectionCompletion("aura", profile, isSelfProfile),
    style: getSectionCompletion("style", profile, isSelfProfile),
    loves: getSectionCompletion("loves", profile, isSelfProfile),
    here: getSectionCompletion("here", profile, isSelfProfile),
    story: getSectionCompletion("story", profile, isSelfProfile),
  };

  // Use provided matchScore or calculated one
  const displayMatchScore = matchScore ?? matchResult?.score ?? null;

  return (
    <div className={`w-full max-w-[430px] mx-auto ${className}`}>
      {/* Identity header - EXACT from image */}
      <Identity
        identity={identity}
        scores={scores}
        style={style}
        intentions={profile.intentions}
        matchScore={displayMatchScore}
        darkTheme={darkTheme}
      />
      
      {/* Match compatibility breakdown (only for other users) */}
      {!isSelfProfile && matchResult && showMatchBreakdown && (
        <div className="px-4 mt-2">
          <MatchCompatibility matchResult={matchResult} />
        </div>
      )}

      {/* Profile completion card (only for self) */}
      {isSelfProfile && !completion.isComplete && (
        <div className="mt-4 px-4">
          <ProfileCompletionCard
            overallPercent={completion.overallPercent}
            completedSections={completion.completedSections}
            totalSections={completion.totalSections}
            isSelf={true}
            onComplete={onComplete}
          />
        </div>
      )}

      {/* Sectors container - EXACT from image: rounded container with sectors */}
      <div className="-mt-6 px-4 pb-4">
        <div className="rounded-3xl bg-gray-900/90 backdrop-blur-lg border border-white/10 p-4 space-y-6">
          {/* Sectors: aura → style → loves → here → story */}
          <Aura 
            aura={aura} 
            completion={sectionCompletions.aura}
            isSelf={isSelfProfile}
          />
          <Style 
            style={styleData} 
            completion={sectionCompletions.style}
            isSelf={isSelfProfile}
          />
          <Loves 
            loves={loves} 
            completion={sectionCompletions.loves}
            isSelf={isSelfProfile}
          />
          <Here 
            here={here} 
            completion={sectionCompletions.here}
            isSelf={isSelfProfile}
          />
          <Story
            story={story}
            interactive={interactive}
            onItemClick={onStoryItemClick}
            showViewAll={false}
            completion={sectionCompletions.story}
            isSelf={isSelfProfile}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version for lists/grids
 */
export function ProfileCardCompact({
  profile,
  onClick,
  matchScore,
  darkTheme = true,
  className = "",
}: {
  profile: ProfileCardData | null;
  onClick?: () => void;
  matchScore?: number | null;
  darkTheme?: boolean;
  className?: string;
}) {
  if (!profile) {
    return <ProfileCardSkeleton darkTheme={darkTheme} className={className} />;
  }

  const identity = {
    id: profile.id,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    coverUrl: profile.coverUrl,
    city: profile.city,
    neighborhood: profile.neighborhood,
    country: profile.country,
    personaColor: profile.personaColor,
  };

  const scores = {
    spark: profile.traitSpark,
    curiosity: profile.traitCuriosity,
    warmth: profile.traitWarmth,
    depth: profile.traitDepth,
  };

  const style = {
    energyLevel: profile.energyLevel,
    groupSize: profile.groupSize,
    talkStyle: profile.talkStyle,
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-start ${className}`}
    >
      <Identity
        identity={identity}
        scores={scores}
        style={style}
        intentions={profile.intentions}
        matchScore={matchScore}
        darkTheme={darkTheme}
      />
    </button>
  );
}
