import { describe, expect, it } from "vitest";
import { formatDistance, haversineKm } from "@/lib/geolocation";

describe("haversineKm", () => {
  it("is zero for the same point", () => {
    expect(haversineKm({ lat: 41.0082, lng: 28.9784 }, { lat: 41.0082, lng: 28.9784 })).toBe(0);
  });

  it("matches the known Istanbul–Ankara distance", () => {
    const km = haversineKm({ lat: 41.0082, lng: 28.9784 }, { lat: 39.9334, lng: 32.8597 });
    expect(km).toBeGreaterThan(340);
    expect(km).toBeLessThan(360);
  });

  it("is symmetric", () => {
    const a = { lat: 40.1792, lng: 44.4991 };
    const b = { lat: 41.0082, lng: 28.9784 };
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 6);
  });

  it("handles negative longitudes and the antimeridian", () => {
    const km = haversineKm({ lat: 0, lng: 179.5 }, { lat: 0, lng: -179.5 });
    expect(km).toBeGreaterThan(100);
    expect(km).toBeLessThan(120);
  });
});

describe("formatDistance", () => {
  it("renders sub-kilometre distances in 10 m steps", () => {
    expect(formatDistance(0.084, "en")).toBe("80 m");
    expect(formatDistance(0.086, "en")).toBe("90 m");
  });

  it("never goes below 10 m", () => {
    expect(formatDistance(0.0001, "en")).toBe("10 m");
  });

  it("keeps one decimal below 10 km", () => {
    expect(formatDistance(2.34, "en")).toBe("2.3 km");
  });

  it("rounds to whole kilometres at 10 km and above", () => {
    expect(formatDistance(12.6, "en")).toBe("13 km");
  });

  it("uses the requested locale's digits", () => {
    expect(formatDistance(2.5, "fa")).toContain("km");
    expect(formatDistance(2.5, "fa")).not.toBe("2.5 km");
  });
});
