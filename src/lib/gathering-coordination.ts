import { z } from "zod";

const uuid = z.string().uuid();
const participantKey = z.string().regex(/^(member|guest):[0-9a-f-]{36}$/);
export const taskCommand = z.discriminatedUnion("operation", [
  z.object({ item: uuid, operation: z.literal("volunteer") }).strict(),
  z.object({ item: uuid, operation: z.literal("release") }).strict(),
  z.object({ item: uuid, operation: z.literal("done"), done: z.boolean() }).strict(),
  z
    .object({ item: uuid, operation: z.literal("assign"), assignee: participantKey.nullable() })
    .strict(),
  z.object({ item: uuid, operation: z.literal("share"), guest_visible: z.boolean() }).strict(),
]);
export const guestTaskCommand = z.discriminatedUnion("operation", [
  taskCommand.options[0],
  taskCommand.options[1],
  taskCommand.options[2],
]);
export const coordinationCommand = z.discriminatedUnion("action", [
  z.object({ id: uuid, action: z.literal("list") }).strict(),
  z.object({ id: uuid, action: z.literal("task"), data: taskCommand }).strict(),
  z
    .object({
      id: uuid,
      action: z.literal("save_note"),
      data: z
        .object({
          id: uuid.optional(),
          version: z.number().int().positive().optional(),
          body: z.string().trim().min(1).max(2000),
          guest_visible: z.boolean().optional(),
        })
        .strict()
        .refine((v) => !v.id || v.version !== undefined),
    })
    .strict(),
  z
    .object({
      id: uuid,
      action: z.literal("delete_note"),
      data: z.object({ id: uuid, version: z.number().int().positive() }).strict(),
    })
    .strict(),
  z
    .object({
      id: uuid,
      action: z.literal("expense"),
      data: z
        .object({
          label: z.string().trim().min(1).max(140),
          amount: z.number().int().min(1).max(100000000000),
          currency: z.enum(["IRR", "IRT", "USD", "EUR"]),
          payer: participantKey,
          participants: z
            .array(participantKey)
            .min(1)
            .max(30)
            .refine((v) => new Set(v).size === v.length),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      id: uuid,
      action: z.literal("delete_expense"),
      data: z.object({ id: uuid }).strict(),
    })
    .strict(),
]);
export const coordinationState = z.object({
  actor: participantKey,
  is_host: z.boolean(),
  participants: z.array(z.object({ key: participantKey, label: z.string(), guest: z.boolean() })),
  items: z.array(
    z.object({
      id: uuid,
      label: z.string(),
      assignee: participantKey.nullable(),
      assignee_label: z.string().nullable(),
      active: z.boolean(),
      done: z.boolean(),
      guest_visible: z.boolean(),
    }),
  ),
  notes: z.array(
    z.object({
      id: uuid,
      body: z.string(),
      version: z.number(),
      can_edit: z.boolean(),
      guest_visible: z.boolean(),
    }),
  ),
  expenses: z.array(
    z.object({
      id: uuid,
      label: z.string(),
      amount: z.number(),
      currency: z.enum(["IRR", "IRT", "USD", "EUR"]),
      payer: participantKey,
      payer_label: z.string(),
      shares: z.array(z.object({ key: participantKey, label: z.string(), amount: z.number() })),
    }),
  ),
});
export const guestCoordinationState = z.object({
  items: z.array(
    z.object({
      id: uuid,
      label: z.string(),
      mine: z.boolean().nullable(),
      available: z.boolean(),
      done: z.boolean(),
    }),
  ),
  notes: z.array(z.object({ body: z.string() })),
});
export type CoordinationState = z.infer<typeof coordinationState>;
export type GuestCoordinationState = z.infer<typeof guestCoordinationState>;
export type CoordinationCommand = z.infer<typeof coordinationCommand>;

export function parseExpenseAmount(text: string, currency: string): number | null {
  const normalized = text
    .trim()
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
    .replace("٫", ".");
  const digits = currency === "IRR" || currency === "IRT" ? 0 : 2;
  const pattern = digits ? /^\d+(?:\.\d{1,2})?$/ : /^\d+$/;
  if (!pattern.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  const amount =
    Number(whole) * (digits ? 100 : 1) + (digits ? Number(fraction.padEnd(2, "0")) : 0);
  return Number.isSafeInteger(amount) && amount > 0 && amount <= 100000000000 ? amount : null;
}
export function expenseBalances(expenses: CoordinationState["expenses"]) {
  const balances = new Map<string, { key: string; label: string; amount: number }>();
  const add = (key: string, label: string, amount: number) => {
    const previous = balances.get(key);
    balances.set(key, { key, label, amount: (previous?.amount ?? 0) + amount });
  };
  for (const expense of expenses) {
    add(expense.payer, expense.payer_label, expense.amount);
    for (const share of expense.shares) add(share.key, share.label, -share.amount);
  }
  return [...balances.values()].sort((a, b) => a.key.localeCompare(b.key));
}
