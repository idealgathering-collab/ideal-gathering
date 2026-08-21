import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, LogOut, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  myAttendance,
  selfCheck,
  classifyAttendanceError,
  type MyAttendance,
} from "@/lib/attendance.functions";
import { getCurrentPositionOnce, geolocationSupported } from "@/lib/geolocation";
import { useT } from "@/i18n";

/**
 * Attendee-facing check-in / check-out. Location is read one-shot on tap only
 * (never ambient) and is re-verified server-side by the attendance trigger.
 */
export function SelfCheckin({ gatheringId }: { gatheringId: string }) {
  const t = useT();
  const runMine = useServerFn(myAttendance);
  const runCheck = useServerFn(selfCheck);
  const [state, setState] = useState<MyAttendance | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    runMine({ data: { gatheringId } })
      .then((r) => alive && setState(r))
      .catch(() => alive && setState(null));
    return () => {
      alive = false;
    };
  }, [gatheringId, runMine]);

  if (!state || !state.isAttendee) return null;
  if (!state.windowOpen && !state.checked_in_at) return null;

  async function run(action: "in" | "out") {
    if (!geolocationSupported()) {
      toast.error(t("att.self.err.location_required"));
      return;
    }
    setBusy(true);
    try {
      const fix = await getCurrentPositionOnce().catch(() => null);
      if (!fix) {
        toast.error(t("geo.failed"));
        return;
      }
      const res = await runCheck({ data: { gatheringId, action, lat: fix.lat, lng: fix.lng } });
      setState((cur) => (cur ? { ...cur, ...res } : cur));
      toast.success(action === "in" ? t("att.self.inOk") : t("att.self.outOk"));
    } catch (err) {
      const reason = classifyAttendanceError(err instanceof Error ? err.message : String(err));
      toast.error(t(`att.self.err.${reason}`));
    } finally {
      setBusy(false);
    }
  }

  const done = !!state.checked_out_at;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 text-tangerine" /> {t("att.self.title")}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {done ? t("att.self.doneBody") : state.checked_in_at ? t("att.self.inBody") : t("att.self.body")}
      </p>
      {!done && (
        <div className="mt-3 flex flex-wrap gap-2">
          {!state.checked_in_at ? (
            <Button
              className="rounded-full bg-tangerine text-tangerine-foreground hover:bg-tangerine/90"
              disabled={busy || !state.windowOpen}
              onClick={() => run("in")}
            >
              {busy ? <Loader2 className="me-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="me-1.5 h-4 w-4" />}
              {t("att.self.checkIn")}
            </Button>
          ) : (
            <Button variant="outline" className="rounded-full" disabled={busy || !state.windowOpen} onClick={() => run("out")}>
              {busy ? <Loader2 className="me-1.5 h-4 w-4 animate-spin" /> : <LogOut className="me-1.5 h-4 w-4" />}
              {t("att.self.checkOut")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
