-- SUPABASE TRIGGER: Auto-send SMS/Email when notification created
-- This trigger fires every time a notification is inserted into the notifications table
-- It calls the Termii API to send SMS/Email based on the channel

CREATE OR REPLACE FUNCTION send_notification_via_termii()
RETURNS TRIGGER AS $$
DECLARE
  v_user_email VARCHAR;
  v_user_phone VARCHAR;
  v_user_name VARCHAR;
BEGIN
  -- Get user contact info
  SELECT email, phone_number, first_name INTO v_user_email, v_user_phone, v_user_name
  FROM users
  WHERE id = NEW.user_id;

  -- Send based on channel
  IF NEW.channel = 'sms' THEN
    -- Call Termii SMS API via HTTP
    -- This requires pg_net or a webhook solution
    -- For now, this is a placeholder for future implementation
    PERFORM
      net.http_post(
        'https://api.termii.com/api/sms/send',
        jsonb_build_object(
          'api_key', current_setting('app.termii_api_key'),
          'to', v_user_phone,
          'from', 'CHARTERKEKE',
          'sms', NEW.message,
          'type', 'plain',
          'channel', 'generic'
        ),
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        )
      );
  ELSIF NEW.channel = 'email' THEN
    -- Call email service (Resend) via HTTP
    PERFORM
      net.http_post(
        'https://api.resend.com/emails',
        jsonb_build_object(
          'from', 'noreply@charterkeke.com',
          'to', v_user_email,
          'subject', NEW.title,
          'html', '<h1>' || NEW.title || '</h1><p>' || NEW.message || '</p>'
        ),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.resend_api_key')
        )
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on notifications table
DROP TRIGGER IF EXISTS trigger_send_notification ON notifications;
CREATE TRIGGER trigger_send_notification
AFTER INSERT ON notifications
FOR EACH ROW
EXECUTE FUNCTION send_notification_via_termii();

-- Alternative: Use Supabase Edge Functions (Recommended)
-- Instead of this trigger, create a Supabase Edge Function that handles notifications
-- and call it via webhook when notifications are created
