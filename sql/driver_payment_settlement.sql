-- Driver Payment Settlement System Tables
-- These tables track daily settlement fees, payment status, and payment history

-- Table: driver_daily_settlement
-- Tracks daily settlement fees for each driver
CREATE TABLE IF NOT EXISTS public.driver_daily_settlement (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL,
  settlement_date date NOT NULL,
  total_rides integer NOT NULL DEFAULT 0,
  total_fare_amount numeric(12, 2) NOT NULL DEFAULT 0,
  total_platform_fees numeric(12, 2) NOT NULL DEFAULT 0,
  total_driver_earnings numeric(12, 2) NOT NULL DEFAULT 0,
  settlement_status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (
    settlement_status::text = ANY (
      ARRAY['pending'::character varying, 'paid'::character varying, 'overdue'::character varying]::text[]
    )
  ),
  payment_due_date timestamp without time zone NOT NULL,
  paid_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT driver_daily_settlement_pkey PRIMARY KEY (id),
  CONSTRAINT driver_daily_settlement_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE CASCADE,
  CONSTRAINT driver_daily_settlement_unique UNIQUE (driver_id, settlement_date)
);

-- Table: driver_payments
-- Tracks all payment transactions from drivers
CREATE TABLE IF NOT EXISTS public.driver_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL,
  settlement_id uuid,
  amount numeric(12, 2) NOT NULL,
  payment_method character varying NOT NULL CHECK (
    payment_method::text = ANY (
      ARRAY['paystack'::character varying, 'bank_transfer'::character varying, 'cash'::character varying]::text[]
    )
  ),
  payment_reference character varying NOT NULL UNIQUE,
  status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (
    status::text = ANY (
      ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying, 'refunded'::character varying]::text[]
    )
  ),
  payment_date timestamp without time zone NOT NULL,
  confirmed_at timestamp without time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT driver_payments_pkey PRIMARY KEY (id),
  CONSTRAINT driver_payments_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE CASCADE,
  CONSTRAINT driver_payments_settlement_id_fkey FOREIGN KEY (settlement_id) REFERENCES public.driver_daily_settlement(id) ON DELETE SET NULL
);

-- Table: driver_payment_reminders
-- Tracks payment reminders sent to drivers
CREATE TABLE IF NOT EXISTS public.driver_payment_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL,
  settlement_id uuid NOT NULL,
  reminder_type character varying NOT NULL CHECK (
    reminder_type::text = ANY (
      ARRAY['first_notice'::character varying, 'second_notice'::character varying, 'final_notice'::character varying]::text[]
    )
  ),
  amount_owed numeric(12, 2) NOT NULL,
  sent_at timestamp without time zone NOT NULL,
  acknowledged_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT driver_payment_reminders_pkey PRIMARY KEY (id),
  CONSTRAINT driver_payment_reminders_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE CASCADE,
  CONSTRAINT driver_payment_reminders_settlement_id_fkey FOREIGN KEY (settlement_id) REFERENCES public.driver_daily_settlement(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_driver_daily_settlement_driver_id ON public.driver_daily_settlement (driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_daily_settlement_status ON public.driver_daily_settlement (settlement_status);
CREATE INDEX IF NOT EXISTS idx_driver_daily_settlement_date ON public.driver_daily_settlement (settlement_date);
CREATE INDEX IF NOT EXISTS idx_driver_payments_driver_id ON public.driver_payments (driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_payments_status ON public.driver_payments (status);
CREATE INDEX IF NOT EXISTS idx_driver_payments_date ON public.driver_payments (payment_date);
CREATE INDEX IF NOT EXISTS idx_driver_payment_reminders_driver_id ON public.driver_payment_reminders (driver_id);

-- Trigger: Auto-create daily settlement when ride is completed
CREATE OR REPLACE FUNCTION create_daily_settlement()
RETURNS TRIGGER AS $$
DECLARE
  settlement_date date;
  existing_settlement uuid;
BEGIN
  IF NEW.status = 'completed' AND NEW.driver_id IS NOT NULL THEN
    settlement_date := DATE(NEW.completed_at);
    
    -- Check if settlement exists for this driver and date
    SELECT id INTO existing_settlement
    FROM public.driver_daily_settlement
    WHERE driver_id = NEW.driver_id AND settlement_date = settlement_date
    LIMIT 1;
    
    -- If not, create a new one
    IF existing_settlement IS NULL THEN
      INSERT INTO public.driver_daily_settlement (
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
      -- Update existing settlement
      UPDATE public.driver_daily_settlement
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

CREATE TRIGGER ride_settlement_trigger
AFTER UPDATE ON public.rides
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed')
EXECUTE FUNCTION create_daily_settlement();

-- Trigger: Create payment notification when settlement becomes overdue
CREATE OR REPLACE FUNCTION notify_overdue_settlement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.settlement_status = 'overdue' AND OLD.settlement_status != 'overdue' THEN
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
    ) SELECT
      d.user_id,
      'Payment Due',
      'Your settlement fees for ' || NEW.settlement_date::text || ' are now overdue. Please pay to maintain your driver status.',
      'payment'::character varying,
      'in_app'::character varying,
      'driver_daily_settlement'::character varying,
      NEW.id,
      '/driver/payments'::character varying,
      jsonb_build_object(
        'settlement_id', NEW.id::text,
        'amount_due', NEW.total_platform_fees::text,
        'settlement_date', NEW.settlement_date::text
      )
    FROM public.drivers d
    WHERE d.id = NEW.driver_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER settlement_overdue_notify_trigger
AFTER UPDATE ON public.driver_daily_settlement
FOR EACH ROW
EXECUTE FUNCTION notify_overdue_settlement();

-- Trigger: Create payment confirmation notification
CREATE OR REPLACE FUNCTION notify_payment_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
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
    ) SELECT
      d.user_id,
      'Payment Confirmed',
      'Your settlement payment of ₦' || NEW.amount::text || ' has been confirmed. Your driver status is now active.',
      'payment'::character varying,
      'in_app'::character varying,
      'driver_payments'::character varying,
      NEW.id,
      '/driver/payments'::character varying,
      jsonb_build_object(
        'payment_id', NEW.id::text,
        'amount', NEW.amount::text,
        'payment_reference', NEW.payment_reference
      )
    FROM public.drivers d
    WHERE d.id = NEW.driver_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_confirmed_notify_trigger
AFTER UPDATE ON public.driver_payments
FOR EACH ROW
EXECUTE FUNCTION notify_payment_confirmed();
