import { z } from "zod";
import { GATHERING_TYPES } from "./gathering-types";

const count = z.number().int().nonnegative().safe();
export const lifeSummarySchema = z
  .object({
    period_start: z.string().datetime({ offset: true }),
    period_end: z.string().datetime({ offset: true }),
    gatherings: count,
    moments: count,
    categories: z
      .array(
        z
          .object({
            category: z.enum([...GATHERING_TYPES, "other"]),
            count,
          })
          .strict(),
      )
      .max(GATHERING_TYPES.length + 1),
    periods: z
      .array(
        z
          .object({
            start: z.string().datetime({ offset: true }),
            end: z.string().datetime({ offset: true }),
            gatherings: count,
          })
          .strict(),
      )
      .length(3),
  })
  .strict();
export type LifeSummary = z.infer<typeof lifeSummarySchema>;
