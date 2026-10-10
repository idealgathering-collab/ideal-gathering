import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { coordinationCommand, coordinationState } from "./gathering-coordination";

export const manageGatheringCoordination = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => coordinationCommand.parse(v))
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("gathering_coordination", {
      _id: data.id,
      _action: data.action,
      _data: "data" in data ? data.data : {},
    });
    if (result.error) {
      const known = [
        "TASK_TAKEN",
        "COORDINATION_CONFLICT",
        "CURRENCY_MISMATCH",
        "COORDINATION_LIMIT",
      ];
      throw new Error(
        known.find((code) => result.error.message.includes(code)) ?? "COORDINATION_UNAVAILABLE",
      );
    }
    return coordinationState.parse(result.data);
  });
