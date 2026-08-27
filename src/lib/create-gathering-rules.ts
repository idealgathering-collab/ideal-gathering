import { z } from "zod";
import type { GatheringType } from "@/lib/gathering-types";

/** Sentinel value for the "add a new location" item in the location select. */
export const ADD_NEW_LOCATION = "__add";

/** Validation rules for the create-gathering form. Pure, so it can be unit tested. */
export const createGatheringSchema = z.object({
  location: z.string().min(1, "Pick a location"),
  subject: z.string().trim().min(3).max(120),
  description: z.string().trim().max(800).optional().or(z.literal("")),
  starts_at: z.string().min(1, "Pick a date & time"),
  seats: z.coerce.number().int().min(2).max(30),
  gathering_type: z.string().optional(),
});

export type CreateGatheringValues = z.infer<typeof createGatheringSchema>;

export type ParsedLocation =
  | { kind: "venue"; businessId: string; tableId: string }
  | { kind: "saved"; savedLocationId: string }
  | null;

/**
 * Parses the location select key.
 * `venue:<businessId>:<tableId>` or `saved:<savedLocationId>`; anything else is null.
 */
export function parseLocationKey(key: string): ParsedLocation {
  if (key.startsWith("venue:")) {
    const [, businessId, tableId] = key.split(":");
    if (!businessId || !tableId) return null;
    return { kind: "venue", businessId, tableId };
  }
  if (key.startsWith("saved:")) {
    const savedLocationId = key.slice("saved:".length);
    if (!savedLocationId) return null;
    return { kind: "saved", savedLocationId };
  }
  return null;
}

/** True when the chosen start time is still in the future. */
export function isFutureStart(startsAtIso: string, now: Date = new Date()) {
  const at = new Date(startsAtIso).getTime();
  return Number.isFinite(at) && at >= now.getTime();
}
