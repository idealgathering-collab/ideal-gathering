import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useT } from "@/i18n";
import { loadQuiz, scoreQuiz } from "@/lib/matching";

/** Shown on signup when the visitor completed the landing-page matching quiz. */
export function QuizSavedNote() {
  const t = useT();
  const [persona, setPersona] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadQuiz();
    if (!stored?.done) return;
    setPersona(scoreQuiz(stored.answers).persona);
  }, []);

  if (!persona) return null;

  return (
    <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-primary/25 bg-primary/10 p-3.5 text-sm text-foreground">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <p className="leading-relaxed">
        {t("auth.quizSaved").replace(
          "{persona}",
          t(`landing.v3.matching.persona.${persona}.title`),
        )}
      </p>
    </div>
  );
}
