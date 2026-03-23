-- Migration: mark settlements paid when driver_payments completes
-- Run in Supabase SQL editor

BEGIN;

-- Drop existing trigger/function if present
DROP TRIGGER IF EXISTS mark_settlements_paid_after_payment ON public.driver_payments;
DROP FUNCTION IF EXISTS public.mark_settlements_paid_on_payment();

-- Function: mark settlements paid when payment completes
CREATE OR REPLACE FUNCTION public.mark_settlements_paid_on_payment()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  sid uuid;
  sid_text text;
  settlement_ids jsonb;
  elem text;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.status = 'completed' THEN
      -- If explicit settlement_id provided
      IF NEW.settlement_id IS NOT NULL THEN
        UPDATE public.driver_daily_settlement
        SET settlement_status = 'paid', paid_at = now(), updated_at = now()
        WHERE id = NEW.settlement_id;
      END IF;

      -- If metadata contains settlement_ids array, update each
      IF NEW.metadata ? 'settlement_ids' THEN
        settlement_ids := NEW.metadata -> 'settlement_ids';
        IF jsonb_typeof(settlement_ids) = 'array' THEN
          FOR elem IN SELECT jsonb_array_elements_text(settlement_ids)
          LOOP
            BEGIN
              UPDATE public.driver_daily_settlement
              SET settlement_status = 'paid', paid_at = now(), updated_at = now()
              WHERE id = elem::uuid;
            EXCEPTION WHEN others THEN
              -- ignore invalid uuid / update errors per element
              RAISE NOTICE 'mark_settlements_paid_on_payment: skipping invalid settlement id %', elem;
            END;
          END LOOP;
        END IF;
      END IF;

      -- Also attempt to set rides as remitted (defensive: if earlier trigger missed some)
      IF NEW.driver_id IS NOT NULL THEN
        IF NEW.settlement_id IS NOT NULL THEN
          UPDATE public.rides
          SET remitted = true,
              remitted_at = now(),
              remitted_by_payment_id = NEW.id,
              updated_at = now()
          WHERE driver_id = NEW.driver_id
            AND remitted = false
            AND date(completed_at) = (SELECT settlement_date FROM public.driver_daily_settlement WHERE id = NEW.settlement_id);
        END IF;

        -- If metadata has settlement_ids, mark rides for each settlement date
        IF NEW.metadata ? 'settlement_ids' THEN
          settlement_ids := NEW.metadata -> 'settlement_ids';
          IF jsonb_typeof(settlement_ids) = 'array' THEN
            FOR elem IN SELECT jsonb_array_elements_text(settlement_ids)
            LOOP
              BEGIN
                UPDATE public.rides
                SET remitted = true,
                    remitted_at = now(),
                    remitted_by_payment_id = NEW.id,
                    updated_at = now()
                WHERE driver_id = NEW.driver_id
                  AND remitted = false
                  AND date(completed_at) = (SELECT settlement_date FROM public.driver_daily_settlement WHERE id = elem::uuid);
              EXCEPTION WHEN others THEN
                RAISE NOTICE 'mark_settlements_paid_on_payment (rides): skipping invalid settlement id %', elem;
              END;
            END LOOP;
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger on driver_payments
CREATE TRIGGER mark_settlements_paid_after_payment
AFTER INSERT OR UPDATE ON public.driver_payments
FOR EACH ROW
EXECUTE FUNCTION public.mark_settlements_paid_on_payment();

COMMIT;
