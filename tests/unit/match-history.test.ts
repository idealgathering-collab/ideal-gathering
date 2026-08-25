import { describe, expect, it } from "vitest";
import {
  avoidBandsFromHistory,
  learnedEnergyFactor,
  parseReasons,
  personHistoryFactor,
} from "@/lib/match-history";

describe("parseReasons", () => {
  it("keeps only known tags", () => {
    expect(parseReasons(["vibe", "nope", "attitude"])).toEqual(["vibe", "attitude"]);
  });
});

describe("personHistoryFactor", () => {
  it("is 1 when nobody at the table has been rated", () => {
    expect(personHistoryFactor(["a"], new Map())).toBe(1);
  });

  it("crushes a table that includes someone they rated 1–2", () => {
    const ratings = new Map([["a", { score: 1, reasons: ["vibe" as const] }]]);
    expect(personHistoryFactor(["a", "b"], ratings)).toBe(0.08);
  });

  it("soft-warns on a 3-star person", () => {
    const ratings = new Map([["a", { score: 3, reasons: ["conversation" as const] }]]);
    expect(personHistoryFactor(["a"], ratings)).toBe(0.85);
  });
});

describe("learnedEnergyFactor", () => {
  it("avoids the energy cluster they already disliked", () => {
    const avoid = avoidBandsFromHistory([
      { score: 1, reasons: ["vibe"], energy: "outgoing" },
      { score: 2, reasons: ["attitude"], energy: "outgoing" },
    ]);
    expect(learnedEnergyFactor(avoid, ["outgoing", "outgoing", "mixed"])).toBe(0.32);
  });

  it("does not punish a reserved table for an outgoing miss", () => {
    const avoid = avoidBandsFromHistory([{ score: 1, reasons: ["vibe"], energy: "outgoing" }]);
    expect(learnedEnergyFactor(avoid, ["reserved", "reserved"])).toBe(1);
  });
});
