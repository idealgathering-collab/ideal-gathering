import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser, notAuthed, errorResult, requireUserId } from "../supabase";

export default defineTool({
  name: "my_businesses",
  title: "My businesses",
  description: "List cafes/restaurants owned by the signed-in user.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("businesses")
      .select("id, name, city, address, description")
      .eq("owner_id", requireUserId(ctx))
      .order("created_at", { ascending: false });
    if (error) return errorResult(error.message);
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { businesses: data ?? [] },
    };
  },
});
