import { useState } from "react";
import { toast } from "sonner";
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
import { LocationAutocomplete, type LocationValue } from "@/components/location-autocomplete";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useT } from "@/i18n";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: (id: string) => void;
  /** ISO country code to bias Nominatim search. Falls back to TR. */
  countryCode?: string | null;
};

export function SavedLocationDialog({ open, onOpenChange, onSaved, countryCode }: Props) {
  const t = useT();
  const { user } = useSession();
  const [label, setLabel] = useState("");
  const [text, setText] = useState("");
  const [picked, setPicked] = useState<LocationValue | null>(null);
  const [busy, setBusy] = useState(false);

  function reset() {
    setLabel("");
    setText("");
    setPicked(null);
  }

  async function submit() {
    if (!user) return;
    if (!label.trim()) return toast.error(t("savedLoc.labelRequired"));
    if (!picked) return toast.error(t("savedLoc.pickFromList"));
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("saved_locations")
        .insert({
          user_id: user.id,
          label: label.trim(),
          address: picked.address || picked.display_name,
          city: picked.city || null,
          neighborhood: null,
          lat: picked.lat,
          lng: picked.lng,
        })
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
      <DialogContent>
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
          <div className="grid gap-2">
            <Label>{t("savedLoc.address")}</Label>
            <LocationAutocomplete
              value={text}
              onChange={setText}
              onSelect={(v) => {
                setPicked(v);
                setText(v.display_name);
              }}
              countryCodes={(countryCode ?? "tr").toLowerCase()}
              placeholder={t("savedLoc.addressPh")}
            />
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
