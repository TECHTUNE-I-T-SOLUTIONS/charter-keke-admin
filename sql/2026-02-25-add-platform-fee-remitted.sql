-- Migration: add platform_fee and remitted tracking to rides
-- Run this in Supabase SQL editor or psql against your database.

BEGIN;

-- 1) Add columns to rides
ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS platform_fee numeric(10,2),
  ADD COLUMN IF NOT EXISTS remitted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS remitted_at timestamp without time zone NULL,
  ADD COLUMN IF NOT EXISTS remitted_by_payment_id uuid NULL;

-- 2) Add FK from rides.remitted_by_payment_id to driver_payments.id (if driver_payments exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'driver_payments') THEN
    -- Only add the constraint if it doesn't already exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_schema = 'public' AND table_name = 'rides' AND constraint_name = 'rides_remitted_by_payment_fkey'
    ) THEN
      EXECUTE 'ALTER TABLE public.rides ADD CONSTRAINT rides_remitted_by_payment_fkey FOREIGN KEY (remitted_by_payment_id) REFERENCES public.driver_payments(id)';
    END IF;
  END IF;
END$$;

-- 3) Function to set platform_fee (20% by default) on insert/update when fare_amount present
CREATE OR REPLACE FUNCTION public.set_platform_fee()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Only compute when fare_amount is available and either platform_fee is null or fare_amount changed
  IF NEW.fare_amount IS NOT NULL AND (NEW.platform_fee IS NULL OR (TG_OP = 'UPDATE' AND (NEW.fare_amount IS DISTINCT FROM OLD.fare_amount))) THEN
    NEW.platform_fee := round((NEW.fare_amount * 0.20)::numeric, 2);
  END IF;
  RETURN NEW;
END;
$$;

-- 4) Attach trigger to rides
DROP TRIGGER IF EXISTS set_platform_fee_before_insert_update ON public.rides;
CREATE TRIGGER set_platform_fee_before_insert_update
  BEFORE INSERT OR UPDATE ON public.rides
  FOR EACH ROW EXECUTE FUNCTION public.set_platform_fee();

-- 5) Function to mark rides remitted when a driver payment completes (links by settlement_date)
-- This assumes driver_payments.settlement_id refers to driver_daily_settlement.id which has settlement_date
CREATE OR REPLACE FUNCTION public.mark_rides_remitted_on_payment()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  settlement_date date;
BEGIN
  -- Only act when payment becomes completed and settlement_id provided
  IF NEW.status = 'completed' AND NEW.settlement_id IS NOT NULL THEN
    SELECT d.settlement_date INTO settlement_date FROM public.driver_daily_settlement d WHERE d.id = NEW.settlement_id;
    IF settlement_date IS NOT NULL THEN
      UPDATE public.rides
      SET remitted = true,
          remitted_at = now(),
          remitted_by_payment_id = NEW.id
      WHERE driver_id = NEW.driver_id
        AND remitted = false
        AND date(completed_at) = settlement_date;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mark_rides_remitted_after_payment ON public.driver_payments;
CREATE TRIGGER mark_rides_remitted_after_payment
  AFTER INSERT OR UPDATE ON public.driver_payments
  FOR EACH ROW EXECUTE FUNCTION public.mark_rides_remitted_on_payment();

-- 6) Function to update driver availability based on unpaid/overdue settlements
CREATE OR REPLACE FUNCTION public.reconcile_driver_availability(p_driver_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  unpaid_count int;
BEGIN
  SELECT count(*) INTO unpaid_count
  FROM public.driver_daily_settlement dds
  WHERE dds.driver_id = p_driver_id
    AND dds.settlement_status != 'paid'
    AND (dds.payment_due_date <= now() OR dds.settlement_status = 'overdue');

  IF unpaid_count > 0 THEN
    UPDATE public.drivers SET availability_status = 'offline', updated_at = now() WHERE id = p_driver_id;
  ELSE
    UPDATE public.drivers SET availability_status = 'online', updated_at = now() WHERE id = p_driver_id;
  END IF;
END;
$$;

-- 7) Trigger to call reconcile when a settlement is inserted/updated
CREATE OR REPLACE FUNCTION public.driver_settlement_availability_trigger()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM public.reconcile_driver_availability(NEW.driver_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS driver_settlement_update_availability ON public.driver_daily_settlement;
CREATE TRIGGER driver_settlement_update_availability
  AFTER INSERT OR UPDATE ON public.driver_daily_settlement
  FOR EACH ROW EXECUTE FUNCTION public.driver_settlement_availability_trigger();

COMMIT;

-- End of migration
