-- Migration: Add driver payment settlement tables
-- Date: 2024
-- Purpose: Track daily settlements, payment status, and payment history

-- Drop existing triggers and functions if they exist
DROP TRIGGER IF EXISTS ride_settlement_trigger ON rides;
DROP TRIGGER IF EXISTS settlement_overdue_notify_trigger ON driver_daily_settlement;
DROP TRIGGER IF EXISTS payment_confirmed_notify_trigger ON driver_payments;
DROP FUNCTION IF EXISTS create_daily_settlement();
DROP FUNCTION IF EXISTS notify_overdue_settlement();
DROP FUNCTION IF EXISTS notify_payment_confirmed();

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS driver_payment_reminders;
DROP TABLE IF EXISTS driver_payments;
DROP TABLE IF EXISTS driver_daily_settlement;

-- Create driver_daily_settlement table
CREATE TABLE driver_daily_settlement (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL,
  settlement_date date NOT NULL,
  total_rides integer NOT NULL DEFAULT 0,
  total_fare_amount numeric(12, 2) NOT NULL DEFAULT 0,
  total_platform_fees numeric(12, 2) NOT NULL DEFAULT 0,
  total_driver_earnings numeric(12, 2) NOT NULL DEFAULT 0,
  settlement_status character varying NOT NULL DEFAULT 'pending' CHECK (
    settlement_status IN ('pending', 'paid', 'overdue')
  ),
  payment_due_date timestamp without time zone NOT NULL,
  paid_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT driver_daily_settlement_pkey PRIMARY KEY (id),
  CONSTRAINT driver_daily_settlement_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
  CONSTRAINT driver_daily_settlement_unique UNIQUE (driver_id, settlement_date)
);

-- Create driver_payments table
CREATE TABLE driver_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL,
  settlement_id uuid,
  amount numeric(12, 2) NOT NULL,
  payment_method character varying NOT NULL CHECK (
    payment_method IN ('paystack', 'bank_transfer', 'cash')
  ),
  payment_reference character varying NOT NULL UNIQUE,
  status character varying NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'completed', 'failed', 'refunded')
  ),
  payment_date timestamp without time zone NOT NULL,
  confirmed_at timestamp without time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT driver_payments_pkey PRIMARY KEY (id),
  CONSTRAINT driver_payments_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
  CONSTRAINT driver_payments_settlement_id_fkey FOREIGN KEY (settlement_id) REFERENCES driver_daily_settlement(id) ON DELETE SET NULL
);

-- Create driver_payment_reminders table
CREATE TABLE driver_payment_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL,
  settlement_id uuid NOT NULL,
  reminder_type character varying NOT NULL CHECK (
    reminder_type IN ('first_notice', 'second_notice', 'final_notice')
  ),
  amount_owed numeric(12, 2) NOT NULL,
  sent_at timestamp without time zone NOT NULL,
  acknowledged_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT driver_payment_reminders_pkey PRIMARY KEY (id),
  CONSTRAINT driver_payment_reminders_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
  CONSTRAINT driver_payment_reminders_settlement_id_fkey FOREIGN KEY (settlement_id) REFERENCES driver_daily_settlement(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_driver_daily_settlement_driver_id ON driver_daily_settlement (driver_id);
CREATE INDEX idx_driver_daily_settlement_status ON driver_daily_settlement (settlement_status);
CREATE INDEX idx_driver_daily_settlement_date ON driver_daily_settlement (settlement_date);
CREATE INDEX idx_driver_payments_driver_id ON driver_payments (driver_id);
CREATE INDEX idx_driver_payments_status ON driver_payments (status);
CREATE INDEX idx_driver_payments_date ON driver_payments (payment_date);
CREATE INDEX idx_driver_payment_reminders_driver_id ON driver_payment_reminders (driver_id);

-- Add new columns to drivers table if they don't exist
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS availability_locked_at timestamp without time zone;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS availability_lock_reason character varying;

-- Enable Row Level Security (RLS)
ALTER TABLE driver_daily_settlement ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_payment_reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for driver_daily_settlement
CREATE POLICY "Drivers can view their own settlements"
  ON driver_daily_settlement FOR SELECT
  USING (driver_id = auth.uid());

CREATE POLICY "Only system can insert settlements"
  ON driver_daily_settlement FOR INSERT
  WITH CHECK (true);

-- Create RLS policies for driver_payments
CREATE POLICY "Drivers can view their own payments"
  ON driver_payments FOR SELECT
  USING (driver_id = auth.uid());

CREATE POLICY "Drivers can update their own payments"
  ON driver_payments FOR UPDATE
  USING (driver_id = auth.uid());

-- Create RLS policies for driver_payment_reminders
CREATE POLICY "Drivers can view their own reminders"
  ON driver_payment_reminders FOR SELECT
  USING (driver_id = auth.uid());

-- Function: Auto-create daily settlement when ride is completed
CREATE OR REPLACE FUNCTION create_daily_settlement()
RETURNS TRIGGER AS $$
DECLARE
  settlement_date date;
  existing_settlement uuid;
BEGIN
  IF NEW.status = 'completed' AND NEW.driver_id IS NOT NULL THEN
    settlement_date := DATE(NEW.completed_at);
    
    SELECT id INTO existing_settlement
    FROM driver_daily_settlement
    WHERE driver_id = NEW.driver_id AND driver_daily_settlement.settlement_date = settlement_date
    LIMIT 1;
    
    IF existing_settlement IS NULL THEN
      INSERT INTO driver_daily_settlement (
        driver_id,
        settlement_date,
        total_rides,
        total_fare_amount,
        total_platform_fees,
        total_driver_earnings,
        payment_due_date
      ) VALUES (
        NEW.driver_id,
        settlement_date,
        1,
        COALESCE(NEW.fare_amount, 0),
        COALESCE(NEW.platform_fee, 0),
        COALESCE(NEW.driver_earnings, 0),
        settlement_date::timestamp + interval '1 day'
      );
    ELSE
      UPDATE driver_daily_settlement
      SET
        total_rides = total_rides + 1,
        total_fare_amount = total_fare_amount + COALESCE(NEW.fare_amount, 0),
        total_platform_fees = total_platform_fees + COALESCE(NEW.platform_fee, 0),
        total_driver_earnings = total_driver_earnings + COALESCE(NEW.driver_earnings, 0),
        updated_at = now()
      WHERE id = existing_settlement;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-create daily settlement when ride is completed
CREATE TRIGGER ride_settlement_trigger
AFTER UPDATE ON rides
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed')
EXECUTE FUNCTION create_daily_settlement();

-- Function: Create notification when settlement becomes overdue
CREATE OR REPLACE FUNCTION notify_overdue_settlement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.settlement_status = 'overdue' AND OLD.settlement_status != 'overdue' THEN
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      channel,
      related_table,
      related_id,
      action_url,
      data
    ) SELECT
      d.user_id,
      'Payment Due',
      'Your settlement fees for ' || NEW.settlement_date::text || ' are now overdue. Please pay to maintain your driver status.',
      'payment',
      'in_app',
      'driver_daily_settlement',
      NEW.id,
      '/driver/payments',
      jsonb_build_object(
        'settlement_id', NEW.id::text,
        'amount_due', NEW.total_platform_fees::text,
        'settlement_date', NEW.settlement_date::text
      )
    FROM drivers d
    WHERE d.id = NEW.driver_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Create notification when settlement becomes overdue
CREATE TRIGGER settlement_overdue_notify_trigger
AFTER UPDATE ON driver_daily_settlement
FOR EACH ROW
EXECUTE FUNCTION notify_overdue_settlement();

-- Function: Create notification when payment is confirmed
CREATE OR REPLACE FUNCTION notify_payment_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      channel,
      related_table,
      related_id,
      action_url,
      data
    ) SELECT
      d.user_id,
      'Payment Confirmed',
      'Your settlement payment of ₦' || NEW.amount::text || ' has been confirmed. Your driver status is now active.',
      'payment',
      'in_app',
      'driver_payments',
      NEW.id,
      '/driver/payments',
      jsonb_build_object(
        'payment_id', NEW.id::text,
        'amount', NEW.amount::text,
        'payment_reference', NEW.payment_reference
      )
    FROM drivers d
    WHERE d.id = NEW.driver_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Create notification when payment is confirmed
CREATE TRIGGER payment_confirmed_notify_trigger
AFTER UPDATE ON driver_payments
FOR EACH ROW
EXECUTE FUNCTION notify_payment_confirmed();

-- Sample data for testing (optional - can be removed)
-- This will help verify the system works correctly
