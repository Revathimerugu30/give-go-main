import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_donation",
  title: "Create a donation",
  description:
    "Create a new donation listing on ShareAt for the signed-in user. It is submitted as pending for admin review.",
  inputSchema: {
    title: z.string().trim().min(2).describe("Short title of the item, e.g. 'Winter jackets'."),
    category: z.string().trim().min(1).describe("Category name, e.g. Clothes, Books, Electronics, Footwear."),
    quantity: z.number().int().min(1).describe("Number of items."),
    city: z.string().trim().min(1).describe("City for the pickup."),
    pickup_address: z.string().trim().min(3).describe("Full pickup address."),
    description: z.string().trim().optional().describe("Optional details about the items."),
    condition: z.string().trim().optional().describe("Item condition, e.g. new, good, used."),
    pickup_date: z.string().trim().optional().describe("Preferred pickup date as YYYY-MM-DD."),
    pickup_time: z.string().trim().optional().describe("Preferred pickup time window, e.g. '09:00 - 12:00'."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const userId = ctx.getUserId();
    if (!userId) {
      return { content: [{ type: "text", text: "Missing user identity in token" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("donations")
      .insert({
        donor_id: userId,
        title: input.title,
        category: input.category,
        quantity: input.quantity,
        city: input.city,
        pickup_address: input.pickup_address,
        description: input.description ?? null,
        condition: input.condition ?? "good",
        pickup_date: input.pickup_date ?? null,
        pickup_time: input.pickup_time ?? null,
      })
      .select("id,title,status,created_at")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { donation: data },
    };
  },
});
