import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { useT } from "@/i18n";
import { changedFields, completeOnboarding } from "@/lib/profile-data";
import { type QuizResult } from "@/lib/matching";
import { OnboardingQuiz, OnboardingQuizResult } from "@/components/onboarding/quiz-steps";
import { GatheringPreferencesFlow } from "@/components/onboarding/preference-steps";
import {
  EMPTY_PREFERENCES,
  loadMyGatheringPreferences,
  type GatheringPreferences,
} from "@/lib/gathering-preferences";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const SEARCH = z.object({
  step: z
    .enum(["welcome", "how", "prefs-intro", "prefs", "qintro", "quiz", "quiz-result"])
    .optional(),
});

export const Route = createFileRoute("/_authenticated/onboarding")({
  validateSearch: SEARCH,
  head: () => ({
    meta: [
      { title: "Get started — Ideal Gathering" },
      {
        name: "description",
        content: "Set up your profile and tell us what kind of table you're looking for.",
      },
      { property: "og:title", content: "Get started — Ideal Gathering" },
      {
        property: "og:description",
        content: "Set up your profile and tell us what kind of table you're looking for.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Onboarding,
});

type Step = z.infer<typeof SEARCH>["step"];

function Onboarding() {
  const t = useT();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useSession();
  const userId = user?.id;
  const search = Route.useSearch();
  const [step, setStep] = useState<Step>(search.step ?? "welcome");
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [prefs, setPrefs] = useState<GatheringPreferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [prefsReady, setPrefsReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const originalPrefs = useRef<GatheringPreferences>(EMPTY_PREFERENCES);

  useEffect(() => {
    setStep(search.step ?? "welcome");
  }, [search.step]);

  // Load previously saved answers so returning users can edit them.
  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    setPrefsReady(false);
    setLoadError(false);
    loadMyGatheringPreferences(userId)
      .then((p) => {
        if (!mounted) return;
        originalPrefs.current = p ?? EMPTY_PREFERENCES;
        setPrefs(p ?? EMPTY_PREFERENCES);
        setPrefsReady(true);
      })
      .catch(() => {
        if (mounted) setLoadError(true);
      });
    return () => {
      mounted = false;
    };
  }, [userId, loadAttempt]);

  function go(next: Step) {
    setStep(next);
    void navigate({ to: "/onboarding", search: { step: next }, replace: true });
  }

  async function finish(tookQuiz: boolean) {
    if (!user) return;
    if (saving || !prefsReady) return;
    setSaving(true);
    try {
      await completeOnboarding(
        prefs ? changedFields(originalPrefs.current, prefs) : {},
        tookQuiz && quizResult ? quizResult.scores : undefined,
      );
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["profile-card", user.id] }),
        qc.invalidateQueries({ queryKey: ["profile-taste", user.id] }),
        qc.invalidateQueries({ queryKey: ["table-fit", user.id] }),
      ]);
      await navigate({ to: "/dashboard", replace: true });
    } catch {
      toast.error(t("common.somethingWrong"));
    } finally {
      setSaving(false);
    }
  }

  const dot = (s: Step) => {
    const active =
      step === s ||
      (s === "prefs" && (step === "prefs-intro" || step === "prefs")) ||
      (s === "quiz" && (step === "qintro" || step === "quiz" || step === "quiz-result"));
    return active ? "bg-primary" : "bg-muted-foreground/30";
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Progress dots */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <span className={`h-2 w-2 rounded-full ${dot("welcome")}`} />
          <span className={`h-2 w-2 rounded-full ${dot("how")}`} />
          <span className={`h-2 w-2 rounded-full ${dot("prefs")}`} />
          <span className={`h-2 w-2 rounded-full ${dot("quiz")}`} />
        </div>

        {loadError && (
          <Button onClick={() => setLoadAttempt((n) => n + 1)}>{t("common.tryAgain")}</Button>
        )}
        <fieldset
          disabled={!prefsReady || saving}
          aria-busy={!prefsReady || saving}
          className="rounded-3xl border border-border bg-card p-6 sm:p-10"
        >
          {step === "welcome" && (
            <WelcomeStep name={user?.user_metadata?.display_name ?? ""} onNext={() => go("how")} />
          )}
          {step === "how" && (
            <HowItWorksStep onNext={() => go("prefs-intro")} onBack={() => go("welcome")} />
          )}
          {step === "prefs-intro" && (
            <PrefsIntroStep
              onStart={() => go("prefs")}
              onBack={() => go("how")}
              onSkip={() => go("qintro")}
            />
          )}
          {step === "prefs" && prefsReady && (
            <GatheringPreferencesFlow
              initial={prefs}
              onDone={(p) => {
                setPrefs(p);
                go("qintro");
              }}
              onSkip={() => go("qintro")}
            />
          )}
          {step === "qintro" && (
            <QuizIntroStep onStart={() => go("quiz")} onSkip={() => finish(false)} />
          )}
          {step === "quiz" && !quizResult && (
            <OnboardingQuiz
              onDone={(r) => {
                setQuizResult(r);
                go("quiz-result");
              }}
              onSkip={() => finish(false)}
            />
          )}
          {step === "quiz-result" && quizResult && (
            <ResultStep
              result={quizResult}
              saving={saving}
              onFinish={() => finish(true)}
              onSkip={() => finish(false)}
            />
          )}
        </fieldset>
      </div>
    </div>
  );
}

function WelcomeStep({ name, onNext }: { name: string; onNext: () => void }) {
  const t = useT();
  return (
    <div className="text-center">
      <Sparkles className="mx-auto h-10 w-10 text-primary" />
      <h1 className="font-display mt-4 text-3xl sm:text-4xl">
        {t("onboarding.welcome.title").replace("{name}", name)}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {t("onboarding.welcome.body")}
      </p>
      <Button className="mt-8 w-full rounded-full" onClick={onNext}>
        {t("onboarding.continue")}
        <ArrowRight className="ms-1.5 h-4 w-4 rtl:rotate-180" />
      </Button>
    </div>
  );
}

function HowItWorksStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const t = useT();
  const rows = ["find", "seat", "talk"] as const;
  return (
    <div>
      <h1 className="font-display text-center text-3xl sm:text-4xl">{t("onboarding.how.title")}</h1>
      <div className="mt-6 flex flex-col gap-3">
        {rows.map((k) => (
          <div
            key={k}
            className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-4"
          >
            <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
            <div>
              <p className="font-display text-base">{t(`onboarding.how.${k}.title`)}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {t(`onboarding.how.${k}.body`)}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          {t("landing.v3.matching.quiz.back")}
        </Button>
        <Button className="rounded-full" onClick={onNext}>
          {t("onboarding.continue")}
          <ArrowRight className="ms-1.5 h-4 w-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}

function PrefsIntroStep({
  onStart,
  onBack,
  onSkip,
}: {
  onStart: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const t = useT();
  return (
    <div className="text-center">
      <Sparkles className="mx-auto h-10 w-10 text-primary" />
      <h1 className="font-display mt-4 text-3xl sm:text-4xl">
        {t("onboarding.prefs.intro.title")}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {t("onboarding.prefs.intro.body")}
      </p>
      <div className="mt-8 flex flex-col gap-2">
        <Button className="w-full rounded-full" onClick={onStart}>
          {t("onboarding.prefs.intro.start")}
          <ArrowRight className="ms-1.5 h-4 w-4 rtl:rotate-180" />
        </Button>
        <Button variant="ghost" onClick={onSkip}>
          {t("onboarding.skipForNow")}
        </Button>
        <Button variant="ghost" onClick={onBack}>
          {t("landing.v3.matching.quiz.back")}
        </Button>
      </div>
    </div>
  );
}

function ResultStep({
  result,
  saving,
  onFinish,
  onSkip,
}: {
  result: QuizResult;
  saving: boolean;
  onFinish: () => void;
  onSkip: () => void;
}) {
  const t = useT();
  return (
    <div>
      <OnboardingQuizResult result={result} />
      <div className="mt-8 flex flex-col gap-2">
        <Button className="w-full rounded-full" onClick={onFinish} disabled={saving}>
          {t("onboarding.finish")}
          <ArrowRight className="ms-1.5 h-4 w-4 rtl:rotate-180" />
        </Button>
        <Button variant="ghost" onClick={onSkip} disabled={saving}>
          {t("onboarding.skipForNow")}
        </Button>
      </div>
    </div>
  );
}

function QuizIntroStep({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  const t = useT();
  return (
    <div className="text-center">
      <Sparkles className="mx-auto h-10 w-10 text-primary" />
      <h1 className="font-display mt-4 text-3xl sm:text-4xl">{t("onboarding.quiz.intro.title")}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {t("onboarding.quiz.intro.body")}
      </p>
      <div className="mt-8 flex flex-col gap-2">
        <Button className="w-full rounded-full" onClick={onStart}>
          {t("onboarding.quiz.start")}
          <ArrowRight className="ms-1.5 h-4 w-4 rtl:rotate-180" />
        </Button>
        <Button variant="ghost" onClick={onSkip}>
          {t("onboarding.quiz.skip")}
        </Button>
      </div>
    </div>
  );
}
