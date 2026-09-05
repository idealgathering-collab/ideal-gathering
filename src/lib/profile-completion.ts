import type { ProfileCardData } from "./profile-card";
import { hasAuraData, hasStyleData } from "./profile-card.functions";

/**
 * Profile completion system.
 * Checks which profile sections are complete and provides prompts.
 */

/**
 * Profile section types for completion tracking.
 */
export type ProfileSection = "aura" | "style" | "loves" | "here" | "story" | "identity";

/**
 * Completion status for a profile section.
 */
export interface SectionCompletion {
  /** Section identifier */
  section: ProfileSection;
  /** Whether the section is complete */
  isComplete: boolean;
  /** Completion percentage (0-100) */
  completionPercent: number;
  /** Translation key for the completion prompt */
  promptKey: string;
  /** Translation key for the completion title */
  titleKey?: string;
  /** Action URL to complete this section */
  actionUrl?: string;
  /** Number of items completed vs total */
  completedCount?: number;
  /** Total items possible */
  totalCount?: number;
}

/**
 * Overall profile completion status.
 */
export interface ProfileCompletion {
  /** Whether the profile is fully complete */
  isComplete: boolean;
  /** Overall completion percentage (0-100) */
  overallPercent: number;
  /** Number of sections completed */
  completedSections: number;
  /** Total number of sections */
  totalSections: number;
  /** Completion status for each section */
  sections: SectionCompletion[];
}

/**
 * Minimum requirements for each section to be considered complete.
 */
const SECTION_REQUIREMENTS: Record<ProfileSection, (profile: ProfileCardData) => boolean> = {
  aura: (p) => hasAuraData(p),
  style: (p) => hasStyleData(p),
  loves: (p) => p.interests.length > 0,
  here: (p) => p.intentions.length > 0,
  story: (p) => p.story.length > 0,
  identity: (p) => !!p.displayName && !!p.avatarUrl,
};

/**
 * Get completion percentage for a section.
 */
function getSectionPercent(section: ProfileSection, profile: ProfileCardData): number {
  switch (section) {
    case "aura":
      // Check how many traits are set
      const traits = [profile.traitSpark, profile.traitCuriosity, profile.traitWarmth, profile.traitDepth];
      const setTraits = traits.filter((t) => t !== null && t !== undefined).length;
      return (setTraits / 4) * 100;
    
    case "style":
      // Check how many style preferences are set
      const styleFields = [profile.energyLevel, profile.groupSize, profile.talkStyle, profile.newPeople];
      const setFields = styleFields.filter((f) => f !== null && f !== undefined).length;
      return (setFields / 4) * 100;
    
    case "loves":
      // Max 8 interests for 100%
      return Math.min((profile.interests.length / 8) * 100, 100);
    
    case "here":
      // Max 3 intentions for 100%
      return Math.min((profile.intentions.length / 3) * 100, 100);
    
    case "story":
      // Max 4 story items for 100%
      return Math.min((profile.story.length / 4) * 100, 100);
    
    case "identity":
      // Check display name and avatar
      const hasName = !!profile.displayName;
      const hasAvatar = !!profile.avatarUrl;
      const hasLocation = !!profile.city || !!profile.neighborhood || !!profile.country;
      let percent = 0;
      if (hasName) percent += 33;
      if (hasAvatar) percent += 34;
      if (hasLocation) percent += 33;
      return percent;
    
    default:
      return 0;
  }
}

/**
 * Get completion status for a specific section.
 */
export function getSectionCompletion(
  section: ProfileSection,
  profile: ProfileCardData,
  isSelf: boolean = false
): SectionCompletion {
  const isComplete = SECTION_REQUIREMENTS[section](profile);
  const completionPercent = getSectionPercent(section, profile);
  
  // Define prompt keys for each section
  const prompts: Record<ProfileSection, { promptKey: string; titleKey?: string; actionUrl?: string }> = {
    aura: {
      promptKey: "profile.completion.aura.prompt",
      titleKey: "profile.completion.aura.title",
      actionUrl: isSelf ? "/onboarding?step=quiz" : undefined,
    },
    style: {
      promptKey: "profile.completion.style.prompt",
      titleKey: "profile.completion.style.title",
      actionUrl: isSelf ? "/onboarding?step=prefs" : undefined,
    },
    loves: {
      promptKey: "profile.completion.loves.prompt",
      titleKey: "profile.completion.loves.title",
      actionUrl: isSelf ? "/profile#interests" : undefined,
    },
    here: {
      promptKey: "profile.completion.here.prompt",
      titleKey: "profile.completion.here.title",
      actionUrl: isSelf ? "/onboarding?step=prefs" : undefined,
    },
    story: {
      promptKey: "profile.completion.story.prompt",
      titleKey: "profile.completion.story.title",
      actionUrl: isSelf ? "/explore" : undefined,
    },
    identity: {
      promptKey: "profile.completion.identity.prompt",
      titleKey: "profile.completion.identity.title",
      actionUrl: isSelf ? "/profile" : undefined,
    },
  };
  
  const info = prompts[section];
  
  // Add count information for sections that have it
  let completedCount: number | undefined;
  let totalCount: number | undefined;
  
  switch (section) {
    case "loves":
      completedCount = profile.interests.length;
      totalCount = 8;
      break;
    case "here":
      completedCount = profile.intentions.length;
      totalCount = 3;
      break;
    case "story":
      completedCount = profile.story.length;
      totalCount = 4;
      break;
    case "aura":
      completedCount = [profile.traitSpark, profile.traitCuriosity, profile.traitWarmth, profile.traitDepth]
        .filter((t) => t !== null).length;
      totalCount = 4;
      break;
    case "style":
      completedCount = [profile.energyLevel, profile.groupSize, profile.talkStyle, profile.newPeople]
        .filter((f) => f !== null).length;
      totalCount = 4;
      break;
  }
  
  return {
    section,
    isComplete,
    completionPercent: Math.round(completionPercent),
    promptKey: info.promptKey,
    titleKey: info.titleKey,
    actionUrl: info.actionUrl,
    completedCount,
    totalCount,
  };
}

/**
 * Get overall profile completion status.
 */
export function getProfileCompletion(
  profile: ProfileCardData,
  isSelf: boolean = false
): ProfileCompletion {
  const sections: ProfileSection[] = ["identity", "aura", "style", "loves", "here", "story"];
  
  const sectionStatuses = sections.map((section) => 
    getSectionCompletion(section, profile, isSelf)
  );
  
  const completedSections = sectionStatuses.filter((s) => s.isComplete).length;
  const totalSections = sections.length;
  const overallPercent = Math.round(
    sectionStatuses.reduce((sum, s) => sum + s.completionPercent, 0) / totalSections
  );
  
  return {
    isComplete: completedSections === totalSections,
    overallPercent,
    completedSections,
    totalSections,
    sections: sectionStatuses,
  };
}

/**
 * Get completion level (none, low, medium, high, complete).
 */
export type CompletionLevel = "none" | "low" | "medium" | "high" | "complete";

export function getCompletionLevel(percent: number): CompletionLevel {
  if (percent >= 95) return "complete";
  if (percent >= 70) return "high";
  if (percent >= 40) return "medium";
  if (percent >= 10) return "low";
  return "none";
}

/**
 * Check if profile has any data at all.
 */
export function hasAnyProfileData(profile: ProfileCardData): boolean {
  return (
    hasAuraData(profile) ||
    hasStyleData(profile) ||
    profile.interests.length > 0 ||
    profile.intentions.length > 0 ||
    profile.story.length > 0 ||
    !!profile.displayName ||
    !!profile.avatarUrl ||
    !!profile.bio
  );
}

/**
 * Get the most incomplete section (for prioritizing prompts).
 */
export function getMostIncompleteSection(
  profile: ProfileCardData,
  isSelf: boolean = false
): SectionCompletion | null {
  const sections: ProfileSection[] = ["identity", "aura", "style", "loves", "here", "story"];
  
  const completions = sections
    .map((section) => getSectionCompletion(section, profile, isSelf))
    .filter((c) => !c.isComplete)
    .sort((a, b) => a.completionPercent - b.completionPercent);
  
  return completions.length > 0 ? completions[0] : null;
}

/**
 * Get completion badge color based on level.
 */
export function getCompletionColor(level: CompletionLevel): string {
  const colors: Record<CompletionLevel, string> = {
    none: "#6B7280",      // gray-500
    low: "#F59E0B",       // orange-500
    medium: "#3B82F6",     // blue-500
    high: "#10B981",      // green-500
    complete: "#8B5CF6",   // purple-500
  };
  return colors[level];
}

/**
 * Split an actionUrl like "/onboarding?step=prefs" or "/profile#interests"
 * into props usable by TanStack Router's <Link>.
 */
export function parseActionUrl(url: string): {
  to: string;
  search?: Record<string, string>;
  hash?: string;
} {
  const [pathAndSearch, hash] = url.split("#");
  const [to, query] = pathAndSearch.split("?");
  const search = query
    ? Object.fromEntries(new URLSearchParams(query).entries())
    : undefined;
  return { to, search, hash };
}
