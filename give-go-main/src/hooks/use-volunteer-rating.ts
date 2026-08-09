import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface VolunteerRating {
  id: string;
  volunteer_id: string;
  donation_id: string;
  rater_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export function useSubmitVolunteerRating() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      donationId,
      volunteerId,
      rating,
      comment,
    }: {
      donationId: string;
      volunteerId: string;
      rating: number;
      comment?: string;
    }) => {
      if (rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5");
      }

      const { error } = await supabase.from("volunteer_ratings").insert({
        donation_id: donationId,
        volunteer_id: volunteerId,
        rating,
        comment: comment || null,
        rater_id: (await supabase.auth.getUser()).data.user?.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["volunteer-leaderboard"] });
      void qc.invalidateQueries({ queryKey: ["volunteer-ratings"] });
      toast.success("Thank you for rating!");
    },
    onError: (error: Error) => {
      if (error.message.includes("duplicate key")) {
        toast.error("You have already rated this volunteer");
      } else {
        toast.error(error.message);
      }
    },
  });
}

export function useVolunteerRatings(volunteerId: string | null) {
  return useQuery({
    queryKey: ["volunteer-ratings", volunteerId],
    enabled: !!volunteerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("volunteer_ratings")
        .select("*")
        .eq("volunteer_id", volunteerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as VolunteerRating[];
    },
  });
}

export function useDonationRating(donationId: string) {
  return useQuery({
    queryKey: ["donation-rating", donationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("volunteer_ratings")
        .select("*")
        .eq("donation_id", donationId)
        .maybeSingle();
      if (error) throw error;
      return data as VolunteerRating | null;
    },
  });
}
