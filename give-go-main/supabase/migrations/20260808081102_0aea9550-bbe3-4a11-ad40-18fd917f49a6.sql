
-- ============ CONFIG TABLES ============
CREATE TABLE public.reward_config (
  category text PRIMARY KEY,
  points integer NOT NULL DEFAULT 10,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reward_config TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.reward_config TO authenticated;
GRANT ALL ON public.reward_config TO service_role;
ALTER TABLE public.reward_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reward config read" ON public.reward_config FOR SELECT USING (true);
CREATE POLICY "reward config admin write" ON public.reward_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.reward_config (category, points) VALUES
  ('Clothes',10),('Household',15),('Household Items',15),('Books',8),('Furniture',25),('Electronics',30),('Toys',8),('Other',10);

CREATE TABLE public.badge_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  min_points integer NOT NULL,
  icon text NOT NULL DEFAULT 'award',
  color text NOT NULL DEFAULT 'bronze',
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.badge_config TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.badge_config TO authenticated;
GRANT ALL ON public.badge_config TO service_role;
ALTER TABLE public.badge_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badge config read" ON public.badge_config FOR SELECT USING (true);
CREATE POLICY "badge config admin write" ON public.badge_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.badge_config (name, min_points, icon, color, description, sort_order) VALUES
  ('Bronze Donor',0,'medal','bronze','Starting your giving journey.',1),
  ('Silver Donor',100,'award','silver','A steady, generous contributor.',2),
  ('Gold Donor',300,'trophy','gold','A pillar of the community.',3),
  ('Super Donor',600,'crown','super','Legendary impact on families in need.',4);

-- ============ POINTS LEDGER ============
CREATE TABLE public.reward_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  donation_id uuid REFERENCES public.donations(id) ON DELETE SET NULL,
  points integer NOT NULL,
  category text,
  reason text NOT NULL DEFAULT 'donation_completed',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX reward_points_donation_unique ON public.reward_points(donation_id) WHERE donation_id IS NOT NULL;
CREATE INDEX reward_points_user_idx ON public.reward_points(user_id, created_at DESC);
GRANT SELECT ON public.reward_points TO authenticated;
GRANT ALL ON public.reward_points TO service_role;
ALTER TABLE public.reward_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reward points read" ON public.reward_points FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- ============ ACHIEVEMENTS ============
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'star',
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, code)
);
GRANT SELECT ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements read" ON public.achievements FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'volunteer'));

-- ============ VOLUNTEER RATINGS ============
CREATE TABLE public.volunteer_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  donation_id uuid NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  rater_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (donation_id, rater_id)
);
GRANT SELECT, INSERT ON public.volunteer_ratings TO authenticated;
GRANT ALL ON public.volunteer_ratings TO service_role;
ALTER TABLE public.volunteer_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ratings read" ON public.volunteer_ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "ratings insert" ON public.volunteer_ratings FOR INSERT TO authenticated
  WITH CHECK (rater_id = auth.uid() AND EXISTS (SELECT 1 FROM public.donations d WHERE d.id = donation_id AND d.donor_id = auth.uid()));

-- ============ TIMING COLUMNS ============
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS collected_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS distance_km double precision;

CREATE OR REPLACE FUNCTION public.track_donation_timing()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status IN ('assigned','accepted') AND NEW.assigned_at IS NULL THEN NEW.assigned_at := now(); END IF;
    IF NEW.status = 'collected' AND NEW.collected_at IS NULL THEN NEW.collected_at := now(); END IF;
    IF NEW.status = 'delivered' AND NEW.delivered_at IS NULL THEN NEW.delivered_at := now(); END IF;
    IF NEW.status = 'completed' AND NEW.completed_at IS NULL THEN NEW.completed_at := now(); END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER donations_timing BEFORE UPDATE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.track_donation_timing();

-- ============ AWARD POINTS + ACHIEVEMENTS ============
CREATE OR REPLACE FUNCTION public.award_donation_rewards()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pts integer; total integer; cnt integer; delivered_cnt integer; badge text;
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    SELECT points INTO pts FROM public.reward_config WHERE lower(category) = lower(NEW.category);
    IF pts IS NULL THEN pts := 10; END IF;

    INSERT INTO public.reward_points (user_id, donation_id, points, category)
    VALUES (NEW.donor_id, NEW.id, pts, NEW.category)
    ON CONFLICT (donation_id) DO NOTHING;

    SELECT COALESCE(SUM(points),0) INTO total FROM public.reward_points WHERE user_id = NEW.donor_id;
    SELECT COUNT(*) INTO cnt FROM public.donations WHERE donor_id = NEW.donor_id AND status = 'completed';
    SELECT name INTO badge FROM public.badge_config WHERE min_points <= total ORDER BY min_points DESC LIMIT 1;

    INSERT INTO public.notifications (user_id, title, message, type, donation_id)
    VALUES (NEW.donor_id, '+' || pts || ' reward points!',
      'Your donation "' || NEW.title || '" was completed. You now have ' || total || ' points (' || COALESCE(badge,'Bronze Donor') || ').',
      'success', NEW.id);

    IF cnt >= 1 THEN
      INSERT INTO public.achievements (user_id, code, title, description, icon)
      VALUES (NEW.donor_id,'first_donation','First Donation','Completed your very first donation.','medal')
      ON CONFLICT DO NOTHING; END IF;
    IF cnt >= 5 THEN
      INSERT INTO public.achievements (user_id, code, title, description, icon)
      VALUES (NEW.donor_id,'five_donations','5 Donations Completed','Five donations delivered to families in need.','gift')
      ON CONFLICT DO NOTHING; END IF;
    IF cnt >= 20 THEN
      INSERT INTO public.achievements (user_id, code, title, description, icon)
      VALUES (NEW.donor_id,'helped_100','Helped 100 Families','Your giving reached a hundred families.','globe')
      ON CONFLICT DO NOTHING; END IF;
    IF total >= 600 THEN
      INSERT INTO public.achievements (user_id, code, title, description, icon)
      VALUES (NEW.donor_id,'super_donor','Super Donor','Crossed 600 reward points.','crown')
      ON CONFLICT DO NOTHING; END IF;

    IF NEW.volunteer_id IS NOT NULL THEN
      SELECT COUNT(*) INTO delivered_cnt FROM public.donations
        WHERE volunteer_id = NEW.volunteer_id AND status IN ('delivered','completed');
      IF delivered_cnt >= 25 THEN
        INSERT INTO public.achievements (user_id, code, title, description, icon)
        VALUES (NEW.volunteer_id,'deliveries_25','25 Successful Deliveries','Completed twenty-five pickups end to end.','truck')
        ON CONFLICT DO NOTHING; END IF;
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER donations_award_rewards AFTER UPDATE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.award_donation_rewards();

-- ============ LEADERBOARDS ============
CREATE OR REPLACE FUNCTION public.get_donor_leaderboard(_period text DEFAULT 'all')
RETURNS TABLE (user_id uuid, full_name text, city text, avatar_url text, points bigint, donations bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.full_name, p.city, p.avatar_url,
         COALESCE(SUM(rp.points),0)::bigint AS points,
         COUNT(rp.id)::bigint AS donations
  FROM public.profiles p
  JOIN public.reward_points rp ON rp.user_id = p.id
   AND rp.created_at >= CASE _period
        WHEN 'week' THEN now() - interval '7 days'
        WHEN 'month' THEN now() - interval '30 days'
        WHEN 'year' THEN now() - interval '365 days'
        ELSE '-infinity'::timestamptz END
  GROUP BY p.id, p.full_name, p.city, p.avatar_url
  ORDER BY points DESC, donations DESC
  LIMIT 100
$$;
GRANT EXECUTE ON FUNCTION public.get_donor_leaderboard(text) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.get_volunteer_leaderboard()
RETURNS TABLE (
  user_id uuid, full_name text, city text, avatar_url text,
  assigned bigint, completed bigint, cancelled bigint,
  avg_pickup_minutes double precision, avg_delivery_minutes double precision,
  rating double precision, distance_km double precision
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.full_name, p.city, p.avatar_url,
    COUNT(d.id)::bigint,
    COUNT(d.id) FILTER (WHERE d.status IN ('delivered','completed'))::bigint,
    COUNT(d.id) FILTER (WHERE d.status = 'failed')::bigint,
    AVG(EXTRACT(EPOCH FROM (d.collected_at - d.assigned_at))/60) FILTER (WHERE d.collected_at IS NOT NULL AND d.assigned_at IS NOT NULL),
    AVG(EXTRACT(EPOCH FROM (d.delivered_at - d.collected_at))/60) FILTER (WHERE d.delivered_at IS NOT NULL AND d.collected_at IS NOT NULL),
    (SELECT AVG(vr.rating)::double precision FROM public.volunteer_ratings vr WHERE vr.volunteer_id = p.id),
    COALESCE(SUM(d.distance_km),0)::double precision
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'volunteer'
  LEFT JOIN public.donations d ON d.volunteer_id = p.id
  GROUP BY p.id, p.full_name, p.city, p.avatar_url
  ORDER BY 6 DESC, 7 DESC
  LIMIT 100
$$;
GRANT EXECUTE ON FUNCTION public.get_volunteer_leaderboard() TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.reward_points;
ALTER PUBLICATION supabase_realtime ADD TABLE public.achievements;
