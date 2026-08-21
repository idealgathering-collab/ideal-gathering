import { useState } from "react";
import { Crosshair, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDeviceLocation, type GeoFix } from "@/lib/geolocation";
import { useT } from "@/i18n";

export function UseMyLocationButton({
  onFix,
  className,
}: {
  onFix: (fix: GeoFix) => void | Promise<void>;
  className?: string;
}) {
  const t = useT();
  const { request, supported } = useDeviceLocation();
  const [busy, setBusy] = useState(false);

  if (!supported) return null;

  async function handle() {
    setBusy(true);
    try {
      const fix = await request();
      if (!fix) {
        toast.error(t("geo.failed"));
        return;
      }
      await onFix(fix);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={`h-10 shrink-0 rounded-full ${className ?? ""}`}
      disabled={busy}
      onClick={handle}
    >
      {busy ? (
        <Loader2 className="me-1.5 h-4 w-4 animate-spin" />
      ) : (
        <Crosshair className="me-1.5 h-4 w-4" />
      )}
      {busy ? t("geo.locating") : t("geo.useMyLocation")}
    </Button>
  );
}
