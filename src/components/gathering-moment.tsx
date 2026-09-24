import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useI18n, useT } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";
import {
  createLifeMoment,
  createLifeMomentPhotoUpload,
  loadGatheringLifeMoment,
  updateLifeMoment,
} from "@/lib/life-moments.functions";
import { MOMENT_MEDIA_BUCKET } from "@/lib/life-moments";
import { momentPhotoExtension } from "@/lib/gathering-moment";

type Loaded = Awaited<ReturnType<typeof loadGatheringLifeMoment>>;

/** Passive card: never opens over check-in, safety controls, or feedback. */
export function GatheringMoment({ gatheringId, userId }: { gatheringId: string; userId: string }) {
  const t = useT();
  const load = useServerFn(loadGatheringLifeMoment);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const query = useQuery({
    queryKey: ["gathering-moment", userId, gatheringId],
    queryFn: () => load({ data: { gatheringId } }),
    refetchInterval: open || dismissed ? false : 30_000,
    refetchOnWindowFocus: !open,
  });
  if (query.isPending)
    return (
      <p className="mt-6 text-sm text-muted-foreground" role="status">
        {t("moment.loading")}
      </p>
    );
  if (query.isError && !query.data)
    return (
      <div className="mt-6 text-sm">
        <p role="status">{t("moment.loadError")}</p>
        <Button variant="ghost" onClick={() => query.refetch()}>
          {t("moment.retry")}
        </Button>
      </div>
    );
  const loaded = query.data;
  if (!loaded.moment && (!loaded.prefill || dismissed)) return null;
  return (
    <section
      className="mt-6 rounded-2xl border border-primary/25 bg-primary/5 p-4"
      aria-label={t("moment.remember")}
    >
      <h2 className="flex items-center gap-2 font-display text-xl">
        {loaded.moment && <Check className="h-5 w-5" />}
        {t(loaded.moment ? "moment.saved" : "moment.remember")}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("moment.optional")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Dialog
          open={open}
          onOpenChange={(value) => {
            if (!busy) setOpen(value);
          }}
        >
          <DialogTrigger asChild>
            <Button className="min-h-11 rounded-full">
              {t(loaded.moment ? "moment.edit" : "moment.save")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl sm:rounded-2xl">
            {open && (
              <MomentEditor
                gatheringId={gatheringId}
                loaded={loaded}
                onBusy={setBusy}
                onClose={() => setOpen(false)}
                onSaved={() => {
                  void query.refetch();
                }}
              />
            )}
          </DialogContent>
        </Dialog>
        {!loaded.moment && (
          <Button
            variant="ghost"
            className="min-h-11 rounded-full"
            onClick={() => setDismissed(true)}
          >
            {t("moment.notNow")}
          </Button>
        )}
      </div>
    </section>
  );
}

export function MomentEditor({
  gatheringId,
  loaded,
  onBusy,
  onClose,
  onSaved,
}: {
  gatheringId: string | null;
  loaded: Loaded;
  onBusy: (value: boolean) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useT();
  const { lang } = useI18n();
  const create = useServerFn(createLifeMoment);
  const update = useServerFn(updateLifeMoment);
  const prepareUpload = useServerFn(createLifeMomentPhotoUpload);
  const [moment, setMoment] = useState(loaded.moment);
  const [note, setNote] = useState(loaded.moment?.note ?? "");
  const [visibility, setVisibility] = useState<"private" | "profile">(
    loaded.moment?.visibility === "profile" ? "profile" : "private",
  );
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const title = moment?.title ?? loaded.prefill?.title ?? "";
  const date = moment?.happened_at ?? loaded.prefill?.happened_at;
  async function save() {
    if (busy) return;
    setBusy(true);
    onBusy(true);
    setError("");
    let textSaved = false;
    try {
      let row;
      if (moment) {
        row = await update({
          data: { id: moment.id, patch: { note: note.trim() || null, visibility } },
        });
      } else {
        if (!loaded.prefill) throw new Error("Unavailable");
        const created = await create({
          data: {
            gathering_id: gatheringId,
            title,
            happened_at: loaded.prefill.happened_at,
            note: note.trim() || null,
            visibility,
          },
        });
        if (created.alreadyExists) {
          setMoment({ ...created, photoUrl: null });
          setNote(created.note ?? "");
          setVisibility(created.visibility === "profile" ? "profile" : "private");
          setPhoto(null);
          setError(t("moment.existing"));
          onSaved();
          return;
        }
        row = created;
      }
      textSaved = true;
      setMoment({ ...row, photoUrl: moment?.photoUrl ?? null });
      onSaved();
      if (photo) {
        const extension = momentPhotoExtension(photo);
        if (!extension) throw new Error("Invalid photo");
        const upload = await prepareUpload({ data: { id: row.id, extension } });
        const result = await supabase.storage
          .from(MOMENT_MEDIA_BUCKET)
          .uploadToSignedUrl(upload.path, upload.token, photo, { contentType: photo.type });
        if (result.error) throw result.error;
        await update({ data: { id: row.id, patch: { photo_path: upload.path } } });
      }
      onSaved();
      toast.success(t("moment.saved"));
      onClose();
    } catch {
      setError(t(textSaved && photo ? "moment.photoError" : "moment.saveError"));
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  return (
    <>
      <DialogHeader>
        <DialogTitle>{t(moment ? "moment.edit" : "moment.remember")}</DialogTitle>
        <DialogDescription>{t("moment.optional")}</DialogDescription>
      </DialogHeader>
      <form
        className="grid min-w-0 gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
        aria-busy={busy}
      >
        <div>
          <h3 className="break-words font-display text-xl">{title}</h3>
          {date && (
            <p className="text-sm text-muted-foreground">
              {new Date(date).toLocaleString(lang, {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
          {loaded.prefill?.place && (
            <p className="break-words text-sm text-muted-foreground">{loaded.prefill.place}</p>
          )}
        </div>
        <fieldset disabled={busy} className="grid min-w-0 gap-4">
          <div className="grid min-w-0 gap-2">
            {moment?.photoUrl && (
              <img
                src={moment.photoUrl}
                alt={t("moment.photo")}
                className="max-h-40 w-full rounded-xl object-contain"
                onError={(event) => {
                  event.currentTarget.hidden = true;
                }}
              />
            )}
            {moment?.photo_path && (
              <p className="text-xs text-muted-foreground">{t("moment.photoAttached")}</p>
            )}
            <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-input px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
              <Camera className="h-4 w-4 shrink-0" />
              <span className="text-sm">{t("moment.photo")}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                aria-label={t("moment.photo")}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (!momentPhotoExtension(file)) {
                    setError(t("moment.photoLimit"));
                    event.target.value = "";
                    return;
                  }
                  setPhoto(file);
                  event.target.value = "";
                  setError("");
                }}
              />
            </label>
            {photo && (
              <p className="truncate text-sm" role="status">
                {photo.name}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{t("moment.photoLimit")}</p>
            {photo && (
              <Button type="button" variant="ghost" onClick={() => setPhoto(null)}>
                {t("moment.skipPhoto")}
              </Button>
            )}
          </div>
          <div className="grid min-w-0 gap-2">
            <label htmlFor="moment-note" className="text-sm">
              {t("moment.note")}
            </label>
            <Textarea
              id="moment-note"
              value={note}
              maxLength={2000}
              rows={3}
              onChange={(event) => setNote(event.target.value)}
              placeholder={t("moment.notePlaceholder")}
            />
            <p className="text-xs text-muted-foreground">{t("moment.notePrivate")}</p>
          </div>
          <fieldset className="flex min-w-0 flex-wrap gap-2">
            <legend className="mb-2 text-sm">{t("moment.visibility")}</legend>
            {(["private", "profile"] as const).map((value) => (
              <label
                key={value}
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-input px-4 has-[:checked]:border-primary has-[:checked]:bg-primary/10"
              >
                <input
                  type="radio"
                  name="moment-visibility"
                  value={value}
                  checked={visibility === value}
                  onChange={() => setVisibility(value)}
                />
                {t(`moment.${value}`)}
              </label>
            ))}
          </fieldset>
        </fieldset>
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-sm text-foreground"
          >
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy} className="min-h-11 rounded-full">
          {busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {t(busy ? "moment.saving" : "moment.save")}
        </Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={onClose}>
          {t("moment.notNow")}
        </Button>
      </form>
    </>
  );
}
