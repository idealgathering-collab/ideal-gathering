import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/i18n";
import { REPORT_REASONS, submitReport } from "@/lib/moderation.functions";

export type ReportTarget = {
  targetType: "user" | "gathering";
  targetId: string;
  targetUserId?: string | null;
  gatheringId?: string | null;
  label?: string | null;
};

export function ReportDialog({
  target,
  onOpenChange,
}: {
  target: ReportTarget | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const [reason, setReason] = useState<(typeof REPORT_REASONS)[number]>("harassment");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!target) return;
    try {
      setBusy(true);
      await submitReport({
        data: {
          targetType: target.targetType,
          targetId: target.targetId,
          targetUserId: target.targetUserId ?? null,
          gatheringId: target.gatheringId ?? null,
          reason,
          details: details.trim() || null,
        },
      });
      toast.success(t("mod.report.sent"));
      setDetails("");
      setReason("harassment");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.generic"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("mod.report.title")}</DialogTitle>
          <DialogDescription>
            {target?.label ? `${t("mod.report.about")}: ${target.label}` : t("mod.report.body")}
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={reason} onValueChange={(v) => setReason(v as typeof reason)} className="gap-2">
          {REPORT_REASONS.map((r) => (
            <div key={r} className="flex items-center gap-2">
              <RadioGroupItem value={r} id={`reason-${r}`} />
              <Label htmlFor={`reason-${r}`} className="font-normal">
                {t(`mod.reason.${r}` as never)}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <div className="grid gap-2">
          <Label htmlFor="report-details">{t("mod.report.details")}</Label>
          <Textarea
            id="report-details"
            value={details}
            maxLength={500}
            rows={4}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={t("mod.report.detailsPlaceholder")}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button className="rounded-full" disabled={busy} onClick={send}>
            {busy ? "…" : t("mod.report.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
