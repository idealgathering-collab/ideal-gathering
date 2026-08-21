import { useState, type ComponentType } from "react";
import {
  Armchair,
  ArrowLeft,
  Book,
  Clock,
  Coffee,
  Compass,
  Ear,
  Flame,
  Heart,
  Map,
  Mic,
  Moon,
  Sparkles,
  Users,
} from "lucide-react";
import { useT } from "@/i18n";
import { QUIZ, TRAITS, levelFor, scoreQuiz, type Answers } from "@/lib/matching";

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  flame: Flame,
  armchair: Armchair,
  moon: Moon,
  compass: Compass,
  coffee: Coffee,
  sparkles: Sparkles,
  users: Users,
  heart: Heart,
  book: Book,
  map: Map,
  mic: Mic,
  ear: Ear,
  clock: Clock,
};

/**
 * The quiz question flow rendered in app (not landing) styling.
 * Uses the same QUIZ data and scoring as the landing widget — no logic changes.
 */
export function OnboardingQuiz({
  onDone,
  onSkip,
}: {
  onDone: (result: ReturnType<typeof scoreQuiz>) => void;
  onSkip: () => void;
}) {
  const t = useT();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const question = QUIZ[index];

  function answer(value: number | null) {
    const next = { ...answers, [question.k]: value };
    setAnswers(next);
    if (index >= QUIZ.length - 1) onDone(scoreQuiz(next));
    else setIndex(index + 1);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("landing.v3.matching.quiz.progress")
            .replace("{n}", String(index + 1))
            .replace("{total}", String(QUIZ.length))}
        </p>
        <button
          type="button"
          onClick={onSkip}
          className="text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("onboarding.quiz.skip")}
        </button>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 motion-reduce:transition-none"
          style={{ width: `${((index + 1) / QUIZ.length) * 100}%` }}
        />
      </div>

      <h2 className="font-display mt-6 text-2xl sm:text-3xl">
        {t(`landing.v3.matching.${question.k}.q`)}
      </h2>

      <div className="mt-6 flex flex-col gap-3">
        {question.options.map((opt, i) => {
          const Icon = ICONS[opt.icon] ?? Sparkles;
          const selected = answers[question.k] === i;
          return (
            <button
              key={opt.k}
              type="button"
              onClick={() => answer(i)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-start transition ${
                selected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
              }`}
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium leading-snug">
                {t(`landing.v3.matching.${question.k}.${opt.k}`)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex(Math.max(0, index - 1))}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t("landing.v3.matching.quiz.back")}
        </button>
        <button
          type="button"
          onClick={() => answer(null)}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("landing.v3.matching.quiz.skip")}
        </button>
      </div>
    </div>
  );
}

/** Result summary shown right after the last question. */
export function OnboardingQuizResult({ result }: { result: ReturnType<typeof scoreQuiz> }) {
  const t = useT();
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">
        {t("landing.v3.matching.match.yourLabel")}
      </p>
      <h2 className="font-display mt-2 text-2xl sm:text-3xl">
        {t(`landing.v3.matching.persona.${result.persona}.title`)}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {t(`landing.v3.matching.persona.${result.persona}.body`)}
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {TRAITS.map((trait) => {
          const value = result.scores[trait];
          return (
            <div key={trait}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{t(`landing.v3.matching.trait.${trait}`)}</span>
                <span className="text-muted-foreground">
                  {t(`landing.v3.matching.match.level.${levelFor(value)}`)} · {value}%
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700 motion-reduce:transition-none"
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {result.answered < result.total && (
        <p className="mt-4 text-xs text-muted-foreground">
          {t("landing.v3.matching.match.partial")
            .replace("{n}", String(result.answered))
            .replace("{total}", String(result.total))}
        </p>
      )}
    </div>
  );
}
