import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { pathToFileURL } from "node:url";
import { privateGatheringCopy } from "@/i18n/private-gatherings";
const fixture = vi.hoisted(() => ({ lang: "fa", rows: [] as unknown[], readError: false, rpcError: null as unknown, rpc: vi.fn() }));
vi.mock("@/i18n", () => ({ useT: () => (key: string) => privateGatheringCopy[fixture.lang]?.[key] ?? key }));
vi.mock("@/components/host-guest-invitations", () => ({ HostGuestInvitations: () => null }));
vi.mock("@/lib/public-data.functions", () => ({ getPublicProfiles: async () => [{ id: "guest", display_name: "Guest" }] }));
vi.mock("@tanstack/react-router", () => ({ Link: ({ children }: { children: unknown }) => children }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  rpc: (...args: unknown[]) => { fixture.rpc(...args); return Promise.resolve({ error: fixture.rpcError }); },
  from: () => {
    const chain = { select: () => chain, eq: () => chain, is: () => chain, limit: () => chain,
      order: () => chain, then: (fn: (r: unknown) => unknown) => Promise.resolve({ data: fixture.rows, error: fixture.readError ? new Error("read") : null }).then(fn) };
    return chain;
  },
} }));
import { PrivateGatheringInvitations } from "@/components/private-gathering-invitations";

describe.skipIf(!process.env.HAVATO_TEST_JSDOM)("private invitations DOM", () => {
  let root: Root, host: HTMLElement, dom: { window: Window & typeof globalThis }, qc: QueryClient;
  beforeEach(async () => {
    const { JSDOM } = await import(/* @vite-ignore */ pathToFileURL(process.env.HAVATO_TEST_JSDOM!).href);
    dom = new JSDOM("<html><body><div id='root'></div></body></html>", { url: "http://localhost" });
    for (const key of ["window", "document", "navigator", "HTMLElement", "HTMLInputElement", "Element", "Node", "Event", "CustomEvent"] as const) vi.stubGlobal(key, key === "window" ? dom.window : dom.window[key]);
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    fixture.lang = "fa"; fixture.readError=false; fixture.rpcError=null; fixture.rpc.mockReset();
    fixture.rows = [{ recipient_id: "guest", response: "invited", revoked_at: null }];
    host = dom.window.document.getElementById("root")!;
    root = createRoot(host); qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  }, 30_000);
  afterEach(async () => { if (root) await act(async () => root.unmount()); qc?.clear(); vi.unstubAllGlobals(); });
  async function render(isHost=false, open=true) {
    await act(async () => { root.render(createElement(QueryClientProvider, { client: qc }, createElement(PrivateGatheringInvitations, { gatheringId: "event", userId: isHost ? "host" : "guest", isHost, open }))); });
    await act(async () => { await new Promise(resolve => setTimeout(resolve,30)); });
  }
  it.each(["fa","en"])("shows translated RSVP and sends recipient response in %s", async lang => {
    fixture.lang=lang; await render();
    const button = Array.from(host.querySelectorAll("button")).find(b=>b.textContent===privateGatheringCopy[lang]["private.going"])!;
    expect(button).toBeTruthy();
    await act(async () => button.click());
    expect(fixture.rpc).toHaveBeenCalledWith("respond_gathering_invitation", { _id: "event", _response: "going" });
  });
  it("does not send a response for closed events", async () => {
    await render(false,false); expect(Array.from(host.querySelectorAll("button")).every(b=>b.disabled)).toBe(true);
    expect(fixture.rpc).not.toHaveBeenCalled();
  });
  it("allows the host to revoke the exact guest", async () => {
    await render(true);
    const button = Array.from(host.querySelectorAll("button")).find(b=>b.textContent===privateGatheringCopy.fa["private.revoke"])!;
    await act(async () => button.click());
    expect(fixture.rpc).toHaveBeenCalledWith("revoke_gathering_invitation", { _id: "event", _recipient: "guest" });
  });
  it("keeps the previous response and enables retry after capacity failure", async () => {
    fixture.rpcError={message:"GATHERING_FULL"}; await render();
    const button = Array.from(host.querySelectorAll("button")).find(b=>b.textContent===privateGatheringCopy.fa["private.going"])!;
    await act(async () => button.click());
    expect(button.disabled).toBe(false); expect(button.getAttribute("aria-pressed")).toBe("false");
  });
  it("shows a retry action when invitation loading fails", async () => {
    fixture.readError=true; await render(); expect(host.querySelector('[role="alert"]')?.textContent).toContain(privateGatheringCopy.fa["private.retry"]);
  });
});
