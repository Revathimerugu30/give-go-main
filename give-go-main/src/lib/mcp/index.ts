import { auth, defineMcp } from "@lovable.dev/mcp-js";
import createDonation from "./tools/create-donation";
import getMyRewards from "./tools/get-my-rewards";
import listMyDonations from "./tools/list-my-donations";
import listMyNotifications from "./tools/list-my-notifications";
import trackDonation from "./tools/track-donation";

// Must be the direct Supabase host: SUPABASE_URL becomes a proxy URL on publish.
const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "shareat",
  title: "ShareAt",
  version: "0.1.0",
  instructions:
    "Tools for ShareAt, a donation and reuse platform for clothes and household items. Use them to create donation listings, list and track the signed-in user's donations, read their notifications and check their reward points and achievements. All tools act as the signed-in ShareAt user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listMyDonations, trackDonation, createDonation, listMyNotifications, getMyRewards],
});
