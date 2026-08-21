import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Star, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { listPendingFeedback, submitRatings, type PendingFeedback } from "@/lib/feedback.functions";
import { getTableFit } from "@/lib/matching.functions";
import { fetchApprovedGatherings, formatDateTime, type GatheringCard } from "@/lib/gatherings";
import { TableFitChip } from "@/components/table-fit";
import { useI18n, useT } from "@/i18n";

export function usePendingFeedback(enabled: boolean) {
  const run = useServerFn(listPendingFeedback);
  return useQuery({
    queryKey: ["pending-feedback"],
    enabled,
    queryFn: () => run({ data: undefined as never }),
  });
}

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n}`}>
          <Star
            className={`h-6 w-6 ${n <= value ? "fill-sunshine text-sunshine" : "text-muted-foreground"}`}
          />
        </button>
      ))}
    </div>
  );
}

/** Compact "how was it?" card, used on the dashboard. */
export function FeedbackCard({ item, onOpen }: { item: PendingFeedback; onOpen: () => void }) {
  const t = useT();
  const { lang } = useI18n();
  return (
    <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-primary">
        <Sparkles className="h-3.5 w-3.5" /> {t("fb.eyebrow")}
      </div>
      <h3 className="mt-1 font-display text-xl">{t("fb.cardTitle", { subject: item.subject })}</h3>
      <p className="text-sm text-muted-foreground">{formatDateTime(item.starts_at, lang)}</p>
      <Button className="mt-3 rounded-full" onClick={onOpen}>
        {t("fb.rateCta")}
      </Button>
    </div>
  );
}

export function FeedbackDialog({
  item,
  open,
  onOpenChange,
  onDone,
}: {
  item: PendingFeedback | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
}) {
  const t = useT();
  const { lang } = useI18n();
  const run = useServerFn(submitRatings);
  const runFit = useServerFn(getTableFit);
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [people, setPeople] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ g: GatheringCard; fit: number | null }>>([]);

  async function submit() {
    if (!item || score === 0) return;
    setBusy(true);
    try {
      await run({
        data: {
          gatheringId: item.gathering_id,
          score,
          comment: comment.trim() || undefined,
          people: Object.entries(people).map(([userId, s]) => ({ userId, score: s })),
        },
      });
      setSubmitted(true);
      onDone();
      // Re-match: score upcoming tables in the same city with the existing fit engine.
      try {
        const upcoming = (await fetchApprovedGatherings(item.city)).slice(0, 12);
        if (upcoming.length > 0) {
          const fits = await runFit({ data: { gatheringIds: upcoming.map((g) => g.id) } });
          const byId = new Map(fits.fits.map((f) => [f.gatheringId, f]));
          setSuggestions(
            upcoming
              .map((g) => ({ g, fit: byId.get(g.id)?.fit ?? null }))
              .sort((a, b) => (b.fit ?? -1) - (a.fit ?? -1))
              .slice(0, 2),
          );
        }
      } catch {
        /* suggestions are a bonus; never block the thank-you */
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("fb.err"));
    } finally {
      setBusy(false);
    }
  }

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {submitted ? t("fb.thanksTitle") : t("fb.cardTitle", { subject: item.subject })}
          </DialogTitle>
        </DialogHeader>

        {!submitted ? (
          <div className="grid gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("fb.gatheringScore")}</p>
              <div className="mt-1">
                <Stars value={score} onChange={setScore} />
              </div>
            </div>

            {item.people.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">{t("fb.peopleScore")}</p>
                <ul className="mt-2 grid gap-2">
                  {item.people.map((p) => (
                    <li key={p.user_id} className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-sm">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                        ) : (
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs">
                            {(p.display_name ?? "?").slice(0, 1).toUpperCase()}
                          </span>
                        )}
                        {p.display_name ?? t("room.chat.someone")}
                      </span>
                      <Stars
                        value={people[p.user_id] ?? 0}
                        onChange={(v) => setPeople((cur) => ({ ...cur, [p.user_id]: v }))}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("fb.commentPlaceholder")}
              rows={3}
            />

            <div className="flex justify-end gap-2">
              <Button variant="ghost" className="rounded-full" onClick={() => onOpenChange(false)}>
                {t("fb.later")}
              </Button>
              <Button className="rounded-full" disabled={busy || score === 0} onClick={submit}>
                {busy && <Loader2 className="me-1.5 h-4 w-4 animate-spin" />}
                {t("fb.submit")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <p className="text-sm text-muted-foreground">{t("fb.thanksBody")}</p>
            {suggestions.length > 0 && (
              <div className="grid gap-2">
                <p className="text-sm font-semibold">{t("fb.rematchTitle")}</p>
                {suggestions.map(({ g, fit }) => (
                  <Link
                    key={g.id}
                    to="/gatherings/$id"
                    params={{ id: g.id }}
                    onClick={() => onOpenChange(false)}
                    className="rounded-2xl border border-border bg-card p-3 transition-colors hover:bg-muted"
                  >
                    <div className="font-display text-lg">{g.subject}</div>
                    <div className="text-xs text-muted-foreground">{formatDateTime(g.starts_at, lang)}</div>
                    <div className="mt-2">
                      <TableFitChip fit={{ gatheringId: g.id, fit, ratedCount: 0 }} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <div className="flex justify-end">
              <Button className="rounded-full" onClick={() => onOpenChange(false)}>
                {t("fb.close")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
