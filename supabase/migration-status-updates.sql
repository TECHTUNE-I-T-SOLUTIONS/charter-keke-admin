-- 1. CREATE STATUS UPDATES / ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.status_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('service_update', 'traffic_alert', 'milestone', 'notice')),
  severity VARCHAR(50) NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical', 'success')),
  affected_zones TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying updates quickly
CREATE INDEX IF NOT EXISTS idx_status_updates_created_at ON public.status_updates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_status_updates_pinned ON public.status_updates(is_pinned) WHERE is_pinned = TRUE;

-- Disable Row Level Security (RLS) since authentication is handled at the application layer
ALTER TABLE public.status_updates DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to clean up
DROP POLICY IF EXISTS "Allow public read access to status updates" ON public.status_updates;
DROP POLICY IF EXISTS "Allow admins full write access to status updates" ON public.status_updates;

-- Trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_status_updates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS status_updates_updated_at ON public.status_updates;
CREATE TRIGGER status_updates_updated_at 
  BEFORE UPDATE ON public.status_updates 
  FOR EACH ROW EXECUTE FUNCTION update_status_updates_updated_at();

-- 2. FAN-OUT NOTIFICATIONS TRIGGER (ADMINS AND USERS)
CREATE OR REPLACE FUNCTION notify_announcement()
RETURNS TRIGGER AS $$
DECLARE
  admin_rec RECORD;
  user_rec RECORD;
  noti_title TEXT;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    noti_title := 'Updated: ' || NEW.title;
  ELSE
    noti_title := NEW.title;
  END IF;

  -- 1. Insert into admin_notifications for all admins
  FOR admin_rec IN SELECT user_id FROM public.admins LOOP
    INSERT INTO public.admin_notifications (
      recipient_user_id,
      title,
      body,
      type,
      metadata
    ) VALUES (
      admin_rec.user_id,
      noti_title,
      NEW.content,
      'admin_event',
      jsonb_build_object('announcement_id', NEW.id, 'category', NEW.category, 'action', TG_OP)
    );
  END LOOP;

  -- 2. Insert into notifications for all active users
  FOR user_rec IN SELECT id FROM public.users WHERE role IN ('user', 'driver') AND status = 'active' LOOP
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      channel,
      metadata
    ) VALUES (
      user_rec.id,
      noti_title,
      NEW.content,
      'system',
      'in_app',
      jsonb_build_object('announcement_id', NEW.id, 'category', NEW.category, 'action', TG_OP)
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS status_updates_notify_trigger ON public.status_updates;
CREATE TRIGGER status_updates_notify_trigger
  AFTER INSERT OR UPDATE ON public.status_updates
  FOR EACH ROW EXECUTE FUNCTION notify_announcement();

-- 3. AUTOMATIC RIDE MILESTONES TRIGGER
CREATE OR REPLACE FUNCTION check_ride_milestones()
RETURNS TRIGGER AS $$
DECLARE
  completed_count INTEGER;
  milestone_val INTEGER;
  milestone_title TEXT;
  milestone_content TEXT;
  milestone_exists BOOLEAN;
BEGIN
  -- Only trigger when status transitions to completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    SELECT COUNT(*) INTO completed_count FROM public.rides WHERE status = 'completed';
    
    -- Check if completed count matches key milestones (e.g. 100, 500, 1000, 5000, 10000, or any multiple of 5000)
    IF completed_count IN (100, 500, 1000, 5000, 10000, 25000, 50000, 100000) OR (completed_count > 0 AND completed_count % 50000 = 0) THEN
      milestone_val := completed_count;
      milestone_title := 'Milestone Reached: ' || to_char(milestone_val, 'FM999,999,999') || ' Completed Rides!';
      milestone_content := 'We have officially completed ' || to_char(milestone_val, 'FM999,999,999') || ' rides on CharterKEKE! A huge thank you to our amazing drivers and riders for making this milestone possible.';
      
      -- Verify we haven't already posted this milestone to prevent double triggering
      SELECT EXISTS(
        SELECT 1 FROM public.status_updates 
        WHERE title = milestone_title
      ) INTO milestone_exists;
      
      IF NOT milestone_exists THEN
        INSERT INTO public.status_updates (
          title, 
          content, 
          category, 
          severity, 
          is_pinned
        ) VALUES (
          milestone_title, 
          milestone_content, 
          'milestone', 
          'success', 
          true
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ride_milestones_trigger ON public.rides;
CREATE TRIGGER ride_milestones_trigger
  AFTER UPDATE OF status ON public.rides
  FOR EACH ROW
  EXECUTE FUNCTION check_ride_milestones();
