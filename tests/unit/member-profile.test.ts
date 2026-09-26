import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/i18n";
import { memberProfileCopy } from "@/i18n/member-profile";
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/public-profile.functions", () => ({ loadPublicProfile: vi.fn() }));
vi.mock("@/lib/life-moments.functions", () => ({ loadVisibleLifeMoments: vi.fn() }));
vi.mock("@/lib/moderation.functions", () => ({
  blockUser: vi.fn(),
  submitReport: vi.fn(),
  REPORT_REASONS: ["harassment"],
}));
import { MemberProfile } from "@/components/member-profile";
const key = ["member-profile", "viewer", "target"];
const profile = {
  display_name: "Member <script>",
  city: "Yerevan",
  interests: ["Coffee"],
  bio: "A short introduction",
  avatar_url: null,
  energy_level: "calm",
  group_size: "small",
  talk_style: "deep",
  new_people_pref: "warm_up",
};
function client() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, retryOnMount: false, gcTime: Infinity } },
  });
}
function render(q: QueryClient, viewerId = "viewer", userId = "target") {
  return renderToStaticMarkup(
    createElement(
      LanguageProvider,
      null,
      createElement(
        QueryClientProvider,
        { client: q },
        createElement(MemberProfile, { viewerId, userId }),
      ),
    ),
  );
}
describe("in-app member profile", () => {
  it("loading does not imply empty activity", () => {
    const html = render(client());
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain("No shared moments");
  });
  it("renders identity, social style, empty activity and safety without editing", () => {
    const q = client();
    q.setQueryData(key, { profile, moments: [] });
    const html = render(q);
    for (const value of [
      "Member &lt;script&gt;",
      "Yerevan",
      "Coffee",
      "Shared context",
      "No shared moments to show",
      "Report",
      "Block",
      "A short introduction",
    ])
      expect(html).toContain(value);
    for (const value of ["Edit profile", "Edit moment", "Match", "date_of_birth"])
      expect(html).not.toContain(value);
  });
  it("shows only moment presentation fields even if unexpected fields are supplied", () => {
    const q = client();
    q.setQueryData(key, {
      profile,
      moments: [
        {
          id: "one",
          title: "Shared memory",
          happened_at: "2020-01-01",
          photoUrl: null,
          note: "PRIVATE NOTE",
          gathering_id: "SOURCE ID",
          photo_path: "PRIVATE PATH",
        },
      ],
    });
    const html = render(q);
    expect(html).toContain("Shared memory");
    for (const value of ["PRIVATE NOTE", "SOURCE ID", "PRIVATE PATH"])
      expect(html).not.toContain(value);
  });
  it("missing and failed reads use the same unavailable state", async () => {
    const missing = client();
    missing.setQueryData(key, null);
    expect(render(missing)).toContain(memberProfileCopy.en["member.unavailable"]);
    const failed = client();
    await failed
      .fetchQuery({ queryKey: key, queryFn: () => Promise.reject(Error("PRIVATE REASON")) })
      .catch(() => {});
    const html = render(failed);
    expect(html).toContain(memberProfileCopy.en["member.unavailable"]);
    expect(html).not.toContain("PRIVATE REASON");
  });
  it("does not reuse another account or target's cached profile", () => {
    const q = client();
    q.setQueryData(key, { profile, moments: [] });
    expect(render(q, "another")).not.toContain("A short introduction");
    expect(render(q, "viewer", "another")).not.toContain("A short introduction");
  });
  it("every supported language has complete member copy", () => {
    for (const lang of ["ru", "fa"] as const)
      expect(Object.keys(memberProfileCopy[lang]).sort()).toEqual(
        Object.keys(memberProfileCopy.en).sort(),
      );
  });
});
