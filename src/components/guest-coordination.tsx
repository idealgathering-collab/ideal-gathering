import { useState } from "react";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { requestGuestInvitation } from "@/lib/guest-invitations";
import type { GuestCoordinationState } from "@/lib/gathering-coordination";

export function GuestCoordination({
  token,
  onUnavailable,
}: {
  token: string;
  onUnavailable: () => void;
}) {
  const { t } = useI18n();
  const [state, setState] = useState<GuestCoordinationState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run(
    command:
      | { operation: "list" }
      | { item: string; operation: "volunteer" | "release" }
      | { item: string; operation: "done"; done: boolean },
  ) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const details = await requestGuestInvitation({ token, adult: true, coordination: command });
      setState(details.coordination ?? null);
    } catch (e) {
      const code = e instanceof Error ? e.message : "failed";
      setError(
        code === "taken" ? "coord.taken" : code === "limited" ? "guest.limited" : "coord.failed",
      );
      if (code === "unavailable") {
        setState(null);
        onUnavailable();
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="grid min-w-0 gap-3 rounded-2xl border border-border bg-card p-4"
      aria-busy={busy}
    >
      <h2 className="font-display text-xl">{t("coord.title")}</h2>
      <p className="text-sm text-muted-foreground">{t("coord.guestHelp")}</p>
      <Button variant="outline" disabled={busy} onClick={() => void run({ operation: "list" })}>
        {t("coord.refresh")}
      </Button>
      {busy && <p role="status">{t("common.loading")}</p>}
      {error && <p role="alert">{t(error)}</p>}
      {state && (
        <>
          <h3>{t("coord.tasks")}</h3>
          {state.items.length === 0 && <p>{t("coord.empty")}</p>}
          <ul className="grid gap-3">
            {state.items.map((item) => (
              <li key={item.id} className="grid gap-2 rounded-xl border border-border p-3">
                <strong className="break-words">{item.label}</strong>
                {item.done && <p>{t("coord.done")}</p>}
                {item.available && !item.mine && (
                  <Button
                    disabled={busy}
                    onClick={() => void run({ item: item.id, operation: "volunteer" })}
                  >
                    {t("coord.volunteer")}
                  </Button>
                )}
                {item.mine && (
                  <div className="grid gap-2">
                    <Button
                      disabled={busy}
                      onClick={() =>
                        void run({ item: item.id, operation: "done", done: !item.done })
                      }
                    >
                      {t(item.done ? "coord.reopen" : "coord.done")}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => void run({ item: item.id, operation: "release" })}
                    >
                      {t("coord.release")}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <h3>{t("coord.notes")}</h3>
          {state.notes.length === 0 && <p>{t("coord.empty")}</p>}
          {state.notes.map((note, i) => (
            <p key={i} className="whitespace-pre-wrap break-words">
              {note.body}
            </p>
          ))}
        </>
      )}
    </section>
  );
}
