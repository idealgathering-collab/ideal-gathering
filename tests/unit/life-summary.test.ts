import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/i18n";
import { lifeSummaryCopy } from "@/i18n/life-summary";
import { lifeSummarySchema } from "@/lib/life-summary";
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/life-summary.functions", () => ({ loadOwnLifeSummary: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: { to: string; children: string }) =>
    createElement("a", { href: to }, children),
}));
import { LifeSummarySection } from "@/components/life-summary";
const period_start = "2026-08-27T12:00:00Z",
  period_end = "2026-09-26T12:00:00Z";
const data = {
  period_start,
  period_end,
  gatherings: 6,
  moments: 4,
  categories: [{ category: "coffee", count: 6 }],
  periods: [
    { start: period_start, end: "2026-09-06T12:00:00Z", gatherings: 1 },
    { start: "2026-09-06T12:00:00Z", end: "2026-09-16T12:00:00Z", gatherings: 2 },
    { start: "2026-09-16T12:00:00Z", end: period_end, gatherings: 3 },
  ],
};
const key = ["life-summary", "owner"];
const client = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false, retryOnMount: false, gcTime: Infinity } },
  });
function render(q: QueryClient, userId = "owner") {
  return renderToStaticMarkup(
    createElement(
      LanguageProvider,
      null,
      createElement(
        QueryClientProvider,
        { client: q },
        createElement(LifeSummarySection, { userId }),
      ),
    ),
  );
}
describe("private Life Summary", () => {
  it("renders period, metrics, stored categories and explainable breakdown", () => {
    const q = client();
    q.setQueryData(key, data);
    const html = render(q);
    for (const text of [
      "Your recent life",
      "Last 30 days",
      "Moments saved",
      "What you’ve been doing",
      "three 10-day periods",
      "How this is counted",
      "not lifetime totals",
      "Only you",
    ])
      expect(html).toContain(text);
    expect(html).not.toContain("life score");
  });
  it("empty is supportive without a wall of zeroes", () => {
    const q = client();
    q.setQueryData(key, { ...data, gatherings: 0, moments: 0, categories: [] });
    const html = render(q);
    expect(html).toContain("There’s room for a new memory");
    expect(html).not.toContain("<dd");
    expect(html).not.toContain("three 10-day periods");
  });
  it("loading is not an empty summary", () => {
    const html = render(client());
    expect(html).toContain("Loading profile");
    expect(html).not.toContain("There’s room");
  });
  it("failed refresh does not show stale totals or internal errors", async () => {
    const q = client();
    q.setQueryData(key, data);
    await q
      .fetchQuery({
        queryKey: key,
        queryFn: () => Promise.reject(Error("private database detail")),
      })
      .catch(() => {});
    const html = render(q);
    expect(html).toContain("Try again");
    expect(html).not.toContain("private database detail");
    expect(html).not.toContain("<dd");
  });
  it("account cache isolation", () => {
    const q = client();
    q.setQueryData(key, data);
    expect(render(q, "other")).not.toContain("What you’ve been doing");
  });
  it("rejects raw row fields and malformed aggregate numbers", () => {
    expect(lifeSummarySchema.safeParse(data).success).toBe(true);
    expect(lifeSummarySchema.safeParse({ ...data, user_id: "private" }).success).toBe(false);
    expect(lifeSummarySchema.safeParse({ ...data, moments: -1 }).success).toBe(false);
  });
  it("supports EN RU FA copy", () => {
    for (const lang of ["ru", "fa"] as const)
      expect(Object.keys(lifeSummaryCopy[lang]).sort()).toEqual(
        Object.keys(lifeSummaryCopy.en).sort(),
      );
  });
});
