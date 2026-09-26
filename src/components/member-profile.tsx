import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useI18n } from "@/i18n";
import { loadPublicProfile } from "@/lib/public-profile.functions";
import { loadVisibleLifeMoments } from "@/lib/life-moments.functions";
import { blockUser } from "@/lib/moderation.functions";
import { Button } from "@/components/ui/button";
import { Style } from "@/components/profile/style";
import { ReportDialog } from "@/components/report-dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

const panel = "min-w-0 rounded-3xl border border-border/60 bg-card p-4 sm:p-6";

export function MemberProfile({ viewerId, userId }: { viewerId: string; userId: string }) {
  const { t, lang } = useI18n();
  const client = useQueryClient();
  const loadProfile = useServerFn(loadPublicProfile);
  const loadMoments = useServerFn(loadVisibleLifeMoments);
  const block = useServerFn(blockUser);
  const [blocked, setBlocked] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [report, setReport] = useState(false);
  const [busy, setBusy] = useState(false);
  const [blockError, setBlockError] = useState(false);
  const unavailableRef = useRef<HTMLHeadingElement>(null);
  const reportButton = useRef<HTMLButtonElement>(null);
  const blockButton = useRef<HTMLButtonElement>(null);
  const key = ["member-profile", viewerId, userId];
  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const profile = await loadProfile({ data: { userId } });
      if (!profile) return null;
      const moments = await loadMoments({ data: { userId, limit: 12 } });
      // Recheck access after media work so an intervening block fails closed.
      if (!(await loadProfile({ data: { userId } }))) return null;
      return { profile, moments };
    },
    enabled: !blocked,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchInterval: 45_000,
  });
  async function confirmBlock() {
    setBusy(true);
    setBlockError(false);
    try {
      await block({ data: { userId } });
      setBlocked(true);
      setConfirm(false);
      setReport(false);
      await client.cancelQueries({ queryKey: key });
      client.removeQueries({ queryKey: key });
      requestAnimationFrame(() => unavailableRef.current?.focus());
    } catch {
      setBlockError(true);
    } finally {
      setBusy(false);
    }
  }
  if (!blocked && query.isPending)
    return (
      <section className={panel} role="status" aria-busy="true">
        {t("profile.loading")}
      </section>
    );
  // Never show stale cached identity/activity after a failed authorization refresh.
  if (blocked || query.isError || !query.data)
    return (
      <section className={panel}>
        <h1 ref={unavailableRef} tabIndex={-1} className="font-display text-2xl">
          {t("member.unavailable")}
        </h1>
        {!blocked && (
          <Button variant="outline" className="mt-4 min-h-11" onClick={() => void query.refetch()}>
            {t("common.tryAgain")}
          </Button>
        )}
      </section>
    );
  const { profile, moments } = query.data;
  const name = profile.display_name?.trim() || t("member.title");
  return (
    <div className="space-y-6">
      <section className={panel}>
        <p className="mb-4 text-sm text-muted-foreground">{t("member.title")}</p>
        <div className="flex min-w-0 items-center gap-4">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="h-20 w-20 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl"
            >
              {name.slice(0, 1)}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="break-words font-display text-2xl sm:text-3xl">{name}</h1>
            {profile.city && (
              <p className="mt-1 break-words text-muted-foreground">{profile.city}</p>
            )}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            ref={reportButton}
            variant="outline"
            className="min-h-11"
            onClick={() => setReport(true)}
          >
            {t("mod.report")}
          </Button>
          <Button
            ref={blockButton}
            variant="outline"
            className="min-h-11"
            onClick={() => setConfirm(true)}
          >
            {t("mod.block")}
          </Button>
        </div>
      </section>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <section className={panel} aria-labelledby="member-interests">
            <h2 id="member-interests" className="font-display text-xl">
              {t("member.interests")}
            </h2>
            {profile.interests.length ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {profile.interests.map((value, i) => (
                  <li
                    key={i}
                    className="max-w-full break-words rounded-full bg-muted px-3 py-2 text-sm"
                  >
                    {value}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-muted-foreground">{t("member.emptyInterests")}</p>
            )}
            <div className="mt-4">
              <Style
                compact
                style={{
                  energyLevel: profile.energy_level,
                  groupSize: profile.group_size,
                  talkStyle: profile.talk_style,
                  newPeople: profile.new_people_pref,
                }}
              />
            </div>
          </section>
          <section className={panel} aria-labelledby="member-moments">
            <h2 id="member-moments" className="font-display text-xl">
              {t("member.moments")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("member.momentsHint")}</p>
            {!moments.length && (
              <p className="mt-5 rounded-2xl bg-muted/30 p-5">{t("member.empty")}</p>
            )}
            <ol className="mt-5 space-y-5">
              {moments.map((moment) => (
                <li key={moment.id} className="min-w-0 border-s-2 border-primary/25 ps-4">
                  <article>
                    <time dateTime={moment.happened_at} className="text-xs text-muted-foreground">
                      {new Date(moment.happened_at).toLocaleDateString(lang, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                    <h3 className="mt-1 break-words font-medium">{moment.title}</h3>
                    {moment.photoUrl && (
                      <img
                        src={moment.photoUrl}
                        alt={t("member.photo")}
                        loading="lazy"
                        className="mt-3 max-h-96 w-full rounded-2xl object-cover"
                      />
                    )}
                  </article>
                </li>
              ))}
            </ol>
          </section>
        </div>
        <div className="min-w-0 space-y-6">
          <section className={panel}>
            <h2 className="font-display text-xl">{t("member.context")}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{t("member.connection")}</p>
          </section>
          <section className={panel}>
            <h2 className="font-display text-xl">{t("member.about")}</h2>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm">
              {profile.bio || t("member.emptyAbout")}
            </p>
          </section>
        </div>
      </div>
      <ReportDialog
        returnFocusRef={reportButton}
        target={
          report
            ? { targetType: "user", targetId: userId, targetUserId: userId, label: name }
            : null
        }
        onOpenChange={setReport}
      />
      <AlertDialog open={confirm} onOpenChange={(open) => !busy && setConfirm(open)}>
        <AlertDialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            (blocked ? unavailableRef.current : blockButton.current)?.focus();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{t("mod.block.confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("mod.block.confirmBody", { name })}</AlertDialogDescription>
          </AlertDialogHeader>
          {blockError && <p role="alert">{t("auth.generic")}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(event) => {
                event.preventDefault();
                void confirmBlock();
              }}
            >
              {t("mod.block")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
