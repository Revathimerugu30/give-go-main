import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Streams the volunteer's GPS position to `volunteer_locations` while enabled,
 * so donors and admins see a live moving marker.
 */
export function useGeoBroadcast({
  enabled,
  volunteerId,
  donationId,
  status,
}: {
  enabled: boolean;
  volunteerId?: string;
  donationId?: string | null;
  status: string;
}) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !volunteerId || typeof navigator === "undefined" || !navigator.geolocation) return;

    let last = 0;
    const push = async (lat: number, lng: number, heading: number | null, speed: number | null) => {
      await supabase.from("volunteer_locations").upsert(
        {
          volunteer_id: volunteerId,
          lat,
          lng,
          heading,
          speed,
          donation_id: donationId ?? null,
          status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "volunteer_id" },
      );
    };

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, heading, speed } = pos.coords;
        setPosition({ lat: latitude, lng: longitude });
        setError(null);
        const now = Date.now();
        if (now - last > 8000) {
          last = now;
          void push(latitude, longitude, heading ?? null, speed ?? null);
        }
      },
      (e) => setError(e.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );

    return () => navigator.geolocation.clearWatch(id);
  }, [enabled, volunteerId, donationId, status]);

  return { position, error };
}
