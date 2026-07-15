import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthed, errorResult, requireUserId } from "../supabase";

export default defineTool({
  name: "my_gatherings",
  title: "My gatherings",
  description: "List gatherings the signed-in user is hosting, attending, or both.",
  inputSchema: {
    role: z.enum(["hosting", "attending", "all"]).optional().describe("Filter by relationship (default all)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ role }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const supabase = supabaseForUser(ctx);
    const userId = requireUserId(ctx);
    const r = role ?? "all";

    const hosting =
      r === "hosting" || r === "all"
        ? await supabase
            .from("gatherings")
            .select("id, subject, starts_at, status, seats, business:businesses(name,city)")
            .eq("host_id", userId)
            .order("starts_at", { ascending: true })
        : null;

    const attendingIds =
      r === "attending" || r === "all"
        ? await supabase
            .from("gathering_attendees")
            .select("gathering_id")
            .eq("user_id", userId)
        : null;

    let attending: unknown[] = [];
    if (attendingIds && attendingIds.data && attendingIds.data.length) {
      const ids = attendingIds.data.map((row) => row.gathering_id);
      const { data, error } = await supabase
        .from("gatherings")
        .select("id, subject, starts_at, status, seats, business:businesses(name,city)")
        .in("id", ids)
        .order("starts_at", { ascending: true });
      if (error) return errorResult(error.message);
      attending = data ?? [];
    }
    if (hosting?.error) return errorResult(hosting.error.message);

    const result = {
      hosting: hosting?.data ?? [],
      attending,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});
