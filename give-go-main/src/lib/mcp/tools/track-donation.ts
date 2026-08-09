import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "track_donation",
  title: "Track a donation",
  description:
    "Get the full status, pickup details and tracking timeline events for one donation the signed-in user can access.",
  inputSchema: {
    donation_id: z.string().describe("The donation id (UUID)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ donation_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: donation, error } = await supabase
      .from("donations")
      .select("*")
      .eq("id", donation_id)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!donation) {
      return { content: [{ type: "text", text: "Donation not found or not visible to you." }], isError: true };
    }
    const { data: events } = await supabase
      .from("donation_events")
      .select("stage,note,created_at")
      .eq("donation_id", donation_id)
      .order("created_at", { ascending: true });
    const payload = { donation, events: events ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload) }],
      structuredContent: payload,
    };
  },
});
