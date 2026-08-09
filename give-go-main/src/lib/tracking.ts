import { supabase } from "@/integrations/supabase/client";

/** Ordered delivery lifecycle, used by the timeline, badges and progress bars. */
export const STAGES = [
  { key: "pending", label: "Donation submitted", emoji: "📝" },
  { key: "approved", label: "Admin verification", emoji: "✅" },
  { key: "assigned", label: "Volunteer assigned", emoji: "🙋" },
  { key: "accepted", label: "Volunteer accepted pickup", emoji: "🤝" },
  { key: "traveling", label: "Volunteer started journey", emoji: "🚚" },
  { key: "near_pickup", label: "Volunteer near pickup", emoji: "📍" },
  { key: "collected", label: "Item collected", emoji: "📦" },
  { key: "in_transit", label: "On the way to NGO", emoji: "🚛" },
  { key: "delivered", label: "Delivered to NGO", emoji: "🎉" },
  { key: "completed", label: "Completed", emoji: "🏁" },
] as const;

export type StageKey = (typeof STAGES)[number]["key"];

export const stageIndex = (status: string) => STAGES.findIndex((s) => s.key === status);

export const progressPercent = (status: string) => {
  if (status === "rejected" || status === "failed") return 100;
  const i = stageIndex(status);
  return i < 0 ? 0 : Math.round(((i + 1) / STAGES.length) * 100);
};

/** Volunteer live status colours. */
export const VOLUNTEER_STATUS: Record<string, { label: string; dot: string }> = {
  available: { label: "Available", dot: "bg-success" },
  assigned: { label: "Assigned", dot: "bg-warning" },
  traveling: { label: "Traveling", dot: "bg-primary" },
  collecting: { label: "Collecting", dot: "bg-chart-4" },
  delivering: { label: "Delivering", dot: "bg-chart-5" },
  offline: { label: "Offline", dot: "bg-muted-foreground" },
};

/** Great-circle distance in km. */
export function distanceKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Rough ETA assuming 22 km/h average city speed. */
export function etaMinutes(km: number) {
  return Math.max(1, Math.round((km / 22) * 60));
}

export function formatAgo(iso: string | null | undefined) {
  if (!iso) return "never";
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  return `${Math.round(s / 3600)}h ago`;
}

/** Writes a timeline event for a donation. Failures never block the main action. */
export async function logEvent(input: {
  donationId: string;
  stage: string;
  actorId: string;
  note?: string;
  lat?: number | null;
  lng?: number | null;
}) {
  const { error } = await supabase.from("donation_events").insert({
    donation_id: input.donationId,
    stage: input.stage,
    actor_id: input.actorId,
    note: input.note ?? null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
  });
  if (error) console.warn("logEvent failed", error.message);
}

/** Pushes notifications to a set of recipients (realtime delivers them instantly). */
export async function notify(
  userIds: (string | null | undefined)[],
  payload: { title: string; message: string; type?: string; donationId?: string },
) {
  const rows = [...new Set(userIds.filter(Boolean) as string[])].map((user_id) => ({
    user_id,
    title: payload.title,
    message: payload.message,
    type: payload.type ?? "info",
    donation_id: payload.donationId ?? null,
  }));
  if (rows.length === 0) return;
  const { error } = await supabase.from("notifications").insert(rows);
  if (error) console.warn("notify failed", error.message);
}

/** Returns every admin user id so admins receive operational notifications. */
export async function adminIds() {
  const { data } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
  return (data ?? []).map((r) => r.user_id);
}

/** Free geocoding via OpenStreetMap Nominatim. */
export async function geocode(query: string): Promise<[number, number] | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
    );
    const json = (await res.json()) as { lat: string; lon: string }[];
    if (!json?.[0]) return null;
    return [Number(json[0].lat), Number(json[0].lon)];
  } catch {
    return null;
  }
}
