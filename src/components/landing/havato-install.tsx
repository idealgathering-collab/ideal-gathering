import { useState, useSyncExternalStore } from "react";
import { Download } from "lucide-react";
import { useI18n } from "@/i18n";
import { pwaInstall, type InstallState } from "@/lib/pwa-install";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

const subscribe = (listener: () => void) => pwaInstall?.subscribe(listener) ?? (() => {});
const snapshot = (): InstallState => pwaInstall?.getSnapshot() ?? "hidden";
const serverSnapshot = (): InstallState => "hidden";

export function HavatoInstall() {
  const { lang } = useI18n();
  const state = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [instructions, setInstructions] = useState(false);
  const [failed, setFailed] = useState(false);
  const fa = lang === "fa";
  if (state === "hidden" && !failed) return null;
  return (
    <div className="havato-install">
      {state !== "hidden" && (
        <button type="button" className="havato-install-button" disabled={state === "pending"}
          onClick={() => {
            setFailed(false);
            if (state === "ios") setInstructions(true);
            else void pwaInstall?.prompt().catch(() => setFailed(true));
          }}>
          <Download size={17} aria-hidden="true" />
          {fa ? "نصب هواتو" : "Install Havato"}
        </button>
      )}
      {failed && <p role="status">{fa
        ? "پنجره نصب باز نشد. برای تلاش دوباره صفحه را بازخوانی کن."
        : "The install prompt could not open. Reload the page to try again."}</p>}
      <Dialog open={instructions && state === "ios"} onOpenChange={setInstructions}>
        <DialogContent dir={fa ? "rtl" : "ltr"}>
          <DialogTitle>{fa ? "افزودن هواتو به صفحه اصلی" : "Add Havato to your Home Screen"}</DialogTitle>
          <DialogDescription>{fa
            ? "این صفحه را در Safari باز کن، روی اشتراک‌گذاری بزن و «افزودن به صفحه اصلی» را انتخاب کن، سپس «افزودن» را بزن."
            : "Open this page in Safari, tap Share, choose Add to Home Screen, then tap Add."}</DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
}
