import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, CalendarDays, LockKeyhole, MapPin } from "lucide-react";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { MomentEditor } from "@/components/gathering-moment";
import { loadOwnLifeMoments } from "@/lib/life-moments.functions";
import { loadOwnLifeGatherings } from "@/lib/life-profile.functions";

type Moment = Awaited<ReturnType<typeof loadOwnLifeMoments>>[number];
const panel = "min-w-0 rounded-3xl border border-border/60 bg-card p-4 sm:p-6";

/** Mounted only for the signed-in owner's profile. Every query key is account scoped. */
export function LifeProfileActivity({ userId }: { userId: string }) {
  const { t, lang } = useI18n();
  const loadMoments = useServerFn(loadOwnLifeMoments);
  const loadGatherings = useServerFn(loadOwnLifeGatherings);
  const moments = useQuery({
    queryKey: ["life-profile-moments", userId],
    queryFn: () => loadMoments({ data: { limit: 100 } }),
    // Photo links expire after 60 seconds; refresh while this view is active.
    staleTime: 0,
    refetchInterval: 45_000,
  });
  const gatherings = useQuery({
    queryKey: ["life-profile-gatherings", userId],
    queryFn: () => loadGatherings({ data: {} }),
    staleTime: 0,
    refetchInterval: 60_000,
  });
  const date = (value: string) =>
    new Date(value).toLocaleDateString(lang, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  // These are live authorized place labels, never inferred from a saved location
  // or copied into a historical moment. No coordinates or participants are loaded.
  const places = [...new Set((gatherings.data ?? []).map((g) => g.place?.trim()).filter(Boolean))];
  return (
    <div className="space-y-6">
      <section className={panel} aria-labelledby="life-summary">
        <h2 id="life-summary" className="font-display text-xl">
          {t("life.summary")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("life.snapshot")}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3">
          {[
            { label: t("life.moments"), value: moments.data?.length, unavailable: moments.isError },
            {
              label: t("life.completed"),
              value: gatherings.data?.length,
              unavailable: gatherings.isError,
            },
          ].map(({ label, value, unavailable }) => (
            <div key={label} className="rounded-2xl bg-muted/40 p-4">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-3xl font-semibold">{unavailable ? "—" : (value ?? "…")}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">{t("life.bounds")}</p>
      </section>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className={panel} aria-labelledby="life-moments">
          <h2 id="life-moments" className="flex items-center gap-2 font-display text-xl">
            <BookOpen className="h-5 w-5" />
            {t("life.moments")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("life.onlyYou")}</p>
          {moments.isPending && (
            <p className="mt-4" role="status">
              {t("profile.loading")}
            </p>
          )}
          {moments.isError && <Retry onRetry={() => void moments.refetch()} />}
          {!moments.isPending && !moments.isError && moments.data?.length === 0 && (
            <div className="mt-4 rounded-2xl bg-muted/30 p-5">
              <p>{t("life.emptyMoments")}</p>
              <p className="mt-2 text-sm text-muted-foreground">{t("life.startMoment")}</p>
              <Button asChild variant="outline" className="mt-4 min-h-11">
                <Link to="/my-gatherings">{t("life.myGatherings")}</Link>
              </Button>
            </div>
          )}
          <ol className="mt-5 space-y-5">
            {moments.data?.map((moment) => (
              <li key={moment.id} className="min-w-0 border-s-2 border-primary/25 ps-4">
                <article className="min-w-0 space-y-3">
                  <div>
                    <time dateTime={moment.happened_at} className="text-xs text-muted-foreground">
                      {date(moment.happened_at)}
                    </time>
                    <h3 className="break-words font-display text-lg">{moment.title}</h3>
                  </div>
                  <MomentPhoto key={moment.photoUrl ?? moment.id} moment={moment} />
                  {moment.note && (
                    <p className="whitespace-pre-wrap break-words text-sm">{moment.note}</p>
                  )}
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <LockKeyhole className="h-3.5 w-3.5" />
                    {t(moment.visibility === "profile" ? "moment.profile" : "moment.private")}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("moment.notePrivate")}</p>
                  <TimelineEditor moment={moment} userId={userId} />
                </article>
              </li>
            ))}
          </ol>
        </section>
        <div className="min-w-0 space-y-6">
          <section className={panel} aria-labelledby="life-gatherings">
            <h2 id="life-gatherings" className="flex items-center gap-2 font-display text-xl">
              <CalendarDays className="h-5 w-5" />
              {t("life.gatherings")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("life.gatheringsHint")}</p>
            {gatherings.isPending && (
              <p className="mt-4" role="status">
                {t("profile.loading")}
              </p>
            )}
            {gatherings.isError && <Retry onRetry={() => void gatherings.refetch()} />}
            {!gatherings.isPending && !gatherings.isError && gatherings.data?.length === 0 && (
              <p className="mt-4 text-sm">{t("life.emptyGatherings")}</p>
            )}
            <ul className="mt-4 space-y-3">
              {gatherings.data?.map((g) => (
                <li key={g.id}>
                  <Link
                    to="/gatherings/$id"
                    params={{ id: g.id }}
                    className="block min-h-11 rounded-xl border border-border/60 p-3 hover:bg-muted/40 focus-visible:outline focus-visible:outline-ring"
                  >
                    <span className="block break-words font-medium">{g.title}</span>
                    <time dateTime={g.happened_at} className="text-xs text-muted-foreground">
                      {date(g.happened_at)}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="mt-4 min-h-11 w-full whitespace-normal">
              <Link to="/my-gatherings">{t("life.myGatherings")}</Link>
            </Button>
          </section>
          <section className={panel} aria-labelledby="life-places">
            <h2 id="life-places" className="flex items-center gap-2 font-display text-xl">
              <MapPin className="h-5 w-5" />
              {t("life.places")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("life.placesHint")}</p>
            {gatherings.isPending ? (
              <p className="mt-4" role="status">
                {t("profile.loading")}
              </p>
            ) : gatherings.isError ? (
              <p className="mt-4 text-sm" role="status">
                {t("life.loadError")}
              </p>
            ) : places.length ? (
              <ul className="mt-4 space-y-3">
                {places.map((place) => (
                  <li className="break-words text-sm" key={place}>
                    {place}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm">{t("life.emptyPlaces")}</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Retry({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <div className="mt-4" role="status">
      <p>{t("life.loadError")}</p>
      <Button variant="outline" className="mt-2 min-h-11" onClick={onRetry}>
        {t("common.tryAgain")}
      </Button>
    </div>
  );
}

function MomentPhoto({ moment }: { moment: Moment }) {
  const { t } = useI18n();
  const [failed, setFailed] = useState(false);
  if (!moment.photo_path) return null;
  if (!moment.photoUrl || failed)
    return <p className="text-xs text-muted-foreground">{t("life.photoUnavailable")}</p>;
  return (
    <img
      src={moment.photoUrl}
      alt={moment.title}
      loading="lazy"
      className="max-h-80 w-full rounded-2xl object-contain"
      onError={() => setFailed(true)}
    />
  );
}

function TimelineEditor({ moment, userId }: { moment: Moment; userId: string }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!busy) setOpen(value);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-11 rounded-full">
          {t("moment.edit")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl sm:rounded-2xl">
        {open && (
          <MomentEditor
            gatheringId={moment.gathering_id}
            loaded={{ prefill: null, moment }}
            onBusy={setBusy}
            onClose={() => setOpen(false)}
            onSaved={() => {
              void qc.invalidateQueries({ queryKey: ["life-profile-moments", userId] });
              if (moment.gathering_id)
                void qc.invalidateQueries({
                  queryKey: ["gathering-moment", userId, moment.gathering_id],
                });
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
