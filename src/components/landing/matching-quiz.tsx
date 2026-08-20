import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Link } from "@tanstack/react-router";
import {
  Armchair,
  ArrowLeft,
  ArrowRight,
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
  RotateCcw,
  Sparkles,
  Users,
} from "lucide-react";
import { useT } from "@/i18n";
import {
  QUIZ,
  TRAITS,
  clearQuiz,
  levelFor,
  loadQuiz,
  saveQuiz,
  scoreQuiz,
  tableMates,
  type Answers,
  type MatchLevel,
} from "@/lib/matching";

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

const PREVIEW_SCORES: Record<string, number> = {
  spark: 92,
  curiosity: 87,
  warmth: 74,
  depth: 66,
};

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function MatchBar({
  fill,
  level,
  animate,
}: {
  fill: number;
  level: MatchLevel;
  animate: boolean;
}) {
  const t = useT();
  return (
    <div className="mt-2">
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${animate ? "transition-all duration-700" : ""}`}
          style={{
            width: `${fill}%`,
            background:
              level === "high"
                ? "linear-gradient(90deg, #A78BFA 0%, #7C3AED 100%)"
                : level === "good"
                  ? "linear-gradient(90deg, #F5D08A 0%, #F59E0B 100%)"
                  : "linear-gradient(90deg, rgba(196,181,253,0.6) 0%, rgba(139,124,196,0.8) 100%)",
          }}
        />
      </div>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-[rgba(196,181,253,0.7)]">
        {t(`landing.v3.matching.match.level.${level}`)}
      </p>
    </div>
  );
}

export function MatchingQuiz() {
  const t = useT();
  const reduced = useReducedMotion();

  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadQuiz();
    if (stored) {
      setAnswers(stored.answers);
      setDone(stored.done);
      setStarted(true);
      if (!stored.done) {
        const next = QUIZ.findIndex((q) => !(q.k in stored.answers));
        setIndex(next === -1 ? 0 : next);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !started) return;
    saveQuiz({ answers, done });
  }, [answers, done, started, hydrated]);

  const result = useMemo(() => scoreQuiz(answers), [answers]);
  const question = QUIZ[index];

  function advance(nextAnswers: Answers) {
    if (index >= QUIZ.length - 1) {
      setDone(true);
    } else {
      setIndex(index + 1);
    }
    setAnswers(nextAnswers);
  }

  function reset() {
    clearQuiz();
    setAnswers({});
    setDone(false);
    setIndex(0);
    setStarted(false);
  }

  const showResult = done;

  return (
    <>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {/* Quiz card */}
        <div className="cosmic-panel h-full p-6 sm:p-8">
          {!started || done ? (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sunshine">
                {done
                  ? t("landing.v3.matching.quiz.doneLabel")
                  : t("landing.v3.matching.quiz.label")}
              </p>
              <h3 className="font-serif-warm mt-3 text-xl font-semibold text-white sm:text-2xl">
                {done
                  ? t("landing.v3.matching.quiz.doneTitle")
                  : t("landing.v3.matching.q4.q")}
              </h3>
              {done && (
                <p className="mt-3 text-sm leading-relaxed text-[rgba(221,214,254,0.78)]">
                  {t("landing.v3.matching.quiz.doneBody")}
                </p>
              )}

              {!done && (
                <div className="mt-6 flex flex-col gap-3">
                  {QUIZ[3].options.map((opt, i) => {
                    const Icon = ICONS[opt.icon] ?? Sparkles;
                    const selected = i === 1;
                    return (
                      <div
                        key={opt.k}
                        className={`flex items-center gap-3 rounded-2xl border p-3.5 ${
                          selected
                            ? "border-[rgba(167,139,250,0.55)] bg-[rgba(124,58,237,0.22)] text-white"
                            : "border-white/10 bg-white/[0.035] text-[rgba(196,181,253,0.85)]"
                        }`}
                      >
                        <span
                          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            selected
                              ? "bg-[rgba(167,139,250,0.25)] text-[#EDE9FE]"
                              : "bg-white/5 text-[rgba(196,181,253,0.7)]"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-medium leading-snug">
                          {t(`landing.v3.matching.q4.${opt.k}`)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (done) reset();
                    setStarted(true);
                    setDone(false);
                    setIndex(0);
                    setAnswers({});
                  }}
                  className="cosmic-cta inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white"
                >
                  {done
                    ? t("landing.v3.matching.quiz.retake")
                    : t("landing.v3.matching.quiz.start")}
                  {done ? (
                    <RotateCcw className="h-4 w-4" />
                  ) : (
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  )}
                </button>
                <span className="text-xs text-[rgba(196,181,253,0.6)]">
                  {t("landing.v3.matching.quiz.optional")}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sunshine">
                  {t("landing.v3.matching.quiz.progress")
                    .replace("{n}", String(index + 1))
                    .replace("{total}", String(QUIZ.length))}
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="text-[11px] uppercase tracking-wider text-[rgba(196,181,253,0.6)] transition-colors hover:text-white"
                >
                  {t("landing.v3.matching.quiz.startOver")}
                </button>
              </div>

              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full bg-gradient-to-r from-[#A78BFA] to-[#7C3AED] ${
                    reduced ? "" : "transition-all duration-500"
                  }`}
                  style={{ width: `${((index + 1) / QUIZ.length) * 100}%` }}
                />
              </div>

              <h3
                key={question.k}
                className={`font-serif-warm mt-5 text-xl font-semibold text-white sm:text-2xl ${
                  reduced ? "" : "animate-in fade-in duration-300"
                }`}
              >
                {t(`landing.v3.matching.${question.k}.q`)}
              </h3>

              <div className="mt-6 flex flex-col gap-3">
                {question.options.map((opt, i) => {
                  const Icon = ICONS[opt.icon] ?? Sparkles;
                  const selected = answers[question.k] === i;
                  return (
                    <button
                      key={opt.k}
                      type="button"
                      onClick={() => advance({ ...answers, [question.k]: i })}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-start transition-colors ${
                        selected
                          ? "border-[rgba(167,139,250,0.55)] bg-[rgba(124,58,237,0.22)] text-white"
                          : "border-white/10 bg-white/[0.035] text-[rgba(196,181,253,0.85)] hover:border-[rgba(167,139,250,0.4)] hover:bg-white/[0.07] hover:text-white"
                      }`}
                    >
                      <span
                        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          selected
                            ? "bg-[rgba(167,139,250,0.25)] text-[#EDE9FE]"
                            : "bg-white/5 text-[rgba(196,181,253,0.7)]"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-medium leading-snug">
                        {t(`landing.v3.matching.${question.k}.${opt.k}`)}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex items-center justify-between">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => setIndex(Math.max(0, index - 1))}
                  className="inline-flex items-center gap-1.5 text-sm text-[rgba(196,181,253,0.75)] transition-colors hover:text-white disabled:opacity-30"
                >
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                  {t("landing.v3.matching.quiz.back")}
                </button>
                <button
                  type="button"
                  onClick={() => advance({ ...answers, [question.k]: null })}
                  className="text-sm text-[rgba(196,181,253,0.6)] transition-colors hover:text-white"
                >
                  {t("landing.v3.matching.quiz.skip")}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Result card */}
        <div className="cosmic-panel h-full p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sunshine">
            {showResult
              ? t("landing.v3.matching.match.yourLabel")
              : t("landing.v3.matching.match.label")}
          </p>

          {showResult && (
            <>
              <h3 className="font-serif-warm mt-3 text-xl font-semibold text-white sm:text-2xl">
                {t(`landing.v3.matching.persona.${result.persona}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[rgba(221,214,254,0.78)]">
                {t(`landing.v3.matching.persona.${result.persona}.body`)}
              </p>
            </>
          )}

          {savedToProfile && (
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[rgba(167,139,250,0.35)] bg-[rgba(124,58,237,0.18)] px-3 py-1.5 text-xs font-medium text-[#EDE9FE]">
              <Sparkles className="h-3.5 w-3.5" />
              {t("match.savedToProfile")}
            </p>
          )}


          <div className="mt-6 flex flex-col gap-4">
            {TRAITS.map((trait) => {
              const value = showResult ? result.scores[trait] : PREVIEW_SCORES[trait];
              return (
                <div key={trait}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">
                      {t(`landing.v3.matching.trait.${trait}`)}
                    </span>
                    {showResult && (
                      <span className="text-xs font-semibold text-[rgba(196,181,253,0.7)]">
                        {value}%
                      </span>
                    )}
                  </div>
                  <MatchBar fill={value} level={levelFor(value)} animate={!reduced} />
                </div>
              );
            })}
          </div>

          {showResult ? (
            <div className="mt-6">
              {result.answered < result.total && (
                <p className="mb-3 text-xs text-[rgba(196,181,253,0.6)]">
                  {t("landing.v3.matching.match.partial")
                    .replace("{n}", String(result.answered))
                    .replace("{total}", String(result.total))}
                </p>
              )}
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="cosmic-cta inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white"
              >
                {t("landing.v3.matching.match.cta")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <p className="mt-3 text-xs text-[rgba(196,181,253,0.6)]">
                {t("landing.v3.matching.match.saved")}
              </p>
            </div>
          ) : (
            <p className="mt-6 text-xs text-[rgba(196,181,253,0.55)]">
              {t("landing.v3.matching.match.example")}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
