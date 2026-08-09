import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LeaderboardPeriod = "week" | "month" | "year" | "all";

export interface LeaderRow {
  user_id: string;
  full_name: string;
  city: string | null;
  avatar_url: string | null;
  points: number;
  donations: number;
}

export function useDonorLeaderboard(period: LeaderboardPeriod) {
  return useQuery({
    queryKey: ["donor-leaderboard", period],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_donor_leaderboard", { _period: period });
      if (error) throw error;
      return (data ?? []) as LeaderRow[];
    },
  });
}

export interface VolunteerLeaderRow {
  user_id: string;
  full_name: string;
  city: string | null;
  avatar_url: string | null;
  assigned: number;
  completed: number;
  cancelled: number;
  avg_pickup_minutes: number | null;
  avg_delivery_minutes: number | null;
  rating: number | null;
  distance_km: number | null;
}

export function useVolunteerLeaderboard() {
  return useQuery({
    queryKey: ["volunteer-leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_volunteer_leaderboard");
      if (error) throw error;
      return (data ?? []) as VolunteerLeaderRow[];
    },
  });
}

/** Points ledger + achievements for one user. */
export function useMyRewards(userId: string | undefined) {
  const points = useQuery({
    queryKey: ["reward-points", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reward_points")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const achievements = useQuery({
    queryKey: ["achievements", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", userId!)
        .order("unlocked_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const total = (points.data ?? []).reduce((s, r) => s + r.points, 0);
  return { points, achievements, total };
}
