-- Create user_locations table for real-time location tracking
-- This table stores real-time location data for riders/users
-- Pair this with driver_locations table for live tracking on rides

CREATE TABLE IF NOT EXISTS public.user_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  timestamp timestamp without time zone DEFAULT now(),
  ride_id uuid,
  accuracy numeric,
  speed numeric,
  heading numeric,
  CONSTRAINT user_locations_pkey PRIMARY KEY (id),
  CONSTRAINT user_locations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT user_locations_ride_id_fkey FOREIGN KEY (ride_id) REFERENCES public.rides(id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON public.user_locations(user_id);

-- Create index on ride_id for finding locations by ride
CREATE INDEX IF NOT EXISTS idx_user_locations_ride_id ON public.user_locations(ride_id);

-- Create index on timestamp for time-based queries
CREATE INDEX IF NOT EXISTS idx_user_locations_timestamp ON public.user_locations(timestamp DESC);

-- Create index on user_id and ride_id for combined queries
CREATE INDEX IF NOT EXISTS idx_user_locations_user_ride ON public.user_locations(user_id, ride_id);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can only see their own locations
CREATE POLICY "Users can view own locations" ON public.user_locations
  FOR SELECT USING (user_id = auth.uid());

-- Create RLS policy: Users can only insert their own locations
CREATE POLICY "Users can insert own locations" ON public.user_locations
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create RLS policy: Users can only update their own locations
CREATE POLICY "Users can update own locations" ON public.user_locations
  FOR UPDATE USING (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON public.user_locations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_locations TO anon;

-- Add comment to table
COMMENT ON TABLE public.user_locations IS 'Real-time location tracking for riders/users. Used for live tracking on rides with drivers. Pair with driver_locations table.';

-- Enable Realtime for this table in Supabase
-- Note: This needs to be done in Supabase dashboard under Database > Replication
-- Or use the Supabase CLI: supabase realtime add --schema public --table user_locations
-- Manual steps in Supabase dashboard:
-- 1. Go to Database > Replication
-- 2. Find "user_locations" table
-- 3. Toggle ON to enable realtime
-- 4. This allows subscriptions via Supabase real-time client
