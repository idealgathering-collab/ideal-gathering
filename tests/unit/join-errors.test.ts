import { describe, expect, it } from "vitest";
import { classifyJoinError, JoinError } from "@/lib/join-errors";

describe("classifyJoinError", () => {
  it("treats a unique violation as already joined", () => {
    expect(classifyJoinError({ code: "23505", message: "duplicate key" })).toBe("already_joined");
  });

  it("detects a full gathering", () => {
    expect(classifyJoinError({ message: "GATHERING_FULL: 4 of 4 seats taken" })).toBe("full");
  });

  it("detects a closed gathering", () => {
    expect(classifyJoinError({ message: "GATHERING_CLOSED" })).toBe("closed");
  });

  it("falls back to other", () => {
    expect(classifyJoinError({ code: "42501", message: "permission denied" })).toBe("other");
    expect(classifyJoinError({})).toBe("other");
  });
});

describe("JoinError", () => {
  it("carries the reason and message", () => {
    const err = new JoinError("full", "GATHERING_FULL");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("JoinError");
    expect(err.reason).toBe("full");
    expect(err.message).toBe("GATHERING_FULL");
  });
});
