import { beforeEach, describe, expect, it, vi } from "vitest";
import { changedFields, completeOnboarding, saveProfileData } from "@/lib/profile-data";
const rpc = vi.hoisted(() => vi.fn());
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc } }));
beforeEach(() => {
  rpc.mockReset();
  rpc.mockResolvedValue({ data: true, error: null });
});

describe("profile/preference ownership and patch saves", () => {
  it("does not resend unchanged fields from a stale form snapshot", () => {
    expect(
      changedFields(
        { intentions: ["make_friends"], social_energy: "calm" },
        { intentions: ["make_friends"], social_energy: "lively" },
      ),
    ).toEqual({ social_energy: "lively" });
  });
  it("keeps deliberate empty and null changes", () => {
    expect(
      changedFields(
        { intentions: ["make_friends"], preferred_group_size: 4 as number | null },
        { intentions: [], preferred_group_size: null },
      ),
    ).toEqual({ intentions: [], preferred_group_size: null });
  });
  it("saves identity and only edited preferences in one self-targeted transaction", async () => {
    await saveProfileData(
      { bio: "new bio", social_links: { website: "https://example.invalid" } },
      { intentions: ["make_friends"] },
    );
    expect(rpc).toHaveBeenCalledExactlyOnceWith("save_my_profile_data", {
      _profile: { bio: "new bio", social_links: { website: "https://example.invalid" } },
      _preferences: { intentions: ["make_friends"] },
    });
  });
  it("onboarding completion atomically owns traits, marker and edited preferences only", async () => {
    await completeOnboarding(
      { social_energy: "lively" },
      { spark: 72.6, curiosity: 60, warmth: 70, depth: 80 },
    );
    const args = rpc.mock.calls[0][1];
    expect(args._profile).toEqual({
      onboarded_at: expect.any(String),
      trait_spark: 73,
      trait_curiosity: 60,
      trait_warmth: 70,
      trait_depth: 80,
      traits_updated_at: expect.any(String),
    });
    expect(args._preferences).toEqual({ social_energy: "lively" });
    expect(args._profile).not.toHaveProperty("display_name");
  });
  it("skipping does not resave a loaded preference snapshot or erase traits", async () => {
    await completeOnboarding({});
    expect(rpc.mock.calls[0][1]).toEqual({
      _profile: { onboarded_at: expect.any(String) },
      _preferences: {},
    });
  });
  it("propagates save failure instead of claiming successful completion", async () => {
    rpc.mockResolvedValue({ data: null, error: new Error("write failed") });
    await expect(completeOnboarding({ intentions: [] })).rejects.toThrow("write failed");
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  it("rejects a false success response", async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    await expect(saveProfileData({}, {})).rejects.toThrow("Profile was not saved");
  });
});
