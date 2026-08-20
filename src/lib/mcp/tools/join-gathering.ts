import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthed, errorResult, requireUserId } from "../supabase";

export default defineTool({
  name: "join_gathering",
  title: "Join a gathering",
  description:
    "Reserve a seat at a gathering as the signed-in user. Requires a verified email. Fails if the gathering is full or already joined.",
  inputSchema: {
    gathering_id: z.string().uuid().describe("The gathering UUID to join."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ gathering_id }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const supabase = supabaseForUser(ctx);
    const userId = requireUserId(ctx);
    const { error } = await supabase
      .from("gathering_attendees")
      .insert({ gathering_id, user_id: userId });
    if (error) {
      if (error.code === "23505") return errorResult("You have already joined this gathering.");
      if (error.message?.includes("GATHERING_FULL"))
        return errorResult("This gathering is full — no seats left.");
      if (error.message?.includes("GATHERING_CLOSED"))
        return errorResult("This gathering is no longer open to join.");
      return errorResult(error.message);
    }

    return {
      content: [{ type: "text", text: `Joined gathering ${gathering_id}.` }],
      structuredContent: { ok: true, gathering_id },
    };
  },
});
