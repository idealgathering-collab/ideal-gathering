import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/i18n";
import { venueValueCopy } from "@/i18n/venue-value";
import { venueDashboardSchema } from "@/lib/venue-dashboard";
import { venueData, emptyVenueData } from "../fixtures/venue-dashboard";
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/venue-dashboard.functions", () => ({ loadVenueDashboard: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: string; to: string }) =>
    createElement("a", { href: to }, children),
}));
import { VenueValueContent, VenueValueDashboard } from "@/components/venue-value-dashboard";
const key = ["venue-value", "owner", "venue", false, 0, 0];
const client = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false, retryOnMount: false, gcTime: Infinity } },
  });
function renderContent(
  data = venueData,
  section: "overview" | "visitors" | "gatherings" = "overview",
) {
  return renderToStaticMarkup(
    createElement(LanguageProvider, null, createElement(VenueValueContent, { data, section })),
  );
}
function render(q: QueryClient, userId = "owner", preview = false) {
  return renderToStaticMarkup(
    createElement(
      LanguageProvider,
      null,
      createElement(
        QueryClientProvider,
        { client: q },
        createElement(VenueValueDashboard, {
          userId,
          businessId: "venue",
          preview,
          profile: "Profile editor",
          tables: "Table editor",
          menu: "Menu editor",
        }),
      ),
    ),
  );
}
describe("venue value dashboard", () => {
  it("prioritizes activity, real visits and recent results", () => {
    const html = renderContent();
    expect(html.indexOf("Upcoming &amp; happening now")).toBeLessThan(
      html.indexOf("What Ideal Gathering brought"),
    );
    for (const text of [
      "Coffee and good conversation",
      "Verified visits",
      "Unique visitors",
      "Sunday coffee",
      "Last 30 days",
    ])
      expect(html).toContain(text);
    for (const text of ["78%", "43 people", "utilization", "email", "checkin_lat"])
      expect(html).not.toContain(text);
  });
  it("new and returning definitions are explicit", () => {
    const html = renderContent(venueData, "visitors");
    for (const text of [
      "New through",
      "Returning through",
      "These groups are distinct",
      "not all your customers",
      "Average verified attendance",
    ])
      expect(html).toContain(text);
  });
  it("empty and insufficient activity stay honest", () => {
    const html = renderContent(emptyVenueData, "visitors");
    expect(html).toContain("after your first attended gathering");
    expect(html).toContain("More activity is needed");
    expect(html).not.toContain("<dd");
  });
  it("venue details do not link into consumer permissions", () => {
    const html = renderContent(venueData, "gatherings");
    expect(html).toContain("Gathering details");
    expect(html).not.toContain("Open gathering");
  });
  it("has all six sections without mounting management on overview", () => {
    const q = client();
    q.setQueryData(key, venueData);
    const html = render(q);
    for (const section of ["Overview", "Gatherings", "Visitors", "My Venue", "Tables", "Menu"])
      expect(html).toContain(section);
    expect(html).not.toContain("Profile editor");
  });
  it("loading gates management", () => {
    const html = render(client());
    expect(html).toContain('role="status"');
    expect(html).not.toContain("Profile editor");
  });
  it("failed reauthorization hides cached analytics and management", async () => {
    const q = client();
    q.setQueryData(key, venueData);
    await q
      .fetchQuery({ queryKey: key, queryFn: () => Promise.reject(Error("PRIVATE")) })
      .catch(() => {});
    const html = render(q);
    expect(html).toContain("Try again");
    expect(html).not.toContain("PRIVATE");
    expect(html).not.toContain("Verified visits");
    expect(html).not.toContain("Profile editor");
  });
  it("cache isolation includes account and preview context", () => {
    const q = client();
    q.setQueryData(key, venueData);
    expect(render(q, "another")).not.toContain("Verified visits");
    expect(render(q, "owner", true)).not.toContain("Verified visits");
  });
  it("aggregate schema rejects raw fields and invalid counts", () => {
    expect(venueDashboardSchema.safeParse(venueData).success).toBe(true);
    expect(venueDashboardSchema.safeParse({ ...venueData, email: "PRIVATE" }).success).toBe(false);
    expect(venueDashboardSchema.safeParse({ ...venueData, visits: -1 }).success).toBe(false);
  });
  it("all core copy exists in English Russian and Persian", () => {
    for (const lang of ["ru", "fa"] as const)
      expect(Object.keys(venueValueCopy[lang]).sort()).toEqual(
        Object.keys(venueValueCopy.en).sort(),
      );
  });
});
