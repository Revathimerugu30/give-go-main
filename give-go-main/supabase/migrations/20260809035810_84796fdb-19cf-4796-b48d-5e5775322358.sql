DELETE FROM public.reward_points a USING public.reward_points b WHERE a.donation_id IS NOT NULL AND a.donation_id = b.donation_id AND a.ctid > b.ctid;

CREATE UNIQUE INDEX IF NOT EXISTS reward_points_donation_id_key ON public.reward_points (donation_id) WHERE donation_id IS NOT NULL;