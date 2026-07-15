import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthed, errorResult } from "../supabase";

export default defineTool({
  name: "list_upcoming_gatherings",
  title: "List upcoming gatherings",
  description:
    "List approved upcoming gatherings at partner cafes/restaurants, ordered by start time. Optionally filter by city or a text search over the subject.",
  inputSchema: {
    city: z.string().optional().describe("Filter by venue city (e.g. Istanbul)."),
    search: z.string().optional().describe("Case-insensitive substring match on the gathering subject."),
    limit: z.number().int().min(1).max(50).optional().describe("Max rows to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ city, search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("gatherings")
      .select(
        "id, subject, description, starts_at, seats, business:businesses(id,name,city), table:venue_tables(id,label), gathering_attendees(user_id)",
      )
      .eq("status", "approved")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(limit ?? 20);
    if (search) q = q.ilike("subject", `%${search}%`);
    const { data, error } = await q;
    if (error) return errorResult(error.message);
    const rows = (data ?? [])
      .filter((r) => !city || r.business?.city?.toLowerCase() === city.toLowerCase())
      .map((r) => ({
        id: r.id,
        subject: r.subject,
        description: r.description,
        starts_at: r.starts_at,
        seats: r.seats,
        attendees: (r.gathering_attendees as Array<unknown> | null)?.length ?? 0,
        venue: r.business ? { id: r.business.id, name: r.business.name, city: r.business.city } : null,
        table: r.table ? { id: r.table.id, label: r.table.label } : null,
      }));
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { gatherings: rows },
    };
  },
});
