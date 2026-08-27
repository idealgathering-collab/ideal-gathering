import {
  EMPTY_PREFERENCES,
  hasAnyAnswer,
  type GatheringPreferences,
} from "@/lib/gathering-preferences";
import { GATHERING_TYPES, type GatheringType } from "@/lib/gathering-types";

export type Recommendable = {
  subject: string;
  description?: string | null;
  seats: number;
  starts_at?: string;
  gathering_type?: string | null;
};

export type PreferenceScore = {
  /** 0–100, or null when the viewer has no usable taste signal. */
  score: number | null;
  hasSignal: boolean;
  matchedTypes: GatheringType[];
  interestHits: number;
};

const NEUTRAL = 50;

/**
 * EN / TR / FA stems used to infer a gathering type from free-text subject.
 * Keys must match GATHERING_TYPES from gathering-types.ts
 */
export const TYPE_KEYWORDS: Record<GatheringType, string[]> = {
  coffee: ["coffee", "cafe", "café", "espresso", "latte", "kahve", "çay", "tea", "قهوه", "چای", "کافه"],
  food: [
    "dinner",
    "lunch",
    "brunch",
    "food",
    "restaurant",
    "eat",
    "yemek",
    "akşam",
    "sofra",
    "kahvaltı",
    "غذا",
    "شام",
    "ناهار",
    "صبحانه",
  ],
  city: ["city", "neighbourhood", "neighborhood", "walk the", "explore", "urban", "şehir", "mahalle", "keşif", "شهر", "محله", "downtown"],
  outdoors: [
    "hike",
    "hiking",
    "outdoor",
    "nature",
    "walk",
    "trail",
    "park",
    "beach",
    "picnic",
    "camp",
    "camping",
    "yürüyüş",
    "doğa",
    "kamp",
    "پیاده‌روی",
    "طبیعت",
    "کوه",
    "ساحل",
  ],
  games: ["game", "board game", "card game", "chess", "play", "oyun", "satranç", "kutu", "kart", "بازی", "شطرنج", "ورق"],
  creative: ["creative", "write", "paint", "craft", "draw", "make", "DIY", "yaratıcı", "yazı", "resim", "çizim", "yapım", "خلاق", "نقاشی", "نوشتن", "ساختن"],
  learning: ["learn", "workshop", "class", "study", "course", "educate", "öğren", "ders", "atölye", "eğitim", "یادگیر", "کارگاه", "کلاس", "دوره"],
  books: ["book", "books", "novel", "poetry", "read", "literature", "library", "kitap", "roman", "şiir", "okuma", "edebiyat", "کتاب", "شعر", "رمان", "ادبیات"],
  tech: ["tech", "startup", "ai", "code", "program", "software", "computer", "girişim", "teknoloji", "yazılım", "kod", "yapay zeka", "فناوری", "استارتاپ", "کد", "هوش مصنوعی"],
  arts: ["art", "museum", "theatre", "theater", "film", "cinema", "movie", "concert", "music", "dance", "sanat", "müze", "tiyatro", "sinema", "film", "konser", "müzik", "dans", "سینما", "موزه", "تئاتر", "هنر", "موسیقی"],
  spontaneous: ["tonight", "last minute", "spontaneous", "impromptu", "right now", "short notice", "bu akşam", "şimdi", "anında", "امشب", "الان", "فوری"],
};

const INTEREST_ALIASES: Record<string, string[]> = {
  coffee: ["coffee", "kahve", "espresso", "latte", "قهوه"],
  brunch: ["brunch", "kahvaltı", "برانچ"],
  tea: ["tea", "çay", "چای"],
  hiking: ["hike", "hiking", "yürüyüş", "کوه‌پیمایی", "پیاده‌روی"],
  camping: ["camp", "kamp", "کمپ"],
  cycling: ["cycle", "bike", "bisiklet", "دوچرخه"],
  beach: ["beach", "plaj", "ساحل"],
  live_music: ["live music", "concert", "canlı müzik", "موسیقی زنده"],
  museums: ["museum", "müze", "موزه"],
  theatre: ["theatre", "theater", "tiyatro", "تئاتر"],
  film: ["film", "cinema", "sinema", "سینما"],
  photography: ["photo", "fotoğraf", "عکس"],
  poetry: ["poem", "poetry", "şiir", "شعر"],
  board_games: ["board game", "kutu oyun", "بازی رومیزی"],
  chess: ["chess", "satranç", "شطرنج"],
  cooking: ["cook", "yemek", "آشپزی"],
  book_clubs: ["book", "kitap", "کتاب"],
  startups: ["startup", "girişim", "استارتاپ"],
  science: ["science", "bilim", "علم"],
  history: ["history", "tarih", "تاریخ"],
  philosophy: ["philosophy", "felsefe", "فلسفه"],
  technology: ["tech", "teknoloji", "فناوری"],
  psychology: ["psych", "psikoloji", "روان"],
  languages: ["language", "dil", "زبان"],
};

const DEEP_TOPIC = [
  "philosophy",
  "felsefe",
  "فلسفه",
  "meaning",
  "anlam",
  "idea",
  "fikir",
  "idea",
  "ایده",
  "book",
  "kitap",
  "کتاب",
];
const LIGHT_TOPIC = ["game", "oyun", "بازی", "karaoke", "joke", "eğlence", "fun"];

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFKC");
}

/** True when `needle` appears in hay as a whole token (latin) or substring (non-latin / multi-word). */
export function textHas(haystack: string, needle: string): boolean {
  const hay = normalize(haystack);
  const n = normalize(needle).trim();
  if (!n) return false;
  if (n.includes(" ") || /[^\x00-\x7F]/.test(n)) return hay.includes(n);
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escapeRegExp(n)}(?:$|[^\\p{L}\\p{N}])`, "u").test(hay);
}

export function gatheringText(g: Pick<Recommendable, "subject" | "description">): string {
  return `${g.subject ?? ""} ${g.description ?? ""}`;
}

/** Infer zero or more gathering-type slugs from subject + description.
 * If gathering has an explicit gathering_type, it's included first.
 */
export function inferGatheringTypes(g: Pick<Recommendable, "subject" | "description" | "gathering_type">): GatheringType[] {
  const hits: GatheringType[] = [];
  
  // If gathering has explicit type, include it first
  if (g.gathering_type && isGatheringType(g.gathering_type)) {
    hits.push(g.gathering_type);
  }
  
  const text = gatheringText(g);
  for (const type of GATHERING_TYPES) {
    // Skip if we already have this type from explicit field
    if (g.gathering_type === type) continue;
    const words = TYPE_KEYWORDS[type];
    if (words.some((w) => textHas(text, w))) hits.push(type);
  }
  return hits;
}

/** Check if a string is a valid gathering type. */
function isGatheringType(value: string): value is GatheringType {
  return (GATHERING_TYPES as readonly string[]).includes(value);
}

function typeScore(prefs: GatheringPreferences | null, inferred: GatheringType[]): { score: number; matched: GatheringType[] } {
  const wanted = (prefs?.gathering_types ?? []).filter((t): t is GatheringType => GATHERING_TYPES.includes(t as GatheringType));
  if (wanted.length === 0) return { score: NEUTRAL, matched: [] };
  if (inferred.length === 0) return { score: NEUTRAL, matched: [] };
  const matched = inferred.filter((t) => wanted.includes(t));
  if (matched.length === 0) return { score: 18, matched: [] };
  const overlap = matched.length / Math.max(wanted.length, inferred.length);
  return { score: Math.round(62 + overlap * 38), matched };
}

function sizeScore(preferred: number | null | undefined, seats: number): number {
  if (preferred == null) return NEUTRAL;
  const delta = Math.abs(seats - preferred);
  if (delta === 0) return 100;
  if (delta === 1) return 72;
  if (delta === 2) return 40;
  return 18;
}

function energyScore(energy: string | null | undefined, seats: number): number {
  if (!energy || energy === "depends" || energy === "mixed") return NEUTRAL;
  if (energy === "calm") return seats <= 4 ? 82 : seats <= 6 ? 48 : 22;
  if (energy === "lively") return seats >= 5 ? 82 : seats >= 4 ? 58 : 28;
  return NEUTRAL;
}

function conversationScore(style: string | null | undefined, text: string): number {
  if (!style || style === "all" || style === "mix") return NEUTRAL;
  const deep = DEEP_TOPIC.some((w) => textHas(text, w));
  const light = LIGHT_TOPIC.some((w) => textHas(text, w));
  if (style === "deep" || style === "meaningful") {
    if (deep) return 88;
    if (light) return 28;
    return NEUTRAL;
  }
  if (style === "light") {
    if (light) return 88;
    if (deep) return 32;
    return NEUTRAL;
  }
  return NEUTRAL;
}

function spontaneityScore(value: string | null | undefined, startsAt: string | undefined, now: Date): number {
  if (!value || !startsAt) return NEUTRAL;
  const at = new Date(startsAt).getTime();
  if (!Number.isFinite(at)) return NEUTRAL;
  const hours = (at - now.getTime()) / 3_600_000;
  if (value === "spontaneous") {
    if (hours <= 24) return 92;
    if (hours <= 72) return 70;
    return 38;
  }
  if (value === "planner") {
    if (hours >= 24 * 5) return 88;
    if (hours >= 48) return 62;
    return 30;
  }
  return NEUTRAL;
}

export function interestOverlap(interests: string[], text: string): number {
  let hits = 0;
  for (const tag of interests) {
    const aliases = INTEREST_ALIASES[tag] ?? [tag.replaceAll("_", " ")];
    if (aliases.some((w) => textHas(text, w))) hits += 1;
  }
  return hits;
}

/**
 * How well a public gathering matches the viewer's saved taste.
 * Uses only the viewer's own prefs/interests plus public gathering fields.
 */
export function preferenceScore(
  g: Recommendable,
  prefs: GatheringPreferences | null,
  interests: string[] = [],
  now: Date = new Date(),
): PreferenceScore {
  const usablePrefs = prefs && hasAnyAnswer(prefs) ? prefs : EMPTY_PREFERENCES;
  const hasPrefs = hasAnyAnswer(usablePrefs);
  const hasInterests = interests.length > 0;
  if (!hasPrefs && !hasInterests) {
    return { score: null, hasSignal: false, matchedTypes: [], interestHits: 0 };
  }

  const text = gatheringText(g);
  const inferred = inferGatheringTypes(g);
  const types = typeScore(hasPrefs ? usablePrefs : null, inferred);
  const size = sizeScore(usablePrefs.preferred_group_size, g.seats);
  const energy = energyScore(usablePrefs.social_energy, g.seats);
  const convo = conversationScore(usablePrefs.conversation_style, text);
  const spont = spontaneityScore(usablePrefs.spontaneity, g.starts_at, now);
  const hits = interestOverlap(interests, text);
  const interest = hasInterests ? Math.min(100, 36 + hits * 28) : NEUTRAL;

  // Weighted blend. Missing signals sit at NEUTRAL so they don't drag a strong match.
  const score = Math.round(
    types.score * 0.34 +
      size * 0.18 +
      energy * 0.1 +
      convo * 0.1 +
      spont * 0.08 +
      interest * 0.2,
  );

  return {
    score: Math.max(0, Math.min(100, score)),
    hasSignal: true,
    matchedTypes: types.matched,
    interestHits: hits,
  };
}

/**
 * Combine table-chemistry (quiz) with taste (prefs / interests).
 * Either signal alone is enough to rank; both together prefer chemistry.
 */
export function composeRank(traitFit: number | null | undefined, preference: number | null | undefined): number | null {
  const trait = typeof traitFit === "number" ? traitFit : null;
  const pref = typeof preference === "number" ? preference : null;
  if (trait == null && pref == null) return null;
  if (trait == null) return pref;
  if (pref == null) return trait;
  return Math.round(trait * 0.62 + pref * 0.38);
}
