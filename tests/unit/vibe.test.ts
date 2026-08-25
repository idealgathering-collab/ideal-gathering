import { describe, expect, it } from "vitest";
import {
  energyFromPref,
  energyFromSpark,
  interestJaccard,
  tableInterestScore,
  vibeFactor,
} from "@/lib/vibe";

describe("energyFromSpark", () => {
  it("treats high spark as outgoing and low spark as reserved", () => {
    expect(energyFromSpark(90)).toBe("outgoing");
    expect(energyFromSpark(45)).toBe("reserved");
    expect(energyFromSpark(70)).toBe("mixed");
  });
});

describe("energyFromPref", () => {
  it("maps calm/lively and ignores depends", () => {
    expect(energyFromPref("calm")).toBe("reserved");
    expect(energyFromPref("lively")).toBe("outgoing");
    expect(energyFromPref("mixed")).toBe("mixed");
    expect(energyFromPref("depends")).toBeNull();
    expect(energyFromPref(null)).toBeNull();
  });
});

describe("vibeFactor", () => {
  it("does not touch a mixed or unknown table — existing chemistry stays put", () => {
    expect(vibeFactor("mixed", ["mixed", "mixed"])).toBe(1);
    expect(vibeFactor("outgoing", [])).toBe(1);
    expect(vibeFactor(null, ["reserved"])).toBe(1);
  });

  it("keeps same-band tables at 1", () => {
    expect(vibeFactor("reserved", ["reserved", "reserved", "reserved"])).toBe(1);
    expect(vibeFactor("outgoing", ["outgoing", "outgoing"])).toBe(1);
  });

  it("penalizes dropping an outgoing person into a reserved majority", () => {
    const shyTable = ["reserved", "reserved", "reserved", "reserved", "reserved"] as const;
    expect(vibeFactor("outgoing", [...shyTable])).toBe(0.28);
  });

  it("penalizes the reverse — reserved guest, outgoing table", () => {
    expect(vibeFactor("reserved", ["outgoing", "outgoing", "outgoing"])).toBe(0.28);
  });

  it("lets a mixed guest sit anywhere without a clash penalty", () => {
    expect(vibeFactor("mixed", ["reserved", "reserved", "reserved"])).toBe(1);
  });
});

describe("interest overlap", () => {
  it("scores identical lists at 100", () => {
    expect(interestJaccard(["coffee", "books"], ["coffee", "books"])).toBe(100);
  });

  it("returns null when nobody at the table listed interests", () => {
    expect(tableInterestScore(["coffee"], [[], []])).toBeNull();
    expect(tableInterestScore([], [["coffee"]])).toBeNull();
  });
});
