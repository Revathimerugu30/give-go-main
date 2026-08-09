import { useState } from "react";
import { Star, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useSubmitVolunteerRating } from "@/hooks/use-volunteer-rating";

interface VolunteerRatingFormProps {
  donationId: string;
  volunteerId: string;
  volunteerName?: string;
  onSuccess?: () => void;
}

export function VolunteerRatingForm({
  donationId,
  volunteerId,
  volunteerName = "Volunteer",
  onSuccess,
}: VolunteerRatingFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const submit = useSubmitVolunteerRating();

  const handleSubmit = async () => {
    if (rating === 0) return;

    await submit.mutateAsync({
      donationId,
      volunteerId,
      rating,
      comment: comment.trim() || undefined,
    });

    if (submit.isSuccess) {
      setRating(0);
      setComment("");
      onSuccess?.();
    }
  };

  return (
    <Card className="gap-4 p-5">
      <h3 className="text-base font-semibold">Rate your experience</h3>
      <p className="text-sm text-muted-foreground">
        How was your experience with {volunteerName}?
      </p>

      {/* Star Rating */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="transition-transform hover:scale-110"
              aria-label={`Rate ${star} stars`}
            >
              <Star
                className={`size-6 ${
                  star <= (hoverRating || rating)
                    ? "fill-warning text-warning"
                    : "text-muted-foreground/30"
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <span className="text-sm font-medium text-muted-foreground">
            {rating} out of 5
          </span>
        )}
      </div>

      {/* Comment */}
      {rating > 0 && (
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <MessageCircle className="size-4" /> Add a comment (optional)
          </label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your feedback about the pickup and delivery..."
            className="min-h-20 resize-none"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            {comment.length}/500 characters
          </p>
        </div>
      )}

      {/* Submit Button */}
      {rating > 0 && (
        <Button
          onClick={handleSubmit}
          disabled={submit.isPending}
          className="w-full"
        >
          {submit.isPending ? "Submitting..." : "Submit Rating"}
        </Button>
      )}
    </Card>
  );
}
