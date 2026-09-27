import { describe, it, expect, vi } from "vitest";
import { createElement, type ComponentType, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { clampVenueSeats } from "@/lib/venue-activation";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
  useNavigate: () => vi.fn(),
  ClientOnly: ({ children }: { children: ReactNode }) => children,
  Link: ({ children }: { children: ReactNode }) => createElement("a", null, children),
}));
vi.mock("@/hooks/use-session", () => ({
  useSession: () => ({ user: { id: "venue", email_confirmed_at: "2026-01-01" }, loading: false }),
}));
vi.mock("@/i18n", () => ({ useT: () => (key: string) => key }));
vi.mock("@/components/language-switcher", () => ({ LanguageSwitcher: () => null }));
vi.mock("@/components/notifications-bell", () => ({ NotificationsBell: () => null }));
vi.mock("@/lib/beta-gate", () => ({
  requireVenueAccess: vi.fn(),
  requireVenueRegistrationAccess: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/components/venue-value-dashboard", () => ({
  VenueValueDashboard: ({ profile }: { profile: ReactNode }) => profile,
}));
const fixture = vi.hoisted(() => ({ status: "approved" }));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({}),
  useQuery: ({ queryKey }: { queryKey: string[] }) => ({
    data:
      queryKey[0] === "access-state"
        ? { hasVenueAccess: true }
        : {
            id: "business",
            owner_id: "venue",
            name: "Yerevan café",
            description: "A local café",
            address: "Abovyan 12",
            city: "Yerevan",
            lat: 40.18,
            lng: 44.51,
            street_number: "12",
            description_extra: "Ground floor",
            phone: "12345",
            mobile: "12345",
            cover_url: "",
            menu_link: "",
            status: fixture.status,
          },
    isLoading: false,
  }),
}));
// Keep the real picker and both route forms; intercept only its search boundary.
vi.mock("@/components/location-autocomplete", () => ({
  LocationAutocomplete: ({ countryCodes }: { countryCodes: string }) =>
    createElement("span", { "data-search-country": countryCodes }),
}));
import { Route as RegisterRoute } from "@/routes/venue.register";
import { Route as DashboardRoute } from "@/routes/venue.dashboard";
function renderRoute(route: unknown) {
  return renderToStaticMarkup(
    createElement((route as { options: { component: ComponentType } }).options.component),
  );
}
describe("venue Yerevan launch corrections", () => {
  it("registration searches Armenia through the real shared picker", () => {
    expect(renderRoute(RegisterRoute)).toContain('data-search-country="am"');
  });
  for (const status of ["approved", "pending", "rejected"]) {
    it(status + " business profile editing searches Armenia", () => {
      fixture.status = status;
      const html = renderRoute(DashboardRoute);
      expect(html).toContain('data-search-country="am"');
      expect(html).toContain("Abovyan 12");
    });
  }
  it.each([
    [-10, 2],
    [0, 2],
    [1, 2],
    [2, 2],
    [4, 4],
    [5, 5],
    [6, 5],
    [30, 5],
    [4.8, 4],
    [NaN, 4],
    [Infinity, 4],
  ])("bounds activation input %s to %s", (input, expected) => {
    expect(clampVenueSeats(input)).toBe(expected);
  });
  it("wires native seat bounds and the defensive clamp into the activation form", () => {
    const source = readFileSync(
      new URL("../../src/routes/venue.dashboard.tsx", import.meta.url),
      "utf8",
    );
    const activation = source.slice(source.indexOf("function ActivateDialog"));
    expect(activation).toContain("seats: clampVenueSeats(seats)");
    expect(activation).toContain("min={VENUE_MIN_SEATS}");
    expect(activation).toContain("max={VENUE_MAX_SEATS}");
    expect(activation).toContain("step={1}");
    expect(activation).not.toContain("Math.min(30");
  });
});
