import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import type { Root } from "react-dom/client";
import { pathToFileURL } from "node:url";
import { LanguageProvider } from "@/i18n";
import { coordinationCopy } from "@/i18n/gathering-coordination";
const fixture = vi.hoisted(() => ({ manage: vi.fn() }));
vi.mock("@/lib/gathering-coordination.functions", () => ({
  manageGatheringCoordination: fixture.manage,
}));
import { GatheringCoordination } from "@/components/gathering-coordination";
import { GuestCoordination } from "@/components/guest-coordination";
const id = "63000000-0000-4000-8000-000000000001",
  item = "63000000-0000-4000-8000-000000000002",
  actor = `member:${id}`;
const base = {
  actor,
  is_host: true,
  participants: [{ key: actor, label: "Host", guest: false }],
  items: [
    {
      id: item,
      label: "Bring tea",
      assignee: null,
      assignee_label: null,
      active: false,
      done: false,
      guest_visible: false,
    },
  ],
  notes: [],
  expenses: [],
};

describe.skipIf(!process.env.HAVATO_TEST_JSDOM)("coordination DOM", () => {
  let root: Root, host: HTMLElement;
  const fetcher = vi.fn();
  beforeEach(async () => {
    const { JSDOM } = await import(
      /* @vite-ignore */ pathToFileURL(process.env.HAVATO_TEST_JSDOM!).href
    );
    const dom = new JSDOM("<html><body><div id='root'></div></body></html>", {
      url: "http://localhost/?lang=fa",
    });
    for (const key of [
      "window",
      "document",
      "navigator",
      "HTMLElement",
      "HTMLInputElement",
      "HTMLTextAreaElement",
      "Element",
      "Node",
      "Event",
      "CustomEvent",
    ] as const)
      vi.stubGlobal(key, key === "window" ? dom.window : dom.window[key]);
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal("fetch", fetcher);
    fixture.manage.mockReset();
    fixture.manage.mockResolvedValue(structuredClone(base));
    fetcher.mockReset();
    const { createRoot } = await import("react-dom/client");
    host = document.getElementById("root")!;
    root = createRoot(host);
  }, 30000);
  afterEach(async () => {
    if (root) await act(async () => root.unmount());
    vi.unstubAllGlobals();
  });
  const copy = (lang: string, key: string) => coordinationCopy[lang][`coord.${key}`];
  const button = (text: string) =>
    [...host.querySelectorAll("button")].find((b) => b.textContent === text)!;
  async function render(section: "tasks" | "notesExpenses", lang = "fa") {
    window.history.replaceState(null, "", `/?lang=${lang}`);
    await act(async () =>
      root.render(
        createElement(LanguageProvider, {
          children: createElement(GatheringCoordination, { gatheringId: id, section }),
        }),
      ),
    );
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
  }
  async function input(selector: string, value: string) {
    const field = host.querySelector(selector) as HTMLInputElement;
    const prototype =
      field.tagName === "TEXTAREA"
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
    await act(async () => {
      Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(field, value);
      field.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }
  it.each(["fa", "en"])(
    "host assignments and guest visibility use exact checklist ID in %s",
    async (lang) => {
      await render("tasks", lang);
      expect(document.documentElement.dir).toBe(lang === "fa" ? "rtl" : "ltr");
      expect(host.textContent).toContain(copy(lang, "tasksHelp"));
      expect(host.textContent).toContain("Bring tea");
      const select = host.querySelector("select")!;
      await act(async () => {
        select.value = actor;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });
      expect(fixture.manage).toHaveBeenLastCalledWith({
        data: { id, action: "task", data: { item, operation: "assign", assignee: actor } },
      });
      await act(async () =>
        (host.querySelector('input[type="checkbox"]') as HTMLInputElement).click(),
      );
      expect(fixture.manage).toHaveBeenLastCalledWith({
        data: { id, action: "task", data: { item, operation: "share", guest_visible: true } },
      });
    },
  );
  it("member can volunteer but receives no host assignment/share control", async () => {
    fixture.manage.mockResolvedValue({ ...base, is_host: false });
    await render("tasks");
    expect(host.querySelector("select")).toBeNull();
    expect(host.querySelector('input[type="checkbox"]')).toBeNull();
    await act(async () => button(copy("fa", "volunteer")).click());
    expect(fixture.manage).toHaveBeenLastCalledWith({
      data: { id, action: "task", data: { item, operation: "volunteer" } },
    });
  });
  it.each(["fa", "en"])(
    "host records exact integer expense and shared note in %s",
    async (lang) => {
      await render("notesExpenses", lang);
      await input("#coord-note", "Bring water");
      await act(async () =>
        (host.querySelector('input[type="checkbox"]') as HTMLInputElement).click(),
      );
      await act(async () =>
        host
          .querySelector("form")!
          .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
      );
      expect(fixture.manage).toHaveBeenLastCalledWith({
        data: { id, action: "save_note", data: { body: "Bring water", guest_visible: true } },
      });
      await input("#coord-cost-label", "Tea");
      await input("#coord-amount", lang === "fa" ? "۱۲۳" : "123");
      const payer = host.querySelector("#coord-payer") as HTMLSelectElement;
      await act(async () => {
        payer.value = actor;
        payer.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await act(async () => (host.querySelector("fieldset input") as HTMLInputElement).click());
      await act(async () =>
        host
          .querySelectorAll("form")[1]
          .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
      );
      expect(fixture.manage).toHaveBeenLastCalledWith({
        data: {
          id,
          action: "expense",
          data: { label: "Tea", amount: 123, currency: "IRT", payer: actor, participants: [actor] },
        },
      });
      expect((host.querySelector("#coord-amount") as HTMLInputElement).value).toBe("");
    },
  );
  it("member notes cannot share to guests; ledger is read-only", async () => {
    fixture.manage.mockResolvedValue({ ...base, is_host: false });
    await render("notesExpenses");
    expect(host.querySelector("#coord-amount")).toBeNull();
    expect(host.querySelector('input[type="checkbox"]')).toBeNull();
    await input("#coord-note", "My note");
    await act(async () =>
      host
        .querySelector("form")!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
    );
    expect(fixture.manage).toHaveBeenLastCalledWith({
      data: { id, action: "save_note", data: { body: "My note" } },
    });
  });
  it("retains failed note input, permits retry, and clears private data on lost permission", async () => {
    await render("notesExpenses");
    await input("#coord-note", "Keep this text");
    fixture.manage.mockRejectedValueOnce(new Error("COORDINATION_CONFLICT"));
    await act(async () =>
      host
        .querySelector("form")!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
    );
    expect((host.querySelector("#coord-note") as HTMLTextAreaElement).value).toBe("Keep this text");
    expect(host.querySelector('[role="alert"]')?.textContent).toBe(copy("fa", "conflict"));
    fixture.manage.mockRejectedValueOnce(new Error("COORDINATION_UNAVAILABLE"));
    await act(async () => button(copy("fa", "refresh")).click());
    expect(host.querySelector("#coord-note")).toBeNull();
    await act(async () => button(copy("fa", "refresh")).click());
    expect(host.querySelector("#coord-note")).not.toBeNull();
  });
  it("edits and deletes own note with version, rendering plain text safely", async () => {
    fixture.manage.mockResolvedValue({
      ...base,
      is_host: false,
      notes: [
        {
          id: item,
          body: "<script>private</script>",
          version: 3,
          can_edit: true,
          guest_visible: false,
        },
      ],
    });
    await render("notesExpenses");
    expect(host.querySelector("script")).toBeNull();
    await act(async () => button(copy("fa", "edit")).click());
    await input("#coord-note", "Edited");
    await act(async () =>
      host
        .querySelector("form")!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
    );
    expect(fixture.manage).toHaveBeenLastCalledWith({
      data: { id, action: "save_note", data: { id: item, version: 3, body: "Edited" } },
    });
    await act(async () => button(copy("fa", "delete")).click());
    expect(fixture.manage).toHaveBeenLastCalledWith({
      data: { id, action: "delete_note", data: { id: item, version: 3 } },
    });
  });
  it("guest can volunteer/complete/release; revoked capability removes details", async () => {
    const unavailable = vi.fn();
    let mine = false,
      done = false;
    fetcher.mockImplementation(async (_url, init) => {
      const command = JSON.parse(init.body).coordination;
      if (command.operation === "volunteer") mine = true;
      if (command.operation === "done") done = command.done;
      if (command.operation === "release") mine = false;
      return Response.json({
        ...{
          subject: "Tea",
          starts_at: "2027-01-01",
          venue_name: "Home",
          address: null,
          description: null,
          response: "going",
          guest_name: "Me",
          expires_at: "2027-01-01",
        },
        coordination: {
          items: [{ id: item, label: "Shared tea", mine, done, available: !mine }],
          notes: [{ body: "Shared note" }],
        },
      });
    });
    await act(async () =>
      root.render(
        createElement(LanguageProvider, {
          children: createElement(GuestCoordination, {
            token: "A".repeat(43),
            onUnavailable: unavailable,
          }),
        }),
      ),
    );
    await act(async () => button(copy("fa", "refresh")).click());
    expect(host.textContent).toContain("Shared note");
    expect(host.querySelector("select")).toBeNull();
    expect(host.querySelector("textarea")).toBeNull();
    await act(async () => button(copy("fa", "volunteer")).click());
    await act(async () => button(copy("fa", "done")).click());
    expect(JSON.parse(fetcher.mock.calls.at(-1)![1].body).coordination).toEqual({
      item,
      operation: "done",
      done: true,
    });
    await act(async () => button(copy("fa", "release")).click());
    fetcher.mockResolvedValueOnce(Response.json({ code: "unavailable" }, { status: 404 }));
    await act(async () => button(copy("fa", "refresh")).click());
    expect(unavailable).toHaveBeenCalledOnce();
    expect(host.textContent).not.toContain("Shared note");
  });
});
