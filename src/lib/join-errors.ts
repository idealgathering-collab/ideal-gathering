export type JoinFailureReason = "full" | "closed" | "already_joined" | "other";

export class JoinError extends Error {
  reason: JoinFailureReason;
  constructor(reason: JoinFailureReason, message: string) {
    super(message);
    this.name = "JoinError";
    this.reason = reason;
  }
}

/** Maps a Supabase/Postgres error from a gathering_attendees insert to a join failure reason. */
export function classifyJoinError(error: { code?: string | null; message?: string | null }): JoinFailureReason {
  if (error.code === "23505") return "already_joined";
  const msg = error.message ?? "";
  if (msg.includes("GATHERING_FULL")) return "full";
  if (msg.includes("GATHERING_CLOSED")) return "closed";
  return "other";
}
