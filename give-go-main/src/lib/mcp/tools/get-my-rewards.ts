import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_my_rewards",
  title: "Get my rewards",
  description:
    "Get the signed-in user's total reward points, recent point entries and unlocked achievements on ShareAt.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const [{ data: points, error }, { data: achievements }] = await Promise.all([
      supabase
        .from("reward_points")
        .select("points,reason,category,created_at")
        .order("created_at", { ascending: false })
        .limit(25),
      supabase.from("achievements").select("code,title,description,unlocked_at"),
    ]);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const total = (points ?? []).reduce((sum, row) => sum + (row.points ?? 0), 0);
    const payload = {
      recent_points_total: total,
      recent_points: points ?? [],
      achievements: achievements ?? [],
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload) }],
      structuredContent: payload,
    };
  },
});
