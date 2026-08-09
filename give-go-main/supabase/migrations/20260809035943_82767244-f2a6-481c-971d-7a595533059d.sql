WITH ranked_rewards AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY donation_id
           ORDER BY created_at ASC, id ASC
         ) AS duplicate_rank
  FROM public.reward_points
  WHERE donation_id IS NOT NULL
)
DELETE FROM public.reward_points rp
USING ranked_rewards rr
WHERE rp.id = rr.id
  AND rr.duplicate_rank > 1;

DROP INDEX IF EXISTS public.reward_points_donation_id_key;

ALTER TABLE public.reward_points
  ADD CONSTRAINT reward_points_donation_id_key UNIQUE (donation_id);