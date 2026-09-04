import { describe, it, expect } from "vitest";
import { areaForPoint, areaLabel, isYerevan, YEREVAN_AREA_NAMES } from "@/lib/yerevan-areas";

describe("yerevan areas", () => {
  it("resolves a central pin to Cascade", () => {
    expect(areaForPoint(40.19, 44.5155)).toBe("Cascade");
  });

  it("resolves a district pin", () => {
    expect(areaForPoint(40.205, 44.496)).toBe("Arabkir");
  });

  it("returns null far outside the city", () => {
    expect(areaForPoint(41.01, 28.97)).toBeNull();
  });

  it("labels areas per language", () => {
    expect(areaLabel("Kentron", "ru")).toBe("Кентрон");
    expect(areaLabel("Unknown", "en")).toBe("Unknown");
  });

  it("detects Yerevan by name", () => {
    expect(isYerevan("Yerevan")).toBe(true);
    expect(isYerevan("Ереван")).toBe(true);
    expect(isYerevan("Gyumri")).toBe(false);
  });

  it("exposes a non-empty area list", () => {
    expect(YEREVAN_AREA_NAMES.length).toBeGreaterThan(10);
  });
});
