export const TRAITS = ["spark", "curiosity", "warmth", "depth"] as const;
export type Trait = (typeof TRAITS)[number];

export type TraitScores = Record<Trait, number>;

type Weights = Partial<Record<Trait, number>>;

export type QuizQuestion = {
  /** translation key suffix, e.g. "q1" */
  k: string;
  options: { k: string; icon: string; weights: Weights }[];
};

/**
 * 12 playful scenarios. Each answer nudges one or two traits.
 * Copy lives in i18n under `landing.v3.matching.<q>.<option>`.
 */
export const QUIZ: QuizQuestion[] = [
  {
    k: "q1",
    options: [
      { k: "a1", icon: "flame", weights: { spark: 2 } },
      { k: "a2", icon: "armchair", weights: { warmth: 1, depth: 1 } },
      { k: "a3", icon: "moon", weights: { depth: 2 } },
    ],
  },
  {
    k: "q2",
    options: [
      { k: "a1", icon: "compass", weights: { curiosity: 2 } },
      { k: "a2", icon: "coffee", weights: { warmth: 2 } },
      { k: "a3", icon: "sparkles", weights: { spark: 1, curiosity: 1 } },
    ],
  },
  {
    k: "q3",
    options: [
      { k: "a1", icon: "users", weights: { spark: 2 } },
      { k: "a2", icon: "heart", weights: { warmth: 2 } },
      { k: "a3", icon: "book", weights: { depth: 2 } },
    ],
  },
  {
    k: "q4",
    options: [
      { k: "a1", icon: "flame", weights: { spark: 2 } },
      { k: "a2", icon: "armchair", weights: { warmth: 1, depth: 1 } },
      { k: "a3", icon: "moon", weights: { curiosity: 1, depth: 1 } },
    ],
  },
  {
    k: "q5",
    options: [
      { k: "a1", icon: "compass", weights: { curiosity: 2 } },
      { k: "a2", icon: "map", weights: { curiosity: 1, spark: 1 } },
      { k: "a3", icon: "coffee", weights: { warmth: 1, depth: 1 } },
    ],
  },
  {
    k: "q6",
    options: [
      { k: "a1", icon: "mic", weights: { spark: 2 } },
      { k: "a2", icon: "ear", weights: { warmth: 1, depth: 1 } },
      { k: "a3", icon: "book", weights: { depth: 2 } },
    ],
  },
  {
    k: "q7",
    options: [
      { k: "a1", icon: "heart", weights: { warmth: 2 } },
      { k: "a2", icon: "sparkles", weights: { spark: 1, warmth: 1 } },
      { k: "a3", icon: "compass", weights: { curiosity: 2 } },
    ],
  },
  {
    k: "q8",
    options: [
      { k: "a1", icon: "clock", weights: { depth: 2 } },
      { k: "a2", icon: "users", weights: { spark: 1, curiosity: 1 } },
      { k: "a3", icon: "coffee", weights: { warmth: 2 } },
    ],
  },
  {
    k: "q9",
    options: [
      { k: "a1", icon: "map", weights: { curiosity: 2 } },
      { k: "a2", icon: "armchair", weights: { warmth: 1, depth: 1 } },
      { k: "a3", icon: "flame", weights: { spark: 2 } },
    ],
  },
  {
    k: "q10",
    options: [
      { k: "a1", icon: "book", weights: { depth: 2 } },
      { k: "a2", icon: "sparkles", weights: { curiosity: 2 } },
      { k: "a3", icon: "heart", weights: { warmth: 2 } },
    ],
  },
  {
    k: "q11",
    options: [
      { k: "a1", icon: "mic", weights: { spark: 1, warmth: 1 } },
      { k: "a2", icon: "ear", weights: { warmth: 2 } },
      { k: "a3", icon: "compass", weights: { curiosity: 1, depth: 1 } },
    ],
  },
  {
    k: "q12",
    options: [
      { k: "a1", icon: "clock", weights: { depth: 1, warmth: 1 } },
      { k: "a2", icon: "flame", weights: { spark: 2 } },
      { k: "a3", icon: "map", weights: { curiosity: 2 } },
    ],
  },
];

export type Answers = Record<string, number | null>;

export type MatchLevel = "high" | "good" | "steady";

export type QuizResult = {
  scores: TraitScores;
  top: Trait;
  second: Trait;
  answered: number;
  total: number;
  persona: Trait;
};

const MAX_PER_TRAIT = QUIZ.reduce((acc, q) => {
  for (const t of TRAITS) {
    const best = Math.max(0, ...q.options.map((o) => o.weights[t] ?? 0));
    acc[t] = (acc[t] ?? 0) + best;
  }
  return acc;
}, {} as TraitScores);

export function scoreQuiz(answers: Answers): QuizResult {
  const raw: TraitScores = { spark: 0, curiosity: 0, warmth: 0, depth: 0 };
  let answered = 0;

  for (const q of QUIZ) {
    const idx = answers[q.k];
    if (idx === null || idx === undefined) continue;
    const opt = q.options[idx];
    if (!opt) continue;
    answered += 1;
    for (const t of TRAITS) raw[t] += opt.weights[t] ?? 0;
  }

  const scores = {} as TraitScores;
  for (const t of TRAITS) {
    const pct = MAX_PER_TRAIT[t] > 0 ? (raw[t] / MAX_PER_TRAIT[t]) * 100 : 0;
    // Lift into a friendly display band so no one reads as "0% warmth".
    scores[t] = Math.round(Math.min(100, 42 + pct * 0.58));
  }

  const ordered = [...TRAITS].sort((a, b) => scores[b] - scores[a]);

  return {
    scores,
    top: ordered[0],
    second: ordered[1],
    answered,
    total: QUIZ.length,
    persona: ordered[0],
  };
}

export function levelFor(score: number): MatchLevel {
  if (score >= 80) return "high";
  if (score >= 62) return "good";
  return "steady";
}

/** Row shape holding trait columns as stored on `profiles`. */
export type TraitRow = {
  trait_spark: number | null;
  trait_curiosity: number | null;
  trait_warmth: number | null;
  trait_depth: number | null;
};

/** Returns trait scores from a profile row, or null when the quiz wasn't taken. */
export function traitsFromRow(row: TraitRow | null | undefined): TraitScores | null {
  if (!row) return null;
  const { trait_spark, trait_curiosity, trait_warmth, trait_depth } = row;
  if (
    trait_spark === null ||
    trait_curiosity === null ||
    trait_warmth === null ||
    trait_depth === null ||
    trait_spark === undefined ||
    trait_curiosity === undefined ||
    trait_warmth === undefined ||
    trait_depth === undefined
  ) {
    return null;
  }
  return {
    spark: trait_spark,
    curiosity: trait_curiosity,
    warmth: trait_warmth,
    depth: trait_depth,
  };
}

/** Average of several trait score sets. Returns null for an empty list. */
export function averageTraits(list: TraitScores[]): TraitScores | null {
  if (list.length === 0) return null;
  const sum: TraitScores = { spark: 0, curiosity: 0, warmth: 0, depth: 0 };
  for (const s of list) for (const t of TRAITS) sum[t] += s[t];
  const avg = {} as TraitScores;
  for (const t of TRAITS) avg[t] = sum[t] / list.length;
  return avg;
}

/**
 * Pure pairwise compatibility: 100 minus the mean absolute per-trait distance,
 * clamped to 0–100. Shared by the UI today and by batch seating later.
 */
export function fitScore(a: TraitScores, b: TraitScores): number {
  let total = 0;
  for (const t of TRAITS) total += Math.abs(a[t] - b[t]);
  const distance = total / TRAITS.length;
  return Math.round(Math.max(0, Math.min(100, 100 - distance)));
}

/**
 * Mean fit across every unique pair. A table has to work for everyone at it,
 * not just the host vs each guest.
 */
export function meanPairwiseFit(people: TraitScores[]): number | null {
  if (people.length < 2) return null;
  let sum = 0;
  let n = 0;
  for (let i = 0; i < people.length; i++) {
    for (let j = i + 1; j < people.length; j++) {
      sum += fitScore(people[i], people[j]);
      n += 1;
    }
  }
  return n === 0 ? null : sum / n;
}


export const QUIZ_STORAGE_KEY = "ig.matching.quiz.v1";

export type StoredQuiz = { answers: Answers; done: boolean };

export function loadQuiz(): StoredQuiz | null {
  try {
    const raw = localStorage.getItem(QUIZ_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredQuiz;
    if (!parsed || typeof parsed !== "object" || !parsed.answers) return null;
    return { answers: parsed.answers, done: Boolean(parsed.done) };
  } catch {
    return null;
  }
}

export function saveQuiz(value: StoredQuiz) {
  try {
    localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* storage unavailable — quiz still works for this visit */
  }
}

export function clearQuiz() {
  try {
    localStorage.removeItem(QUIZ_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
