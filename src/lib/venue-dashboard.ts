import { z } from "zod";
import { GATHERING_TYPES } from "./gathering-types";
const count = z.number().int().nonnegative().safe();
const date = z.string().datetime({ offset: true });
const category = z.enum([...GATHERING_TYPES, "other"]);
const gathering = z
  .object({
    id: z.string().uuid(),
    title: z.string(),
    starts_at: date,
    ends_at: date,
    category,
    capacity: count,
    participants: count,
    verified: count,
    venue_hosted: z.boolean(),
    can_open: z.boolean(),
    status: z.enum(["upcoming", "ongoing", "completed"]),
  })
  .strict();
export const venueDashboardSchema = z
  .object({
    period_start: date,
    period_end: date,
    upcoming_until: date,
    upcoming_count: count,
    completed_count: count,
    visits: count,
    unique_visitors: count,
    new_visitors: count,
    returning_visitors: count,
    average_attendance: z.number().nonnegative().nullable(),
    categories: z.array(z.object({ category, count }).strict()).max(12).nullable(),
    periods: z.array(z.object({ start: date, end: date, visits: count }).strict()).length(3),
    upcoming: z.array(gathering).max(20),
    completed: z.array(gathering).max(20),
  })
  .strict();
export type VenueDashboardData = z.infer<typeof venueDashboardSchema>;
export type VenueGathering = z.infer<typeof gathering>;
