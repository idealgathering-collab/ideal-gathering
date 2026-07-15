import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthed, errorResult } from "../supabase";

export default defineTool({
  name: "get_gathering",
  title: "Get gathering details",
  description: "Fetch full details for one gathering by ID, including venue, table, and attendee count.",
  inputSchema: {
    gathering_id: z.string().uuid().describe("The gathering UUID."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ gathering_id }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("gatherings")
      .select(
        "id, subject, description, starts_at, seats, status, host_id, business:businesses(id,name,city,address), table:venue_tables(id,label,capacity), gathering_attendees(user_id)",
      )
      .eq("id", gathering_id)
      .maybeSingle();
    if (error) return errorResult(error.message);
    if (!data) return errorResult("Gathering not found or not visible.");
    const attendees = (data.gathering_attendees as Array<{ user_id: string }> | null) ?? [];
    const result = {
      id: data.id,
      subject: data.subject,
      description: data.description,
      starts_at: data.starts_at,
      seats: data.seats,
      status: data.status,
      host_id: data.host_id,
      attendee_count: attendees.length,
      seats_remaining: Math.max(0, data.seats - attendees.length),
      user_is_attending: attendees.some((a) => a.user_id === ctx.getUserId()),
      venue: data.business,
      table: data.table,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});
