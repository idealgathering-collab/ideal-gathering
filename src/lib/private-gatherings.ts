import { z } from "zod";
import { ageFromDob } from "@/lib/age";

export const rsvpResponse = z.enum(["going", "maybe", "declined"]);
export const privateGatheringSchema = z.object({
  subject: z.string().trim().min(3).max(120),
  description: z.string().trim().max(800),
  venue_name: z.string().trim().min(2).max(160),
  address: z.string().trim().max(240),
  starts_at: z.string().datetime({ offset: true }),
  seats: z.number().int().min(2).max(30),
}).refine((v) => new Date(v.starts_at).getTime() > Date.now(), { path: ["starts_at"], message: "future" });

export function canUsePrivateGatherings(dob: string | null | undefined, now = new Date()) {
  const age = ageFromDob(dob, now);
  return age !== null && age >= 18;
}

export function privateGatheringError(error: unknown): string {
  const message = error && typeof error === "object" && "message" in error ? String(error.message) : "";
  if (message.includes("GATHERING_FULL")) return "private.full";
  if (message.includes("PRIVATE_ADULT_REQUIRED")) return "private.adultRequired";
  if (message.includes("PRIVATE_INVITEE_UNAVAILABLE")) return "private.unavailable";
  if (message.includes("PRIVATE_CLOSED")) return "private.closed";
  return "private.failed";
}
