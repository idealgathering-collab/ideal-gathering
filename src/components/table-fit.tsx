import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useT } from "@/i18n";
import type { TableFit } from "@/lib/matching.functions";

/** Informational compatibility chip. Never gates joining. */
export function TableFitChip({ fit }: { fit: TableFit | undefined }) {
  const t = useT();
  if (!fit) return null;
  // Someone at this table is blocked either way — show no compatibility at all.
  if (fit.hasBlocked) return null;
  if (fit.fit === null) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
        <Sparkles className="h-3 w-3" />
        {t("match.beFirst")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
      <Sparkles className="h-3 w-3" />
      {t("match.fit", { n: fit.fit })}
    </span>
  );
}

/** Non-blocking nudge for signed-in users who haven't taken the quiz. */
export function TakeQuizNudge() {
  const t = useT();
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4 text-sm">
      <Sparkles className="h-4 w-4 shrink-0 text-primary" />
      <p className="flex-1 text-muted-foreground">{t("match.takeQuiz")}</p>
      <Link
        to="/onboarding"
        search={{ step: "quiz" }}
        className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground"
      >
        {t("match.takeQuizCta")}
      </Link>
    </div>
  );
}
