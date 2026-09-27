import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { loadVenueDashboard } from "@/lib/venue-dashboard.functions";
import type { VenueDashboardData, VenueGathering } from "@/lib/venue-dashboard";

const panel = "min-w-0 rounded-3xl border border-border/60 bg-card p-4 sm:p-6";
const sections = ["overview", "gatherings", "visitors", "profile", "tables", "menu"] as const;
type Section = (typeof sections)[number];

export function VenueValueDashboard({
  userId,
  businessId,
  preview,
  profile,
  tables,
  menu,
}: {
  userId: string;
  businessId: string;
  preview: boolean;
  profile: ReactNode;
  tables: ReactNode;
  menu: ReactNode;
}) {
  const { t } = useI18n();
  const [section, setSection] = useState<Section>("overview");
  const [upcomingPage, setUpcomingPage] = useState(0);
  const [completedPage, setCompletedPage] = useState(0);
  const load = useServerFn(loadVenueDashboard);
  const query = useQuery({
    queryKey: ["venue-value", userId, businessId, preview, upcomingPage, completedPage],
    queryFn: () => load({ data: { businessId, upcomingPage, completedPage } }),
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchInterval: 60_000,
  });
  if (query.isPending)
    return (
      <p role="status" className={panel}>
        {t("common.loading")}
      </p>
    );
  // Gate every management section on a current server-authorized result.
  if (query.isError || !query.data)
    return (
      <div role="alert" className={panel}>
        <p>{t("vv.error")}</p>
        <Button className="mt-4 min-h-11" variant="outline" onClick={() => void query.refetch()}>
          {t("common.tryAgain")}
        </Button>
      </div>
    );
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[12rem_minmax(0,1fr)]">
      <nav
        aria-label={t("vv.nav")}
        className="grid grid-cols-3 gap-2 lg:sticky lg:top-24 lg:grid-cols-1"
      >
        {sections.map((item) => (
          <Button
            key={item}
            variant={section === item ? "default" : "outline"}
            aria-current={section === item ? "page" : undefined}
            className="h-auto min-h-11 whitespace-normal break-words px-2 py-3"
            onClick={() => {
              if (item === "overview") {
                setUpcomingPage(0);
                setCompletedPage(0);
              }
              setSection(item);
            }}
          >
            {t("vv." + item)}
          </Button>
        ))}
      </nav>
      <div className="min-w-0 space-y-5">
        {section === "profile" ? (
          profile
        ) : section === "tables" ? (
          tables
        ) : section === "menu" ? (
          menu
        ) : (
          <VenueValueContent
            data={query.data}
            section={section}
            upcomingPage={upcomingPage}
            completedPage={completedPage}
            setUpcomingPage={setUpcomingPage}
            setCompletedPage={setCompletedPage}
          />
        )}
      </div>
    </div>
  );
}

export function VenueValueContent({
  data,
  section,
  upcomingPage = 0,
  completedPage = 0,
  setUpcomingPage = () => {},
  setCompletedPage = () => {},
}: {
  data: VenueDashboardData;
  section: "overview" | "gatherings" | "visitors";
  upcomingPage?: number;
  completedPage?: number;
  setUpcomingPage?: (page: number) => void;
  setCompletedPage?: (page: number) => void;
}) {
  const { t, lang } = useI18n();
  const n = (value: number) => value.toLocaleString(lang, { maximumFractionDigits: 2 });
  const stats = [
    ["vv.completed", data.completed_count],
    ["vv.visits", data.visits],
    ["vv.unique", data.unique_visitors],
    ...(section === "visitors"
      ? [
          ["vv.new", data.new_visitors],
          ["vv.returning", data.returning_visitors],
          ["vv.average", data.average_attendance],
        ]
      : []),
  ] as Array<[string, number | null]>;
  return (
    <>
      {section !== "visitors" && (
        <section className={panel}>
          <h2 className="font-display text-xl">
            {t("vv.upcoming")} · {n(data.upcoming_count)}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("vv.horizon")}</p>
          <GatheringList
            rows={section === "overview" ? data.upcoming.slice(0, 4) : data.upcoming}
            empty="vv.emptyUpcoming"
          />
          {section === "gatherings" && (
            <Pages page={upcomingPage} total={data.upcoming_count} change={setUpcomingPage} />
          )}
        </section>
      )}
      {section !== "gatherings" && (
        <section className={panel}>
          <h2 className="font-display text-xl">{t("vv.what")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("vv.period")}</p>
          {data.visits === 0 && data.completed_count === 0 ? (
            <p className="mt-4 rounded-2xl bg-muted/40 p-4">{t("vv.emptyVisitors")}</p>
          ) : (
            <dl className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-3">
              {stats.map(([label, value]) => (
                <div key={label} className="min-w-0 rounded-2xl bg-muted/40 p-4">
                  <dt className="text-sm text-muted-foreground">{t(label)}</dt>
                  <dd className="mt-2 text-3xl font-semibold">{value === null ? "—" : n(value)}</dd>
                </div>
              ))}
            </dl>
          )}
          {section === "visitors" && (
            <>
              <h3 className="mt-6 font-medium">{t("vv.trend")}</h3>
              <ol className="mt-3 grid gap-3 sm:grid-cols-3">
                {data.periods.map((p) => (
                  <li key={p.start} className="rounded-2xl border border-border p-3">
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.start).toLocaleDateString(lang)} –{" "}
                      {new Date(p.end).toLocaleDateString(lang)}
                    </p>
                    <p className="mt-2">{t("vv.count", { count: n(p.visits) })}</p>
                  </li>
                ))}
              </ol>
              <h3 className="mt-6 font-medium">{t("vv.patterns")}</h3>
              {data.categories ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {data.categories.map((c) => (
                    <li key={c.category} className="rounded-full bg-muted/40 px-3 py-2 text-sm">
                      {t(c.category === "other" ? "vv.other" : "gatheringType." + c.category)} ·{" "}
                      {n(c.count)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">{t("vv.insufficient")}</p>
              )}
            </>
          )}
          <details className="mt-4 text-sm text-muted-foreground">
            <summary className="min-h-11 cursor-pointer py-3">{t("vv.method")}</summary>
            <p>{t("vv.explain")}</p>
            <p className="mt-3">{t("vv.explainMore")}</p>
            <p className="mt-3">
              {new Date(data.period_start).toLocaleString(lang)} –{" "}
              {new Date(data.period_end).toLocaleString(lang)}
            </p>
          </details>
        </section>
      )}
      {section !== "visitors" && (
        <section className={panel}>
          <h2 className="font-display text-xl">
            {t(section === "overview" ? "vv.recent" : "vv.completed")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("vv.period")}</p>
          <GatheringList
            rows={section === "overview" ? data.completed.slice(0, 3) : data.completed}
            empty="vv.emptyCompleted"
          />
          {section === "gatherings" && (
            <Pages page={completedPage} total={data.completed_count} change={setCompletedPage} />
          )}
        </section>
      )}
      {section === "overview" && <p className="text-sm text-muted-foreground">{t("vv.manage")}</p>}
    </>
  );
}

function GatheringList({ rows, empty }: { rows: VenueGathering[]; empty: string }) {
  const { t, lang } = useI18n();
  return rows.length === 0 ? (
    <p className="mt-4 text-muted-foreground">{t(empty)}</p>
  ) : (
    <ul className="mt-4 space-y-3">
      {rows.map((g) => (
        <li key={g.id} className="min-w-0 rounded-2xl border border-border p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="min-w-0 break-words font-medium">{g.title}</h3>
            <span className="text-xs text-primary">{t("vv.status." + g.status)}</span>
          </div>
          <p className="mt-1 text-sm">
            <time dateTime={g.starts_at}>{new Date(g.starts_at).toLocaleString(lang)}</time>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t(g.category === "other" ? "vv.other" : "gatheringType." + g.category)}
            {g.venue_hosted && <> · {t("vv.hosted")}</>}
          </p>
          <p className="mt-2 text-sm">
            {g.status === "completed"
              ? t("vv.verified", { count: g.verified.toLocaleString(lang) })
              : t("vv.booked", {
                  count: g.participants.toLocaleString(lang),
                  capacity: g.capacity.toLocaleString(lang),
                })}
          </p>
          <details className="mt-2 text-sm">
            <summary className="min-h-11 cursor-pointer py-3">{t("vv.details")}</summary>
            <p>
              {t("vv.booked", {
                count: g.participants.toLocaleString(lang),
                capacity: g.capacity.toLocaleString(lang),
              })}
            </p>
            <p>{t("vv.verified", { count: g.verified.toLocaleString(lang) })}</p>
            {g.can_open && (
              <Button asChild variant="outline" className="mt-3 min-h-11">
                <Link to="/gatherings/$id" params={{ id: g.id }}>
                  {t("vv.open")}
                </Link>
              </Button>
            )}
          </details>
        </li>
      ))}
    </ul>
  );
}
function Pages({
  page,
  total,
  change,
}: {
  page: number;
  total: number;
  change: (page: number) => void;
}) {
  const { t, lang } = useI18n();
  if (total <= 20 && page === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <Button
        variant="outline"
        className="min-h-11"
        disabled={page === 0}
        onClick={() => change(page - 1)}
      >
        {t("vv.previous")}
      </Button>
      <span className="text-sm">{t("vv.page", { page: (page + 1).toLocaleString(lang) })}</span>
      <Button
        variant="outline"
        className="min-h-11"
        disabled={(page + 1) * 20 >= total || page >= 10000}
        onClick={() => change(page + 1)}
      >
        {t("vv.next")}
      </Button>
    </div>
  );
}
