import { z } from "zod";
import { rsvpResponse } from "./private-gatherings";
import { guestTaskCommand, guestCoordinationState } from "./gathering-coordination";

export const guestToken = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
export const guestRequest = z.object({
  token: guestToken,
  adult: z.literal(true),
  response: rsvpResponse.optional(),
  name: z.string().trim().min(1).max(80).optional(),
  coordination: z.union([z.object({ operation: z.literal("list") }).strict(), guestTaskCommand]).optional(),
}).strict().refine((v) => (!v.response || Boolean(v.name)) && !(v.response && v.coordination));
export const guestDetails = z.object({
  subject: z.string(), starts_at: z.string(), venue_name: z.string().nullable(),
  address: z.string().nullable(), description: z.string().nullable(),
  response: z.enum(["invited", ...rsvpResponse.options]),
  guest_name: z.string().nullable(), expires_at: z.string(),
  coordination: guestCoordinationState.nullable().optional(),
});
export type GuestDetails = z.infer<typeof guestDetails>;
export const hostGuestRow = z.object({
  id: z.string().uuid(), label: z.string(), guest_name: z.string().nullable(),
  response: z.enum(["invited", ...rsvpResponse.options]), expires_at: z.string(),
  revoked_at: z.string().nullable(), created_at: z.string(),
});
export type HostGuestRow = z.infer<typeof hostGuestRow>;
export function guestErrorKey(code: string) {
  if (code === "full") return "private.full";
  if (code === "limited") return "guest.limited";
  if (code === "unavailable") return "guest.unavailable";
  return "private.failed";
}

export async function requestGuestInvitation(data: z.infer<typeof guestRequest>): Promise<GuestDetails> {
  const response = await fetch("/api/guest-invitation", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(guestRequest.parse(data)), cache: "no-store", referrerPolicy: "no-referrer",
  });
  const body = await response.json();
  if (!response.ok) throw new Error(typeof body.code === "string" ? body.code : "failed");
  return guestDetails.parse(body);
}
