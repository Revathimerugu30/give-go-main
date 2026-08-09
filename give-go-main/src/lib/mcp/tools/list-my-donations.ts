import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_donations",
  title: "List my donations",
  description:
    "List the signed-in user's donations on ShareAt, most recent first, optionally filtered by status.",
  inputSchema: {
    status: z.string().optional().describe("Optional donation status filter, e.g. pending, approved, delivered."),
    limit: z.number().int().min(1).max(50).optional().describe("Maximum rows to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("donations")
      .select("id,title,category,quantity,status,city,pickup_address,pickup_date,pickup_time,created_at,volunteer_id")
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (status) query = query.eq("status", status as never);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { donations: data ?? [] },
    };
  },
});
