import { useEffect, useState } from "react";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { manageGatheringCoordination } from "@/lib/gathering-coordination.functions";
import {
  expenseBalances,
  parseExpenseAmount,
  type CoordinationCommand,
  type CoordinationState,
} from "@/lib/gathering-coordination";

export function GatheringCoordination({
  gatheringId,
  section,
  revision = 0,
}: {
  gatheringId: string;
  section: "tasks" | "notesExpenses";
  revision?: number;
}) {
  const { t, lang } = useI18n();
  const [state, setState] = useState<CoordinationState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [body, setBody] = useState("");
  const [editing, setEditing] = useState<CoordinationState["notes"][number] | null>(null);
  const [shared, setShared] = useState(false);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("IRT");
  const [payer, setPayer] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const message = (e: unknown) => {
    const code = e instanceof Error ? e.message : "";
    return (
      (
        {
          TASK_TAKEN: "coord.taken",
          COORDINATION_CONFLICT: "coord.conflict",
          CURRENCY_MISMATCH: "coord.currencyMismatch",
          COORDINATION_LIMIT: "coord.limit",
        } as Record<string, string>
      )[code] ?? "coord.failed"
    );
  };
  useEffect(() => {
    let alive = true;
    setState(null);
    setBusy(true);
    setError("");
    manageGatheringCoordination({ data: { id: gatheringId, action: "list" } })
      .then((result) => {
        if (alive) setState(result);
      })
      .catch((e) => {
        if (alive) setError(message(e));
      })
      .finally(() => {
        if (alive) setBusy(false);
      });
    return () => {
      alive = false;
    };
  }, [gatheringId, revision]);
  async function run(command: CoordinationCommand) {
    if (busy) return false;
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      setState(await manageGatheringCoordination({ data: command }));
      setSaved(command.action !== "list");
      return true;
    } catch (e) {
      setError(message(e));
      if (message(e) === "coord.failed") setState(null);
      return false;
    } finally {
      setBusy(false);
    }
  }
  const person = (name: string) =>
    name === "Guest" ? t("coord.guest") : name === "Participant" ? t("coord.participant") : name;
  const money = (value: number, unit: string) =>
    `${(value / (unit === "IRR" || unit === "IRT" ? 1 : 100)).toLocaleString(lang === "fa" ? "fa-IR" : "en", { maximumFractionDigits: 2 })} ${unit === "IRT" && lang === "fa" ? "تومان" : unit}`;
  const control = "min-h-11 w-full min-w-0 rounded-lg border border-input bg-background p-2";
  return (
    <section
      className="grid min-w-0 gap-4 rounded-2xl border border-border bg-card p-4"
      dir={lang === "fa" ? "rtl" : "ltr"}
      aria-busy={busy}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-xl">
          {t(section === "tasks" ? "coord.tasks" : "coord.title")}
        </h3>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => void run({ id: gatheringId, action: "list" })}
        >
          {t("coord.refresh")}
        </Button>
      </div>
      {busy && <p role="status">{t("common.loading")}</p>}
      {error && <p role="alert">{t(error)}</p>}
      {saved && <p role="status">{t("coord.saved")}</p>}
      {state && section === "tasks" && (
        <>
          <p className="text-sm text-muted-foreground">{t("coord.tasksHelp")}</p>
          {state.items.length === 0 && <p>{t("coord.empty")}</p>}
          <ul className="grid gap-4">
            {state.items.map((item) => {
              const mine = item.assignee === state.actor;
              const task = (data: Extract<CoordinationCommand, { action: "task" }>["data"]) =>
                void run({ id: gatheringId, action: "task", data });
              return (
                <li
                  key={item.id}
                  className="grid min-w-0 gap-2 rounded-xl border border-border p-3"
                >
                  <strong className="break-words">{item.label}</strong>
                  <p className="break-words">
                    {item.assignee
                      ? item.active
                        ? person(item.assignee_label ?? "Participant")
                        : t("coord.unavailablePerson")
                      : t("coord.unassigned")}
                    {item.done && item.active ? ` · ${t("coord.done")}` : ""}
                  </p>
                  {state.is_host && (
                    <>
                      <Label htmlFor={`assign-${item.id}`}>{t("coord.assign")}</Label>
                      <select
                        id={`assign-${item.id}`}
                        className={control}
                        disabled={busy}
                        value={item.active ? (item.assignee ?? "") : ""}
                        onChange={(e) =>
                          task({
                            item: item.id,
                            operation: "assign",
                            assignee: e.target.value || null,
                          })
                        }
                      >
                        <option value="">{t("coord.unassigned")}</option>
                        {state.participants.map((p) => (
                          <option key={p.key} value={p.key}>
                            {person(p.label)}
                          </option>
                        ))}
                      </select>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.guest_visible}
                          disabled={busy}
                          onChange={(e) =>
                            task({
                              item: item.id,
                              operation: "share",
                              guest_visible: e.target.checked,
                            })
                          }
                        />
                        {t("coord.guestVisible")}
                      </label>
                    </>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {(!item.assignee || !item.active) && (
                      <Button
                        disabled={busy}
                        onClick={() => task({ item: item.id, operation: "volunteer" })}
                      >
                        {t("coord.volunteer")}
                      </Button>
                    )}
                    {item.assignee && (mine || state.is_host) && (
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() => task({ item: item.id, operation: "release" })}
                      >
                        {t("coord.release")}
                      </Button>
                    )}
                    {item.active && (mine || state.is_host) && (
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() => task({ item: item.id, operation: "done", done: !item.done })}
                      >
                        {t(item.done ? "coord.reopen" : "coord.done")}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
      {state && section === "notesExpenses" && (
        <>
          <h3 className="font-display text-xl">{t("coord.notes")}</h3>
          {state.notes.length === 0 && <p>{t("coord.empty")}</p>}
          <ul className="grid gap-3">
            {state.notes.map((note) => (
              <li key={note.id} className="grid gap-2 rounded-xl border border-border p-3">
                <p className="whitespace-pre-wrap break-words">{note.body}</p>
                {note.guest_visible && (
                  <p className="text-sm text-muted-foreground">{t("coord.guestVisible")}</p>
                )}
                {note.can_edit && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        setEditing(note);
                        setBody(note.body);
                        setShared(note.guest_visible);
                      }}
                    >
                      {t("coord.edit")}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={async () => {
                        if (
                          (await run({
                            id: gatheringId,
                            action: "delete_note",
                            data: { id: note.id, version: note.version },
                          })) &&
                          editing?.id === note.id
                        ) {
                          setEditing(null);
                          setBody("");
                        }
                      }}
                    >
                      {t("coord.delete")}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <form
            className="grid gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await run({
                  id: gatheringId,
                  action: "save_note",
                  data: {
                    body,
                    ...(state.is_host ? { guest_visible: shared } : {}),
                    ...(editing ? { id: editing.id, version: editing.version } : {}),
                  },
                })
              ) {
                setBody("");
                setEditing(null);
                setShared(false);
              }
            }}
          >
            <Label htmlFor="coord-note">{t("coord.noteBody")}</Label>
            <Textarea
              id="coord-note"
              value={body}
              maxLength={2000}
              disabled={busy}
              onChange={(e) => setBody(e.target.value)}
            />
            {state.is_host && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={shared}
                  disabled={busy}
                  onChange={(e) => setShared(e.target.checked)}
                />
                {t("coord.guestVisible")}
              </label>
            )}
            <div className="flex flex-wrap gap-2">
              <Button disabled={busy || !body.trim()}>{t("coord.save")}</Button>
              {editing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditing(null);
                    setBody("");
                    setShared(false);
                  }}
                >
                  {t("coord.cancel")}
                </Button>
              )}
            </div>
          </form>
          <h3 className="mt-4 font-display text-xl">{t("coord.expenses")}</h3>
          <p className="text-sm text-muted-foreground">{t("coord.costHelp")}</p>
          {state.expenses.length === 0 && <p>{t("coord.empty")}</p>}
          <ul className="grid gap-3">
            {state.expenses.map((expense) => (
              <li key={expense.id} className="grid gap-2 rounded-xl border border-border p-3">
                <strong className="break-words">{expense.label}</strong>
                <p>{money(expense.amount, expense.currency)}</p>
                <p className="break-words">
                  {t("coord.paid")}: {person(expense.payer_label)}
                </p>
                <ul>
                  {expense.shares.map((share) => (
                    <li key={share.key} className="break-words">
                      {person(share.label)}: {money(share.amount, expense.currency)}
                    </li>
                  ))}
                </ul>
                {state.is_host && (
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      void run({
                        id: gatheringId,
                        action: "delete_expense",
                        data: { id: expense.id },
                      })
                    }
                  >
                    {t("coord.delete")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
          {state.expenses.length > 0 && (
            <>
              <h4 className="font-medium">{t("coord.balance")}</h4>
              <ul>
                {expenseBalances(state.expenses).map((balance) => (
                  <li key={balance.key} className="break-words">
                    {person(balance.label)}:{" "}
                    <bdi>{money(balance.amount, state.expenses[0].currency)}</bdi>
                  </li>
                ))}
              </ul>
            </>
          )}
          {state.is_host && (
            <form
              className="grid gap-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const unit = state.expenses[0]?.currency ?? currency;
                const value = parseExpenseAmount(amount, unit);
                if (value === null) {
                  setError("coord.amountInvalid");
                  return;
                }
                if (
                  await run({
                    id: gatheringId,
                    action: "expense",
                    data: {
                      label,
                      amount: value,
                      currency: unit as "IRR" | "IRT" | "USD" | "EUR",
                      payer,
                      participants: selected,
                    },
                  })
                ) {
                  setLabel("");
                  setAmount("");
                  setSelected([]);
                }
              }}
            >
              <Label htmlFor="coord-cost-label">{t("coord.label")}</Label>
              <Input
                id="coord-cost-label"
                value={label}
                maxLength={140}
                disabled={busy}
                onChange={(e) => setLabel(e.target.value)}
              />
              <Label htmlFor="coord-currency">{t("coord.currency")}</Label>
              <select
                id="coord-currency"
                className={control}
                value={state.expenses[0]?.currency ?? currency}
                disabled={busy || state.expenses.length > 0}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {["IRT", "IRR", "USD", "EUR"].map((unit) => (
                  <option key={unit} value={unit}>
                    {unit === "IRT" && lang === "fa" ? "تومان" : unit}
                  </option>
                ))}
              </select>
              <Label htmlFor="coord-amount">{t("coord.amount")}</Label>
              <Input
                id="coord-amount"
                inputMode="decimal"
                value={amount}
                maxLength={16}
                disabled={busy}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Label htmlFor="coord-payer">{t("coord.payer")}</Label>
              <select
                id="coord-payer"
                className={control}
                value={payer}
                disabled={busy}
                onChange={(e) => setPayer(e.target.value)}
              >
                <option value="">{t("coord.payer")}</option>
                {state.participants.map((p) => (
                  <option key={p.key} value={p.key}>
                    {person(p.label)}
                  </option>
                ))}
              </select>
              <fieldset disabled={busy} className="grid gap-2">
                <legend className="mb-2">{t("coord.split")}</legend>
                {state.participants.map((p) => (
                  <label key={p.key} className="flex min-h-11 items-center gap-2 break-words">
                    <input
                      type="checkbox"
                      checked={selected.includes(p.key)}
                      onChange={(e) =>
                        setSelected((old) =>
                          e.target.checked ? [...old, p.key] : old.filter((key) => key !== p.key),
                        )
                      }
                    />
                    {person(p.label)}
                  </label>
                ))}
              </fieldset>
              <Button
                disabled={
                  busy || !label.trim() || !amount.trim() || !payer || selected.length === 0
                }
              >
                {t("coord.record")}
              </Button>
            </form>
          )}
        </>
      )}
    </section>
  );
}
