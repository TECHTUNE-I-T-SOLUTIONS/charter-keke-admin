-- ==========================================================================
-- SUPPORT TICKETS REALTIME + ATTACHMENTS MIGRATION
-- Run this in Supabase SQL editor
-- ==========================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- 1) Extend support_tickets for better lifecycle tracking
-- --------------------------------------------------------------------------
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS resolution_note TEXT,
  ADD COLUMN IF NOT EXISTS resolution_requested_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS resolution_confirmed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS user_last_read_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS admin_last_read_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS closed_by_user BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_support_tickets_last_message_at ON public.support_tickets(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_status ON public.support_tickets(user_id, status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_status ON public.support_tickets(assigned_to, status);

-- --------------------------------------------------------------------------
-- 2) Extend ticket_messages for image/file attachment metadata
-- --------------------------------------------------------------------------
ALTER TABLE public.ticket_messages
  ADD COLUMN IF NOT EXISTS message_type VARCHAR(30) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
  ADD COLUMN IF NOT EXISTS attachment_url TEXT,
  ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS attachment_mime_type VARCHAR(255),
  ADD COLUMN IF NOT EXISTS attachment_size BIGINT,
  ADD COLUMN IF NOT EXISTS is_internal BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

ALTER TABLE public.ticket_messages
  ALTER COLUMN attachments SET DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON public.ticket_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_type ON public.ticket_messages(message_type);

-- --------------------------------------------------------------------------
-- 3) Keep updated_at synced and ticket last_message_at fresh
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_support()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_support();

DROP TRIGGER IF EXISTS trg_ticket_messages_updated_at ON public.ticket_messages;
CREATE TRIGGER trg_ticket_messages_updated_at
BEFORE UPDATE ON public.ticket_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_support();

CREATE OR REPLACE FUNCTION public.on_ticket_message_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.support_tickets
  SET
    last_message_at = COALESCE(NEW.created_at, NOW()),
    updated_at = NOW(),
    status = CASE
      WHEN status = 'resolved' THEN 'in_progress'
      ELSE status
    END
  WHERE id = NEW.ticket_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ticket_message_insert ON public.ticket_messages;
CREATE TRIGGER trg_ticket_message_insert
AFTER INSERT ON public.ticket_messages
FOR EACH ROW
EXECUTE FUNCTION public.on_ticket_message_insert();

-- --------------------------------------------------------------------------
-- 4) Realtime friendliness
-- --------------------------------------------------------------------------
ALTER TABLE public.support_tickets REPLICA IDENTITY FULL;
ALTER TABLE public.ticket_messages REPLICA IDENTITY FULL;

-- --------------------------------------------------------------------------
-- 5) Storage bucket for support attachments (NextAuth/API-managed access)
-- --------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'support-attachments',
  'support-attachments',
  TRUE,
  8388608,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------------------------
-- 6) Notification automation for support tickets/messages/status
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.notify_admins_new_support_ticket()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    channel,
    related_table,
    related_id,
    action_url,
    data
  )
  SELECT
    a.user_id,
    'New Support Ticket',
    format('New %s support ticket: %s', NEW.category, NEW.subject),
    'admin',
    'in_app',
    'support_tickets',
    NEW.id,
    '/admin/messages',
    jsonb_build_object(
      'ticketId', NEW.id,
      'event', 'ticket_created',
      'priority', NEW.priority,
      'status', NEW.status,
      'category', NEW.category,
      'userId', NEW.user_id
    )
  FROM public.admins a;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_admins_new_support_ticket ON public.support_tickets;
CREATE TRIGGER trg_notify_admins_new_support_ticket
AFTER INSERT ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_new_support_ticket();

CREATE OR REPLACE FUNCTION public.notify_on_ticket_message()
RETURNS TRIGGER AS $$
DECLARE
  sender_role TEXT;
  ticket_owner UUID;
  ticket_subject TEXT;
  ticket_owner_role TEXT;
BEGIN
  SELECT u.role INTO sender_role
  FROM public.users u
  WHERE u.id = NEW.sender_id;

  SELECT t.user_id, t.subject, u.role
  INTO ticket_owner, ticket_subject, ticket_owner_role
  FROM public.support_tickets t
  LEFT JOIN public.users u ON u.id = t.user_id
  WHERE t.id = NEW.ticket_id;

  IF sender_role IN ('admin', 'super_admin') THEN
    IF COALESCE(NEW.is_internal, FALSE) = FALSE THEN
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        channel,
        related_table,
        related_id,
        action_url,
        data
      )
      VALUES (
        ticket_owner,
        'Support Reply',
        format('Support replied on your ticket: %s', ticket_subject),
        'admin',
        'in_app',
        'ticket_messages',
        NEW.id,
        CASE
          WHEN ticket_owner_role = 'driver' THEN '/driver/help-and-support'
          ELSE '/rider/help-and-support'
        END,
        jsonb_build_object(
          'ticketId', NEW.ticket_id,
          'messageId', NEW.id,
          'event', 'admin_message'
        )
      );
    END IF;
  ELSE
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      channel,
      related_table,
      related_id,
      action_url,
      data
    )
    SELECT
      a.user_id,
      'New Support Message',
      format('New message on ticket: %s', ticket_subject),
      'admin',
      'in_app',
      'ticket_messages',
      NEW.id,
      '/admin/messages',
      jsonb_build_object(
        'ticketId', NEW.ticket_id,
        'messageId', NEW.id,
        'event', 'user_message',
        'senderId', NEW.sender_id
      )
    FROM public.admins a;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_on_ticket_message ON public.ticket_messages;
CREATE TRIGGER trg_notify_on_ticket_message
AFTER INSERT ON public.ticket_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_ticket_message();

CREATE OR REPLACE FUNCTION public.notify_on_ticket_status_change()
RETURNS TRIGGER AS $$
DECLARE
  ticket_owner_role TEXT;
BEGIN
  SELECT u.role INTO ticket_owner_role
  FROM public.users u
  WHERE u.id = NEW.user_id;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      channel,
      related_table,
      related_id,
      action_url,
      data
    )
    VALUES (
      NEW.user_id,
      'Support Ticket Updated',
      format('Your ticket "%s" is now %s', NEW.subject, NEW.status),
      'admin',
      'in_app',
      'support_tickets',
      NEW.id,
      CASE
        WHEN ticket_owner_role = 'driver' THEN '/driver/help-and-support'
        ELSE '/rider/help-and-support'
      END,
      jsonb_build_object(
        'ticketId', NEW.id,
        'event', 'ticket_status_changed',
        'from', OLD.status,
        'to', NEW.status
      )
    );

    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      channel,
      related_table,
      related_id,
      action_url,
      data
    )
    SELECT
      a.user_id,
      'Ticket Status Changed',
      format('Ticket "%s" is now %s', NEW.subject, NEW.status),
      'admin',
      'in_app',
      'support_tickets',
      NEW.id,
      '/admin/messages',
      jsonb_build_object(
        'ticketId', NEW.id,
        'event', 'ticket_status_changed',
        'from', OLD.status,
        'to', NEW.status,
        'userId', NEW.user_id
      )
    FROM public.admins a;
  END IF;

  IF NEW.resolution_confirmed_at IS DISTINCT FROM OLD.resolution_confirmed_at
     AND NEW.resolution_confirmed_at IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      channel,
      related_table,
      related_id,
      action_url,
      data
    )
    SELECT
      a.user_id,
      'Resolution Confirmed',
      format('User confirmed resolution for ticket "%s"', NEW.subject),
      'admin',
      'in_app',
      'support_tickets',
      NEW.id,
      '/admin/messages',
      jsonb_build_object(
        'ticketId', NEW.id,
        'event', 'resolution_confirmed',
        'userId', NEW.user_id
      )
    FROM public.admins a;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_on_ticket_status_change ON public.support_tickets;
CREATE TRIGGER trg_notify_on_ticket_status_change
AFTER UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_ticket_status_change();

COMMIT;
