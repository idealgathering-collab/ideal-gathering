import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/i18n";
import { lifeProfileCopy } from "@/i18n/life-profile";
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: { to: string; children: string }) =>
    createElement("a", { href: to }, children),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/lib/life-moments.functions", () => ({
  loadOwnLifeMoments: vi.fn(),
  loadGatheringLifeMoment: vi.fn(),
  createLifeMoment: vi.fn(),
  updateLifeMoment: vi.fn(),
  createLifeMomentPhotoUpload: vi.fn(),
}));
vi.mock("@/lib/life-profile.functions", () => ({ loadOwnLifeGatherings: vi.fn() }));
import { LifeProfileActivity } from "@/components/life-profile";

function render(client: QueryClient, userId = "owner") {
  return renderToStaticMarkup(
    createElement(
      LanguageProvider,
      null,
      createElement(
        QueryClientProvider,
        { client },
        createElement(LifeProfileActivity, { userId }),
      ),
    ),
  );
}
function client() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, retryOnMount: false, gcTime: Infinity } },
  });
}
function seed(qc: QueryClient, moments: unknown[], gatherings: unknown[] = []) {
  qc.setQueryData(["life-profile-moments", "owner"], moments);
  qc.setQueryData(["life-profile-gatherings", "owner"], gatherings);
}
describe("own Life Profile rendering", () => {
  it("distinguishes loading from genuine empty counts", () => {
    const qc = client();
    const loading = render(qc);
    expect(loading).toContain("Loading");
    expect(loading).not.toContain("Your story has room");
    seed(qc, []);
    const empty = render(qc);
    expect(empty).toContain("Your story has room for its first moment");
    expect(empty).toContain("No eligible completed gatherings");
    expect(empty).toContain("No reliable place details");
    expect(empty).toContain('href="/my-gatherings"');
  });
  it("renders private/unlinked moments safely, with privacy and editing controls", () => {
    const qc = client();
    seed(qc, [
      {
        id: "one",
        gathering_id: null,
        title: "Historical title",
        happened_at: "2020-01-01T12:00:00Z",
        note: "<script>private</script>",
        visibility: "private",
        photo_path: "secret/private-path",
        photoUrl: null,
      },
    ]);
    const html = render(qc);
    expect(html).toContain("Historical title");
    expect(html).toContain("&lt;script&gt;private&lt;/script&gt;");
    expect(html).toContain("Edit moment");
    expect(html).toContain("Photo unavailable");
    expect(html).toContain("Private");
    expect(html).not.toContain("secret/private-path");
    expect(html).not.toContain('href="/gatherings/');
  });
  it("keeps account-scoped cached data out of another account's view", () => {
    const qc = client();
    seed(qc, [
      { id: "one", title: "Private title", happened_at: "2020-01-01", note: "Private note" },
    ]);
    expect(render(qc, "other")).not.toContain("Private title");
    expect(render(qc, "other")).not.toContain("Private note");
  });
  it("does not represent failed reads as zero activity", async () => {
    const qc = client();
    await qc
      .fetchQuery({
        queryKey: ["life-profile-moments", "owner"],
        queryFn: () => Promise.reject(Error("offline")),
      })
      .catch(() => {});
    const html = render(qc);
    expect(html).toContain("This section couldn’t load");
    expect(html).toContain("Try again");
    expect(html).not.toContain("Your story has room");
  });
  it("labels bounded counts and current places instead of implying lifetime visits", () => {
    const qc = client();
    seed(
      qc,
      [],
      [{ id: "g", title: "Gathering", happened_at: "2020-01-01", place: "Current café" }],
    );
    const html = render(qc);
    expect(html).toContain("not lifetime totals");
    expect(html).toContain("not a history of visits");
    expect(html).toContain("Current café");
  });
  it("provides the same Life Profile copy in every supported language", () => {
    expect(Object.keys(lifeProfileCopy.ru).sort()).toEqual(Object.keys(lifeProfileCopy.en).sort());
    expect(Object.keys(lifeProfileCopy.fa).sort()).toEqual(Object.keys(lifeProfileCopy.en).sort());
  });
});
