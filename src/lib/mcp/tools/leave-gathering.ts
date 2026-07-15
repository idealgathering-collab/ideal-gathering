import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthed, errorResult } from "../supabase";

export default defineTool({
  name: "leave_gathering",
  title: "Leave a gathering",
  description: "Cancel the signed-in user's seat at a gathering.",
  inputSchema: {
    gathering_id: z.string().uuid().describe("The gathering UUID to leave."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ gathering_id }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const supabase = supabaseForUser(ctx);
    const { error } = await supabase
      .from("gathering_attendees")
      .delete()
      .eq("gathering_id", gathering_id)
      .eq("user_id", ctx.getUserId());
    if (error) return errorResult(error.message);
    return {
      content: [{ type: "text", text: `Left gathering ${gathering_id}.` }],
      structuredContent: { ok: true, gathering_id },
    };
  },
});
