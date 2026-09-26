import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { lifeSummarySchema } from "./life-summary";

/** No target ID or caller-selected dates: SQL derives scope from the verified JWT. */
export const loadOwnLifeSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value: unknown) => z.object({}).strict().parse(value))
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("get_my_life_summary");
    if (error) throw new Error("Summary unavailable");
    const parsed = lifeSummarySchema.safeParse(data);
    if (!parsed.success) throw new Error("Summary unavailable");
    return parsed.data;
  });
