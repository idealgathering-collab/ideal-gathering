import { TrendingUp, Users, Sparkles, Calendar, Check, Clock } from "lucide-react";
import { useT } from "@/i18n";

export function VenueDashboardPreview() {
  const t = useT();
  return (
    <div className="relative rounded-[2rem] border border-border bg-card p-6 shadow-plum">
      <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-cool text-primary-foreground font-display text-lg">
            P
          </div>
          <div>
            <div className="font-display text-lg leading-tight">Petra Roasting Co.</div>
            <div className="text-xs text-muted-foreground">{t("vdp.location")}</div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-sunshine/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide">
          <Sparkles className="h-3 w-3" /> {t("vdp.tier")}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatTile label={t("vdp.utilization")} value="78%" bar={78} icon={TrendingUp} />
        <StatTile label={t("vdp.routed")} value="43" hint={`${t("vdp.new")} · ${t("vdp.thisWeek")}`} icon={Users} />
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-muted/40 p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("vdp.upcoming")}
          </div>
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="mt-3 space-y-2">
          {[
            { slot: "Tue · 14:00", topic: "Books that changed my mind", pending: true },
            { slot: "Wed · 15:30", topic: "Solo travel stories", pending: false },
            { slot: "Thu · 16:00", topic: "Design & craft", pending: false },
          ].map((row) => (
            <div
              key={row.slot}
              className="flex items-center justify-between gap-3 rounded-xl bg-card px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{row.topic}</div>
                <div className="text-[11px] text-muted-foreground">{row.slot}</div>
              </div>
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                  row.pending
                    ? "bg-sunshine/60 text-foreground"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {row.pending ? (
                  <>
                    <Clock className="h-3 w-3" /> {t("vdp.pending")}
                  </>
                ) : (
                  <>
                    <Check className="h-3 w-3" /> {t("vdp.approved")}
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
  bar,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  bar?: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-1 font-display text-2xl leading-none">{value}</div>
      {hint && <div className="mt-0.5 text-[10px] text-muted-foreground">{hint}</div>}
      {typeof bar === "number" && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-gradient-warm"
            style={{ width: `${bar}%` }}
          />
        </div>
      )}
    </div>
  );
}
