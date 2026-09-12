import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../src/integrations/supabase/types";
import {
  assertOwner,
  assertPlatformOperations,
  hasPlatformOperations,
} from "../../src/lib/platform-authorization";

function context(data: unknown, error: unknown = null) {
  const rpc = vi.fn().mockResolvedValue({ data, error });
  return { supabase: { rpc } as unknown as SupabaseClient<Database>, userId: "caller", rpc };
}

describe("platform authorization", () => {
  it("accepts an authorized Owner", async () => {
    const caller = context(true);
    await expect(assertOwner(caller)).resolves.toBeUndefined();
    expect(caller.rpc).toHaveBeenCalledWith("is_owner", { _user_id: "caller" });
  });
  it("rejects Admin and member Owner access", async () => {
    await expect(assertOwner(context(false))).rejects.toThrow("Forbidden");
  });
  it("fails closed when the Owner check errors", async () => {
    await expect(assertOwner(context(true, { message: "offline" }))).rejects.toThrow("Forbidden");
  });
  it("accepts current platform permission", async () => {
    const caller = context(true);
    await expect(assertPlatformOperations(caller)).resolves.toBeUndefined();
    expect(caller.rpc).toHaveBeenCalledWith("has_platform_permission", {
      _permission: "platform_operations",
    });
  });
  it("rejects restricted Admin operations", async () => {
    await expect(assertPlatformOperations(context(false))).rejects.toThrow("Forbidden");
  });
  it("does not interpret missing or malformed permission responses as grants", async () => {
    for (const value of [null, undefined, "true", 1]) {
      await expect(hasPlatformOperations(context(value))).resolves.toBe(false);
    }
  });
  it("fails closed on permission lookup failure", async () => {
    await expect(hasPlatformOperations(context(true, { message: "offline" }))).rejects.toThrow(
      "Could not verify",
    );
  });
  it("rechecks permission on every operation after revocation", async () => {
    const caller = context(true);
    await assertPlatformOperations(caller);
    caller.rpc.mockResolvedValueOnce({ data: false, error: null });
    await expect(assertPlatformOperations(caller)).rejects.toThrow("Forbidden");
    expect(caller.rpc).toHaveBeenCalledTimes(2);
  });
});
