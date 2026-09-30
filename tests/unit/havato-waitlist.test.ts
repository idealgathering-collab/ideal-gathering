import { describe, expect, it, vi } from "vitest";
import { havatoWaitlistSchema, joinHavatoWaitlist } from "../../src/lib/havato-waitlist";
describe("Havato public waitlist", () => {
  it("rejects empty names and phone-only input", () => {
    expect(havatoWaitlistSchema.safeParse({ name: " ", email: "person@example.com" }).success).toBe(
      false,
    );
    expect(havatoWaitlistSchema.safeParse({ name: "Someone", email: "09123456789" }).success).toBe(
      false,
    );
  });
  it("submits normalized values through the existing contract", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    expect(
      await joinHavatoWaitlist({ name: "  Someone  ", email: " PERSON@example.com " }, insert),
    ).toBe("joined");
    expect(insert).toHaveBeenCalledWith({
      name: "Someone",
      email: "person@example.com",
      city: null,
      interests: null,
    });
  });
  it("accepts existing entries but surfaces backend failures", async () => {
    const form = { name: "Someone", email: "person@example.com" };
    expect(await joinHavatoWaitlist(form, async () => ({ error: { code: "23505" } }))).toBe(
      "existing",
    );
    await expect(
      joinHavatoWaitlist(form, async () => ({ error: { code: "42501" } })),
    ).rejects.toEqual({ code: "42501" });
  });
});
