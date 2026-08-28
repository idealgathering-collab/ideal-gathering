import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { useT } from "@/i18n";
import { saveMyTraits } from "@/lib/profile-traits";
import { type QuizResult } from "@/lib/matching";
import { OnboardingQuiz, OnboardingQuizResult } from "@/components/onboarding/quiz-steps";
import { GatheringPreferencesFlow } from "@/components/onboarding/preference-steps";
import {
  hasAnyAnswer,
  loadMyGatheringPreferences,
  saveMyGatheringPreferences,
  type GatheringPreferences,
} from "@/lib/gathering-preferences";
import { supabase } from "@/integrations/supabase/client";

const SEARCH = z.object({
  step: z.enum(["welcome", "how", "prefs-intro", "prefs", "qintro", "quiz", "quiz-result"]).optional(),
});

export const Route = createFileRoute("/_authenticated/onboarding")({
  validateSearch: SEARCH,
  component: Onboarding,
});

type Step = z.infer<typeof SEARCH>["step"];

function Onboarding() {
  const navigate = useNavigate();
  const { user } = useSession();
  const search = Route.useSearch();
  const [step, setStep] = useState<Step>(search.step ?? "welcome");
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [prefs, setPrefs] = useState<GatheringPreferences | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStep(search.step ?? "welcome");
  }, [search.step]);

  // Load previously saved answers so returning users can edit them.
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    loadMyGatheringPreferences(user.id)
      .then((p) => {
        if (mounted && p) setPrefs(p);
      })
      .catch(() => {
        // non-blocking: onboarding still works without prior answers
      });
    return () => {
      mounted = false;
    };
  }, [user]);

  function go(next: Step) {
    setStep(next);
    void navigate({ to: "/onboarding", search: { step: next }, replace: true });
  }

  async function finish(tookQuiz: boolean) {
    if (!user) return;
    if (saving) return;
    setSaving(true);
    try {
      if (tookQuiz && quizResult) {
        try {
          await saveMyTraits(user.id, quizResult.scores);
        } catch {
          // non-blocking: onboarding still completes without the profile write
        }
      }
      if (prefs && hasAnyAnswer(prefs)) {
        try {
          await saveMyGatheringPreferences(user.id, prefs);
        } catch {
          // non-blocking
        }
      }
      // This write is the only thing that stops /dashboard bouncing back here.
      // If it fails silently we must NOT navigate, or the user is trapped in a loop.
      const { data: marked, error: markError } = await supabase
        .from("profiles")
        .update({ onboarded_at: new Date().toISOString() })
        .eq("id", user.id)
        .select("id")
        .maybeSingle();
      if (markError || !marked) {
        toast.error(t("common.somethingWrong"));
        return;
      }
      await navigate({ to: "/dashboard", replace: true });
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

        <div className="rounded-3xl border border-border bg-card p-6 sm:p-10">
          {step === "welcome" && (
            <WelcomeStep name={user?.user_metadata?.display_name ?? ""} onNext={() => go("how")} />
          )}
          {step === "how" && (
            <HowItWorksStep onNext={() => go("prefs-intro")} onBack={() => go("welcome")} />
          )}
          {step === "prefs-intro" && (
            <PrefsIntroStep onStart={() => go("prefs")} onBack={() => go("how")} onSkip={() => go("qintro")} />
          )}
          {step === "prefs" && (
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
        </div>
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
      <h1 className="font-display text-center text-3xl sm:text-4xl">
        {t("onboarding.how.title")}
      </h1>
      <div className="mt-6 flex flex-col gap-3">
        {rows.map((k) => (
          <div key={k} className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-4">
            <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
            <div>
              <p className="font-display text-base">{t(`onboarding.how.${k}.title`)}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{t(`onboarding.how.${k}.body`)}</p>
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
      <h1 className="font-display mt-4 text-3xl sm:text-4xl">{t("onboarding.prefs.intro.title")}</h1>
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
