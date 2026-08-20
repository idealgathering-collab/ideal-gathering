import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Circle } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import {
  listAttendance,
  setAttendance,
  classifyAttendanceError,
  type AttendanceRoster as Roster,
} from "@/lib/attendance.functions";
import { useT } from "@/i18n";

export function AttendanceRoster({ gatheringId }: { gatheringId: string }) {
  const t = useT();
  const runList = useServerFn(listAttendance);
  const runSet = useServerFn(setAttendance);
  const [roster, setRoster] = useState<Roster | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    runList({ data: { gatheringId } })
      .then((r) => alive && setRoster(r))
      .catch(() => alive && setRoster(null));
    return () => {
      alive = false;
    };
  }, [gatheringId, runList]);

  if (!roster) return null;

  const total = roster.attendees.length;
  const done = roster.attendees.filter((a) => a.checked_in_at).length;

  async function toggle(userId: string, present: boolean) {
    if (!roster?.canMark) return;
    const prev = roster;
    setBusy(userId);
    setRoster({
      ...roster,
      attendees: roster.attendees.map((a) =>
        a.user_id === userId ? { ...a, checked_in_at: present ? new Date().toISOString() : null } : a,
      ),
    });
    try {
      const res = await runSet({ data: { gatheringId, userId, present } });
      setRoster((cur) =>
        cur
          ? {
              ...cur,
              attendees: cur.attendees.map((a) =>
                a.user_id === userId ? { ...a, checked_in_at: res.checked_in_at } : a,
              ),
            }
          : cur,
      );
    } catch (err) {
      setRoster(prev);
      const reason = classifyAttendanceError(err instanceof Error ? err.message : String(err));
      toast.error(t(`att.err.${reason}`));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg">{t("att.title")}</h3>
        <span className="text-sm text-muted-foreground">{t("att.count", { done, total })}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {roster.canMark ? t("att.body") : roster.windowOpen ? t("att.closed") : t("att.notOpen")}
      </p>

      {total === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("att.empty")}</p>
      ) : (
        <ul className="mt-4 grid gap-1">
          {roster.attendees.map((a) => {
            const present = !!a.checked_in_at;
            return (
              <li key={a.user_id}>
                <button
                  type="button"
                  disabled={!roster.canMark || busy === a.user_id}
                  onClick={() => toggle(a.user_id, !present)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-start transition-colors hover:bg-muted disabled:cursor-default disabled:hover:bg-transparent"
                >
                  {present ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                  )}
                  {a.avatar_url ? (
                    <img src={a.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs">
                      {(a.display_name ?? "?").slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className={present ? "" : "text-muted-foreground"}>
                    {a.display_name ?? t("room.chat.someone")}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
