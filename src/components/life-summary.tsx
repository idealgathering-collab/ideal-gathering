import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { loadOwnLifeSummary } from "@/lib/life-summary.functions";

export function LifeSummarySection({ userId }: { userId: string }) {
  const { t, lang } = useI18n();
  const load = useServerFn(loadOwnLifeSummary);
  const query = useQuery({
    queryKey: ["life-summary", userId],
    queryFn: () => load({ data: {} }),
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchInterval: 60_000,
  });
  const date = (value: string) =>
    new Date(value).toLocaleDateString(lang, { month: "short", day: "numeric" });
  const data = query.data;
  return (
    <section
      className="min-w-0 rounded-3xl border border-border/60 bg-card p-4 sm:p-6"
      aria-labelledby="life-summary"
    >
      <h2 id="life-summary" className="font-display text-xl">
        {t("summary.title")}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("summary.period")}</p>
      {query.isPending ? (
        <p role="status" className="mt-4">
          {t("profile.loading")}
        </p>
      ) : query.isError || !data ? (
        <div role="alert" className="mt-4">
          <p>{t("life.loadError")}</p>
          <Button variant="outline" className="mt-3 min-h-11" onClick={() => void query.refetch()}>
            {t("common.tryAgain")}
          </Button>
        </div>
      ) : (
        <>
          {data.gatherings === 0 && data.moments === 0 ? (
            <div className="mt-4 rounded-2xl bg-muted/30 p-4">
              <p>{t("summary.empty")}</p>
              <Button variant="outline" asChild className="mt-3 min-h-11">
                <Link to="/my-gatherings">{t("life.myGatherings")}</Link>
              </Button>
            </div>
          ) : (
            <>
              <dl className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { label: t("life.completed"), value: data.gatherings },
                  { label: t("summary.saved"), value: data.moments },
                ].map(({ label, value }) => (
                  <div key={label} className="min-w-0 rounded-2xl bg-muted/40 p-4">
                    <dt className="text-sm text-muted-foreground">{label}</dt>
                    <dd className="mt-1 text-3xl font-semibold">{value.toLocaleString(lang)}</dd>
                  </div>
                ))}
              </dl>
              {data.categories.length > 0 && (
                <div className="mt-5">
                  <h3 className="font-medium">{t("summary.activities")}</h3>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {data.categories.map((item) => (
                      <li
                        key={item.category}
                        className="max-w-full break-words rounded-full bg-muted/40 px-3 py-2 text-sm"
                      >
                        {t(
                          item.category === "other"
                            ? "summary.other"
                            : `gatheringType.${item.category}`,
                        )}{" "}
                        · {item.count.toLocaleString(lang)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data.gatherings > 0 && (
                <div className="mt-5">
                  <h3 className="font-medium">{t("summary.recent")}</h3>
                  <ol className="mt-3 grid gap-2 sm:grid-cols-3">
                    {data.periods.map((period) => (
                      <li key={period.start} className="rounded-2xl border border-border/60 p-3">
                        <p className="text-xs text-muted-foreground">
                          <time dateTime={period.start}>{date(period.start)}</time> –{" "}
                          <time dateTime={period.end}>{date(period.end)}</time>
                        </p>
                        <p className="mt-1 text-sm">
                          {t("summary.count", { count: period.gatherings.toLocaleString(lang) })}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}
          <details className="mt-4 text-sm text-muted-foreground">
            <summary className="min-h-11 cursor-pointer py-3">{t("summary.method")}</summary>
            <p>{t("summary.explain")}</p>
            <p className="mt-2">{t("summary.omitted")}</p>
            <p className="mt-2">
              <time dateTime={data.period_start}>
                {new Date(data.period_start).toLocaleString(lang)}
              </time>{" "}
              –{" "}
              <time dateTime={data.period_end}>
                {new Date(data.period_end).toLocaleString(lang)}
              </time>
            </p>
          </details>
        </>
      )}
    </section>
  );
}
