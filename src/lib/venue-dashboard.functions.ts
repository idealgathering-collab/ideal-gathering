import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { venueDashboardSchema } from "./venue-dashboard";

export const loadVenueDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value: unknown) =>
    z
      .object({
        businessId: z.string().uuid().optional(),
        upcomingPage: z.number().int().min(0).max(10000).default(0),
        completedPage: z.number().int().min(0).max(10000).default(0),
      })
      .strict()
      .parse(value),
  )
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("get_venue_dashboard", {
      _business_id: data.businessId,
      _upcoming_page: data.upcomingPage,
      _completed_page: data.completedPage,
    });
    const parsed = venueDashboardSchema.safeParse(result);
    if (error || !parsed.success) throw new Error("Dashboard unavailable");
    return parsed.data;
  });
