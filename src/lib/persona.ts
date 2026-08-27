/**
 * Persona system for guest profiles.
 * Based on quiz trait scores, assigns a persona with title and description.
 */

import type { TraitScores } from "@/lib/matching";

/**
 * Available personas with their defining traits.
 */
export const PERSONAS = {
  spark: {
    id: "spark" as const,
    titleKey: "persona.spark.title",
    descriptionKey: "persona.spark.description",
    icon: "⚡",
    color: "#EF4444",
    // Spark personas are energetic, initiating
    tags: ["Deep Conversations", "New Experiences"],
  },
  curiosity: {
    id: "curiosity" as const,
    titleKey: "persona.curiosity.title",
    descriptionKey: "persona.curiosity.description",
    icon: "🔍",
    color: "#F59E0B",
    tags: ["Exploring", "New Experiences"],
  },
  warmth: {
    id: "warmth" as const,
    titleKey: "persona.warmth.title",
    descriptionKey: "persona.warmth.description",
    icon: "❤️",
    color: "#10B981",
    tags: ["Deep Conversations", "Meaningful Connections"],
  },
  depth: {
    id: "depth" as const,
    titleKey: "persona.depth.title",
    descriptionKey: "persona.depth.description",
    icon: "🌊",
    color: "#8B5CF6",
    tags: ["Deep Conversations", "Meaningful Connections"],
  },
} as const;

export type PersonaId = keyof typeof PERSONAS;
export type Persona = typeof PERSONAS[PersonaId];

/**
 * Get persona from trait scores.
 * Returns the persona with the highest trait score.
 */
export function getPersona(scores: TraitScores | null): Persona | null {
  if (!scores) return null;
  
  const entries = Object.entries(PERSONAS) as [PersonaId, Persona][];
  const highest = entries.reduce<{ id: PersonaId; persona: Persona }>((best, [id, persona]) => {
    const score = scores[id];
    const bestScore = scores[best.id];
    return score > bestScore ? { id, persona } : best;
  }, { id: "spark" as PersonaId, persona: PERSONAS.spark as Persona });
  
  return highest.persona;
}

/**
 * Get persona ID from trait scores.
 */
export function getPersonaId(scores: TraitScores | null): PersonaId | null {
  const persona = getPersona(scores);
  return persona ? persona.id : null;
}

/**
 * Get persona title from trait scores.
 */
export function getPersonaTitle(scores: TraitScores | null, t: (key: string) => string = (k) => k): string | null {
  const persona = getPersona(scores);
  if (!persona) return null;
  
  const title = t(persona.titleKey);
  // If translation not found, use a default
  if (title === persona.titleKey) {
    return formatPersonaId(persona.id);
  }
  return title;
}

/**
 * Format persona ID as a human-readable title.
 */
export function formatPersonaId(id: PersonaId): string {
  const titles: Record<PersonaId, string> = {
    spark: "The Spark",
    curiosity: "The Curious Explorer",
    warmth: "The Warm Connector",
    depth: "The Deep Listener",
  };
  return titles[id] || id;
}

/**
 * Get persona color from trait scores.
 */
export function getPersonaColor(scores: TraitScores | null): string | null {
  const persona = getPersona(scores);
  return persona ? persona.color : null;
}

/**
 * Get persona tags from trait scores and style preferences.
 */
export function getPersonaTags({
  scores,
  energyLevel,
  groupSize,
  talkStyle,
  intentions,
}: {
  scores: TraitScores | null;
  energyLevel: string | null;
  groupSize: string | null;
  talkStyle: string | null;
  intentions: string[] | null;
}): string[] {
  const tags: string[] = [];
  
  // Add tags from persona
  const persona = getPersona(scores);
  if (persona && persona.tags) {
    tags.push(...persona.tags);
  }
  
  // Add tags from style preferences
  if (groupSize) {
    const sizeTags: Record<string, string> = {
      intimate: "Small Groups",
      small: "Small Groups",
      large: "Large Groups",
    };
    const tag = sizeTags[groupSize];
    if (tag && !tags.includes(tag)) {
      tags.push(tag);
    }
  }
  
  if (talkStyle) {
    const talkTags: Record<string, string> = {
      listener: "Deep Conversations",
      balanced: "Meaningful Conversations",
      talker: "Engaging Discussions",
    };
    const tag = talkTags[talkStyle];
    if (tag && !tags.includes(tag)) {
      tags.push(tag);
    }
  }
  
  // Add tags from intentions
  if (intentions && intentions.length > 0) {
    // Map intentions to display tags
    const intentionTags: Record<string, string> = {
      meaningful_conversations: "Meaningful Conversations",
      new_experiences: "New Experiences",
      interesting_people: "Interesting People",
      learn_something: "Learning",
      make_friends: "Making Friends",
    };
    for (const intention of intentions) {
      const tag = intentionTags[intention] || intention;
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    }
  }
  
  // Limit to 3 tags
  return tags.slice(0, 3);
}

/**
 * Get persona icon from trait scores.
 */
export function getPersonaIcon(scores: TraitScores | null): string {
  const persona = getPersona(scores);
  return persona ? persona.icon : "✨";
}
