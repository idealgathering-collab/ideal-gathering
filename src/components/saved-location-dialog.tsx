import { useState } from "react";
import { toast } from "sonner";
import { ClientOnly } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LocationMapPicker, type MapLocationValue } from "@/components/location-map-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { YEREVAN_AREAS, areaLabel } from "@/lib/yerevan-areas";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useI18n, useT } from "@/i18n";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: (id: string) => void;
  /** ISO country code to bias Nominatim search. Falls back to AM. */
  countryCode?: string | null;
};

export function SavedLocationDialog({ open, onOpenChange, onSaved, countryCode }: Props) {
  const t = useT();
  const { lang } = useI18n();
  const { user } = useSession();
  const [label, setLabel] = useState("");
  const [picked, setPicked] = useState<MapLocationValue | null>(null);
  const [area, setArea] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function reset() {
    setLabel("");
    setPicked(null);
    setArea(null);
  }

  function handlePicked(v: MapLocationValue | null) {
    setPicked(v);
    // Pre-fill the area from the pin; the host can still change it.
    setArea(v?.area ?? null);
  }

  async function submit() {
    if (!user) return;
    if (!label.trim()) return toast.error(t("savedLoc.labelRequired"));
    if (!picked) return toast.error(t("savedLoc.pickOnMap"));
    if (!picked.street_number.trim()) return toast.error(t("savedLoc.streetRequired"));
    if (!picked.description.trim()) return toast.error(t("savedLoc.descRequired"));
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("saved_locations")
        .insert({
          user_id: user.id,
          label: label.trim(),
          address: picked.address || picked.display_name,
          city: picked.city || null,
          neighborhood: area,
          lat: picked.lat,
          lng: picked.lng,
          street_number: picked.street_number.trim(),
          description: picked.description.trim(),
        } as never)
        .select("id")
        .single();
      if (error) throw error;
      toast.success(t("savedLoc.submitted"));
      onSaved?.(data.id);
      reset();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("savedLoc.addTitle")}</DialogTitle>
          <DialogDescription>{t("savedLoc.addHint")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>{t("savedLoc.label")}</Label>
            <Input
              value={label}
              maxLength={80}
              placeholder={t("savedLoc.labelPh")}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <ClientOnly fallback={<div className="h-72 rounded-2xl border border-border bg-muted/30" />}>
            <LocationMapPicker
              value={picked}
              onChange={handlePicked}
              countryCode={countryCode ?? "am"}
            />
          </ClientOnly>
          <div className="grid gap-2">
            <Label>{t("savedLoc.area")}</Label>
            <Select value={area ?? undefined} onValueChange={setArea}>
              <SelectTrigger>
                <SelectValue placeholder={t("savedLoc.areaPh")} />
              </SelectTrigger>
              <SelectContent>
                {YEREVAN_AREAS.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {areaLabel(a.id, lang)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "…" : t("savedLoc.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
