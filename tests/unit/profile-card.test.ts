import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  PROFILE_SECTORS,
  isProfileSector,
  sectorOrder,
} from "@/lib/profile-sectors";
import {
  getInterestVisual,
  getInterestVisualSmall,
  getInterestVisualMedium,
} from "@/lib/interest-visuals";
import {
  getIntentionVisual,
  getIntentionVisualSmall,
  getIntentionVisualMedium,
} from "@/lib/intention-visuals";
import {
  hasAuraData,
  hasStyleData,
  getDisplayName,
  getLocationString,
} from "@/lib/profile-card.functions";
import type { ProfileCardData, ProfileCardAura, ProfileCardStyle } from "@/lib/profile-card";

// Mock the translations
vi.mock("@/i18n", () => ({
  useT: () => (key: string) => key,
}));

describe("Profile Sectors", () => {
  describe("PROFILE_SECTORS", () => {
    it("should have all 5 sectors in correct order", () => {
      expect(PROFILE_SECTORS).toEqual(["aura", "style", "loves", "here", "story"]);
    });

    it("should not include trust sector", () => {
      expect(PROFILE_SECTORS).not.toContain("trust");
    });
  });

  describe("isProfileSector", () => {
    it("should return true for valid sectors", () => {
      PROFILE_SECTORS.forEach((sector) => {
        expect(isProfileSector(sector)).toBe(true);
      });
    });

    it("should return false for invalid sectors", () => {
      expect(isProfileSector("trust")).toBe(false);
      expect(isProfileSector("invalid")).toBe(false);
      expect(isProfileSector("")).toBe(false);
    });
  });

  describe("sectorOrder", () => {
    it("should return correct order index", () => {
      expect(sectorOrder("aura")).toBe(0);
      expect(sectorOrder("style")).toBe(1);
      expect(sectorOrder("loves")).toBe(2);
      expect(sectorOrder("here")).toBe(3);
      expect(sectorOrder("story")).toBe(4);
    });
  });
});

describe("Interest Visuals", () => {
  describe("getInterestVisual", () => {
    it("should return a valid URL for known interests", () => {
      const url = getInterestVisual("music");
      expect(url).toBeTypeOf("string");
      expect(url).toContain("https://images.unsplash.com");
    });

    it("should return fallback URL for unknown interests", () => {
      const url = getInterestVisual("unknown_interest_xyz");
      expect(url).toBeTypeOf("string");
      expect(url).toContain("https://images.unsplash.com");
    });
  });

  describe("getInterestVisualSmall", () => {
    it("should return URL with small width", () => {
      const url = getInterestVisualSmall("music");
      expect(url).toContain("w=200");
    });
  });

  describe("getInterestVisualMedium", () => {
    it("should return URL with medium width", () => {
      const url = getInterestVisualMedium("music");
      expect(url).toContain("w=400");
    });
  });
});

describe("Intention Visuals", () => {
  describe("getIntentionVisual", () => {
    it("should return a valid URL for known intentions", () => {
      const url = getIntentionVisual("make_friends");
      expect(url).toBeTypeOf("string");
      expect(url).toContain("https://images.unsplash.com");
    });

    it("should return fallback URL for unknown intentions", () => {
      const url = getIntentionVisual("unknown_intention_xyz");
      expect(url).toBeTypeOf("string");
      expect(url).toContain("https://images.unsplash.com");
    });
  });

  describe("getIntentionVisualSmall", () => {
    it("should return URL with small width", () => {
      const url = getIntentionVisualSmall("make_friends");
      expect(url).toContain("w=200");
    });
  });

  describe("getIntentionVisualMedium", () => {
    it("should return URL with medium width", () => {
      const url = getIntentionVisualMedium("make_friends");
      expect(url).toContain("w=400");
    });
  });
});

describe("Guest Profile Functions", () => {
  describe("hasAuraData", () => {
    it("should return true when personaColor is present", () => {
      const aura: ProfileCardAura = {
        personaColor: "#FF0000",
        traitSpark: null,
        traitCuriosity: null,
        traitWarmth: null,
        traitDepth: null,
      };
      expect(hasAuraData(aura as unknown as ProfileCardData)).toBe(true);
    });

    it("should return true when any trait is present", () => {
      const aura: ProfileCardAura = {
        personaColor: null,
        traitSpark: 80,
        traitCuriosity: null,
        traitWarmth: null,
        traitDepth: null,
      };
      expect(hasAuraData(aura as unknown as ProfileCardData)).toBe(true);
    });

    it("should return false when all aura data is null", () => {
      const aura: ProfileCardAura = {
        personaColor: null,
        traitSpark: null,
        traitCuriosity: null,
        traitWarmth: null,
        traitDepth: null,
      };
      expect(hasAuraData(aura as unknown as ProfileCardData)).toBe(false);
    });
  });

  describe("hasStyleData", () => {
    it("should return true when any style preference is present", () => {
      const style: ProfileCardStyle = {
        energyLevel: "high",
        groupSize: null,
        talkStyle: null,
        newPeople: null,
      };
      expect(hasStyleData(style as unknown as ProfileCardData)).toBe(true);
    });

    it("should return false when all style data is null", () => {
      const style: ProfileCardStyle = {
        energyLevel: null,
        groupSize: null,
        talkStyle: null,
        newPeople: null,
      };
      expect(hasStyleData(style as unknown as ProfileCardData)).toBe(false);
    });
  });

  describe("getDisplayName", () => {
    it("should return displayName when present", () => {
      const profile: Partial<ProfileCardData> = {
        id: "1",
        displayName: "John Doe",
      };
      expect(getDisplayName(profile as ProfileCardData)).toBe("John Doe");
    });

    it("should fall back to the email local-part when displayName is null", () => {
      expect(getDisplayName({ displayName: null, email: "ani@example.com" })).toBe("ani");
    });

    it("should never say 'Guest' when there is no name or email", () => {
      const profile: Partial<ProfileCardData> = {
        id: "1",
        displayName: null,
      };
      expect(getDisplayName(profile as ProfileCardData)).toBe("New member");
    });



    it("should return 'Unknown' when profile is null", () => {
      expect(getDisplayName(null)).toBe("Unknown");
    });
  });

  describe("getLocationString", () => {
    it("should return formatted location string", () => {
      const profile: Partial<ProfileCardData> = {
        id: "1",
        city: "Istanbul",
        neighborhood: "Kadıköy",
        country: "Turkey",
      };
      expect(getLocationString(profile as ProfileCardData)).toBe("Kadıköy, Istanbul, Turkey");
    });

    it("should return null when no location data", () => {
      const profile: Partial<ProfileCardData> = {
        id: "1",
        city: null,
        neighborhood: null,
        country: null,
      };
      expect(getLocationString(profile as ProfileCardData)).toBeNull();
    });

    it("should handle partial location data", () => {
      const profile: Partial<ProfileCardData> = {
        id: "1",
        city: "Istanbul",
        neighborhood: null,
        country: null,
      };
      expect(getLocationString(profile as ProfileCardData)).toBe("Istanbul");
    });
  });
});
