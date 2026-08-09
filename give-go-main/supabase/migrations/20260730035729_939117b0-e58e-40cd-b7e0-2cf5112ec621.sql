ALTER TYPE public.donation_status ADD VALUE IF NOT EXISTS 'accepted';
ALTER TYPE public.donation_status ADD VALUE IF NOT EXISTS 'traveling';
ALTER TYPE public.donation_status ADD VALUE IF NOT EXISTS 'near_pickup';
ALTER TYPE public.donation_status ADD VALUE IF NOT EXISTS 'in_transit';
ALTER TYPE public.donation_status ADD VALUE IF NOT EXISTS 'failed';

ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS pickup_lat double precision,
  ADD COLUMN IF NOT EXISTS pickup_lng double precision,
  ADD COLUMN IF NOT EXISTS ngo_name text,
  ADD COLUMN IF NOT EXISTS ngo_lat double precision,
  ADD COLUMN IF NOT EXISTS ngo_lng double precision,
  ADD COLUMN IF NOT EXISTS delivery_photo text,
  ADD COLUMN IF NOT EXISTS signature_url text;

ALTER TABLE public.volunteers
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'offline',
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS avatar_url text;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS donation_id uuid;

CREATE TABLE IF NOT EXISTS public.donation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  stage text NOT NULL,
  note text,
  actor_id uuid,
  lat double precision,
  lng double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS donation_events_donation_idx ON public.donation_events(donation_id, created_at);
GRANT SELECT, INSERT ON public.donation_events TO authenticated;
GRANT ALL ON public.donation_events TO service_role;
ALTER TABLE public.donation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "donation events read" ON public.donation_events FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.donations d WHERE d.id = donation_id
  AND (d.donor_id = auth.uid() OR d.volunteer_id = auth.uid()
       OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'volunteer'))));

CREATE POLICY "donation events insert" ON public.donation_events FOR INSERT TO authenticated
WITH CHECK (actor_id = auth.uid() AND EXISTS (SELECT 1 FROM public.donations d WHERE d.id = donation_id
  AND (d.donor_id = auth.uid() OR d.volunteer_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

CREATE TABLE IF NOT EXISTS public.volunteer_locations (
  volunteer_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  heading double precision,
  speed double precision,
  donation_id uuid,
  status text NOT NULL DEFAULT 'available',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.volunteer_locations TO authenticated;
GRANT ALL ON public.volunteer_locations TO service_role;
ALTER TABLE public.volunteer_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "locations self write" ON public.volunteer_locations FOR INSERT TO authenticated
WITH CHECK (volunteer_id = auth.uid());
CREATE POLICY "locations self update" ON public.volunteer_locations FOR UPDATE TO authenticated
USING (volunteer_id = auth.uid()) WITH CHECK (volunteer_id = auth.uid());
CREATE POLICY "locations read" ON public.volunteer_locations FOR SELECT TO authenticated
USING (volunteer_id = auth.uid() OR public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.donations d WHERE d.volunteer_id = volunteer_locations.volunteer_id
             AND d.donor_id = auth.uid()));

CREATE TRIGGER volunteer_locations_updated_at BEFORE UPDATE ON public.volunteer_locations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.donations REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.volunteer_locations REPLICA IDENTITY FULL;
ALTER TABLE public.donation_events REPLICA IDENTITY FULL;
ALTER TABLE public.volunteers REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.donations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.volunteer_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.donation_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.volunteers;