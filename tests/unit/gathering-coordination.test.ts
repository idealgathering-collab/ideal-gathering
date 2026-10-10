import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  coordinationCommand,
  expenseBalances,
  guestTaskCommand,
  parseExpenseAmount,
} from "@/lib/gathering-coordination";
import { guestRequest } from "@/lib/guest-invitations";
const fixture = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { rpc: fixture.rpc } }));
import { handleGuestInvitation } from "@/lib/guest-invitations.server";
const id = "63000000-0000-4000-8000-000000000001",
  key = `member:${id}`,
  token = "A".repeat(43);
const details = {
  subject: "Tea",
  starts_at: "2027-01-01",
  venue_name: "Home",
  address: null,
  description: null,
  response: "going",
  guest_name: "Me",
  expires_at: "2027-01-01",
};
beforeEach(() => {
  fixture.rpc.mockReset();
  fixture.rpc.mockImplementation(async (name: string) => ({
    data:
      name === "guest_invitation_limit"
        ? true
        : name === "guest_coordination"
          ? { items: [], notes: [] }
          : details,
    error: null,
  }));
});
describe("coordination rules", () => {
  it.each([
    ["۱۲۳", "IRT", 123],
    ["١٢٣", "IRR", 123],
    ["12.34", "USD", 1234],
    ["۱۲٫۳", "EUR", 1230],
    ["0.01", "USD", 1],
    ["1.234", "USD", null],
    ["1.2", "IRT", null],
    ["-1", "USD", null],
    ["1e5", "USD", null],
    ["1,000", "IRT", null],
    ["0", "IRR", null],
    ["100000000001", "IRR", null],
  ])("parses exact amount %s %s", (value, currency, expected) => {
    expect(parseExpenseAmount(value as string, currency as string)).toBe(expected);
  });
  it("conserves balances including a payer excluded from the split", () => {
    const expenses = [
      {
        id,
        label: "Tea",
        amount: 101,
        currency: "IRT" as const,
        payer: key,
        payer_label: "Host",
        shares: [
          { key: `guest:${id}`, label: "Guest", amount: 51 },
          { key: `member:${id.slice(0, -1)}2`, label: "Member", amount: 50 },
        ],
      },
    ];
    const balances = expenseBalances(expenses);
    expect(balances.reduce((sum, b) => sum + b.amount, 0)).toBe(0);
    expect(balances.find((b) => b.key === key)?.amount).toBe(101);
  });
  it("rejects duplicate participants, unknown fields, oversized amounts and stale-note inputs", () => {
    const data = { label: "Tea", amount: 100, currency: "IRT", payer: key, participants: [key] };
    expect(coordinationCommand.safeParse({ id, action: "expense", data }).success).toBe(true);
    expect(
      coordinationCommand.safeParse({
        id,
        action: "expense",
        data: { ...data, participants: [key, key] },
      }).success,
    ).toBe(false);
    expect(
      coordinationCommand.safeParse({
        id,
        action: "expense",
        data: { ...data, amount: 100000000001 },
      }).success,
    ).toBe(false);
    expect(coordinationCommand.safeParse({ id, action: "list", host: true }).success).toBe(false);
    expect(
      coordinationCommand.safeParse({ id, action: "save_note", data: { id, body: "Edit" } })
        .success,
    ).toBe(false);
  });
  it("guest contract allows only own task actions and rejects bundled RSVP", () => {
    expect(guestTaskCommand.safeParse({ item: id, operation: "volunteer" }).success).toBe(true);
    for (const operation of ["assign", "share", "expense", "save_note"])
      expect(guestTaskCommand.safeParse({ item: id, operation, assignee: key }).success).toBe(
        false,
      );
    expect(
      guestRequest.safeParse({ token, adult: true, coordination: { operation: "list" } }).success,
    ).toBe(true);
    expect(
      guestRequest.safeParse({
        token,
        adult: true,
        response: "going",
        name: "Me",
        coordination: { operation: "list" },
      }).success,
    ).toBe(false);
  });
});
describe("guest coordination HTTP boundary", () => {
  const request = (coordination: unknown) =>
    new Request("https://havato.test/api/guest-invitation", {
      method: "POST",
      headers: { origin: "https://havato.test", "content-type": "application/json" },
      body: JSON.stringify({ token, adult: true, coordination }),
    });
  it("uses existing limits then reauthorizes hashed capability for coordination", async () => {
    const result = await handleGuestInvitation(request({ operation: "list" }));
    expect(result.status).toBe(200);
    expect((await result.json()).coordination).toEqual({ items: [], notes: [] });
    expect(fixture.rpc.mock.calls.map((c) => c[0])).toEqual([
      "guest_invitation_limit",
      "use_guest_invitation",
      "guest_coordination",
    ]);
    expect(fixture.rpc.mock.calls[2][1]).toMatchObject({ _adult: true, _data: {} });
    expect(JSON.stringify(fixture.rpc.mock.calls)).not.toContain(token);
    expect(result.headers.get("cache-control")).toContain("no-store");
  });
  it("fails closed when the guest is revoked or expires between calls", async () => {
    fixture.rpc.mockImplementation(async (name: string) => ({
      data:
        name === "guest_invitation_limit" ? true : name === "guest_coordination" ? null : details,
      error: null,
    }));
    const response = await handleGuestInvitation(request({ item: id, operation: "volunteer" }));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ code: "unavailable" });
  });
  it("maps task conflict and hides privileged error text", async () => {
    fixture.rpc.mockImplementation(async (name: string) => ({
      data: name === "guest_invitation_limit" ? true : details,
      error: name === "guest_coordination" ? { message: "TASK_TAKEN private name" } : null,
    }));
    expect(
      await (await handleGuestInvitation(request({ item: id, operation: "volunteer" }))).json(),
    ).toEqual({ code: "taken" });
  });
  it("rejects attempts to grant guest visibility or impersonate another assignee", async () => {
    expect(
      (await handleGuestInvitation(request({ item: id, operation: "assign", assignee: key })))
        .status,
    ).toBe(400);
    expect(fixture.rpc).not.toHaveBeenCalled();
  });
});
