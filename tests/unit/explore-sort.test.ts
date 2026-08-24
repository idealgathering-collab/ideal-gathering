import { describe, it, expect } from "vitest";
import { sortGatherings, pickRecommended, isSortMode } from "@/lib/explore-sort";

const items = [
  { id: "a", starts_at: "2026-09-01T10:00:00Z", fit: 40, distanceKm: 5 },
  { id: "b", starts_at: "2026-08-30T10:00:00Z", fit: 92, distanceKm: null },
  { id: "c", starts_at: "2026-09-05T10:00:00Z", fit: null, distanceKm: 1 },
  { id: "d", starts_at: "2026-08-29T10:00:00Z", fit: 92, distanceKm: 9 },
];

describe("sortGatherings", () => {
  it("sorts by fit desc with soonest tie-break and unscored last", () => {
    expect(sortGatherings(items, "fit").map((i) => i.id)).toEqual(["d", "b", "a", "c"]);
  });

  it("sorts by start time", () => {
    expect(sortGatherings(items, "soon").map((i) => i.id)).toEqual(["d", "b", "a", "c"]);
  });

  it("sorts by distance with unlocated last", () => {
    expect(sortGatherings(items, "near").map((i) => i.id)).toEqual(["c", "a", "d", "b"]);
  });

  it("does not mutate the input", () => {
    const copy = [...items];
    sortGatherings(items, "fit");
    expect(items).toEqual(copy);
  });
});

describe("pickRecommended", () => {
  it("returns only scored tables, best first, capped", () => {
    expect(pickRecommended(items, 2).map((i) => i.id)).toEqual(["d", "b"]);
  });
});

describe("isSortMode", () => {
  it("accepts known modes only", () => {
    expect(isSortMode("fit")).toBe(true);
    expect(isSortMode("bogus")).toBe(false);
  });
});
