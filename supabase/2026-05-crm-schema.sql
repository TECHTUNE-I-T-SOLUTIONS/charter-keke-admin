-- ============================================================================
-- Charter Keke CRM schema expansion
-- Adds department routing, internal notes, email ingestion, and admin department metadata.
-- Run in Supabase SQL editor after the existing support ticket migrations.
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- 1) Admin department metadata
-- --------------------------------------------------------------------------
ALTER TABLE public.admins
  ADD COLUMN IF NOT EXISTS department VARCHAR(100) NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS crm_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS crm_meta JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_admins_department ON public.admins(department);

-- --------------------------------------------------------------------------
-- 2) CRM departments
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_key VARCHAR(100) NOT NULL UNIQUE,
  department_name VARCHAR(150) NOT NULL,
  description TEXT,
  email_alias VARCHAR(255),
  route_priority INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_departments_active ON public.crm_departments(is_active, route_priority);

INSERT INTO public.crm_departments (
  department_key,
  department_name,
  description,
  email_alias,
  route_priority
)
VALUES
  ('general', 'General', 'Fallback queue for unmatched requests and general admin work.', 'general@charterkeke.com', 10),
  ('support', 'Customer Support', 'Customer complaints, rider requests, account help, and standard support.', 'support@charterkeke.com', 20),
  ('billing', 'Billing', 'Payment disputes, receipts, refunds, and fare investigations.', 'billing@charterkeke.com', 30),
  ('operations', 'Operations', 'Dispatch, ride workflow, operational escalations, and daily coordination.', 'operations@charterkeke.com', 40),
  ('rider_management', 'Rider Management', 'Driver and rider relationship issues, rider assignment investigations.', 'riders@charterkeke.com', 50),
  ('trust_safety', 'Trust and Safety', 'Fraud, complaints, safety incidents, abuse, and policy violations.', 'safety@charterkeke.com', 60),
  ('technical', 'Technical Support', 'App bugs, API errors, and platform incidents.', 'tech@charterkeke.com', 70),
  ('engineering', 'Engineering', 'Code-level defects, integration issues, and release triage.', 'engineering@charterkeke.com', 80),
  ('product', 'Product and Systems', 'Feature feedback, workflow changes, and internal product requests.', 'product@charterkeke.com', 90),
  ('finance', 'Finance', 'Reconciliations, payout reviews, settlements, and accounting checks.', 'finance@charterkeke.com', 100)
ON CONFLICT (department_key) DO UPDATE
SET
  department_name = EXCLUDED.department_name,
  description = EXCLUDED.description,
  email_alias = EXCLUDED.email_alias,
  route_priority = EXCLUDED.route_priority,
  updated_at = NOW();

-- --------------------------------------------------------------------------
-- 3) Extend support tickets for CRM routing metadata
-- --------------------------------------------------------------------------
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.crm_departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_channel VARCHAR(50) NOT NULL DEFAULT 'in_app',
  ADD COLUMN IF NOT EXISTS source_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS source_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS external_thread_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS external_message_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS routing_reason TEXT,
  ADD COLUMN IF NOT EXISTS routing_confidence NUMERIC(5, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS crm_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_support_tickets_department_id ON public.support_tickets(department_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_source_channel ON public.support_tickets(source_channel);
CREATE INDEX IF NOT EXISTS idx_support_tickets_external_thread_id ON public.support_tickets(external_thread_id);

-- --------------------------------------------------------------------------
-- 4) Internal notes and team timeline
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.crm_departments(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  visibility VARCHAR(30) NOT NULL DEFAULT 'internal' CHECK (visibility IN ('internal', 'department', 'super_admin')),
  mentions JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_internal_notes_ticket_id ON public.crm_internal_notes(ticket_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_internal_notes_department_id ON public.crm_internal_notes(department_id);
CREATE INDEX IF NOT EXISTS idx_crm_internal_notes_author_admin_id ON public.crm_internal_notes(author_admin_id);

-- --------------------------------------------------------------------------
-- 5) Email ingestion and routing tables
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name VARCHAR(150) NOT NULL,
  email_address VARCHAR(255) NOT NULL UNIQUE,
  provider VARCHAR(80) NOT NULL DEFAULT 'custom_imap',
  department_id UUID REFERENCES public.crm_departments(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_synced_at TIMESTAMP,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.crm_email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_account_id UUID REFERENCES public.crm_email_accounts(id) ON DELETE SET NULL,
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE SET NULL,
  direction VARCHAR(30) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_email VARCHAR(255) NOT NULL,
  from_name VARCHAR(255),
  to_emails JSONB NOT NULL DEFAULT '[]'::jsonb,
  cc_emails JSONB NOT NULL DEFAULT '[]'::jsonb,
  bcc_emails JSONB NOT NULL DEFAULT '[]'::jsonb,
  subject VARCHAR(500) NOT NULL,
  body_text TEXT,
  body_html TEXT,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  external_message_id VARCHAR(255),
  external_thread_id VARCHAR(255),
  processing_status VARCHAR(40) NOT NULL DEFAULT 'queued' CHECK (processing_status IN ('queued', 'processed', 'failed', 'ignored')),
  processing_reason TEXT,
  raw_headers JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  received_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_email_messages_ticket_id ON public.crm_email_messages(ticket_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_email_messages_external_thread_id ON public.crm_email_messages(external_thread_id);
CREATE INDEX IF NOT EXISTS idx_crm_email_messages_processing_status ON public.crm_email_messages(processing_status, direction);

CREATE TABLE IF NOT EXISTS public.crm_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name VARCHAR(150) NOT NULL,
  match_scope VARCHAR(50) NOT NULL DEFAULT 'subject_body' CHECK (match_scope IN ('subject_body', 'recipient', 'sender', 'all')),
  match_pattern TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES public.crm_departments(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 100,
  auto_assign BOOLEAN NOT NULL DEFAULT TRUE,
  auto_reply BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_routing_rules_department_id ON public.crm_routing_rules(department_id, is_active, priority);

-- --------------------------------------------------------------------------
-- 6) Routing helpers
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crm_resolve_department_key(
  p_subject TEXT,
  p_body TEXT,
  p_sender_email TEXT,
  p_recipient_email TEXT
)
RETURNS VARCHAR
LANGUAGE plpgsql
AS $$
DECLARE
  v_department_key VARCHAR(100) := 'general';
  v_text TEXT := LOWER(COALESCE(p_subject, '') || ' ' || COALESCE(p_body, '') || ' ' || COALESCE(p_sender_email, '') || ' ' || COALESCE(p_recipient_email, ''));
BEGIN
  SELECT d.department_key
  INTO v_department_key
  FROM public.crm_routing_rules r
  JOIN public.crm_departments d ON d.id = r.department_id
  WHERE r.is_active = TRUE
    AND (
      (r.match_scope IN ('subject_body', 'all') AND v_text ~* r.match_pattern) OR
      (r.match_scope IN ('recipient', 'all') AND LOWER(COALESCE(p_recipient_email, '')) LIKE '%' || LOWER(r.match_pattern) || '%') OR
      (r.match_scope IN ('sender', 'all') AND LOWER(COALESCE(p_sender_email, '')) LIKE '%' || LOWER(r.match_pattern) || '%')
    )
  ORDER BY r.priority ASC, d.route_priority ASC
  LIMIT 1;

  IF v_department_key IS NOT NULL THEN
    RETURN v_department_key;
  END IF;

  IF v_text LIKE '%billing%' OR v_text LIKE '%payment%' OR v_text LIKE '%fare%' OR v_text LIKE '%refund%' THEN
    RETURN 'billing';
  ELSIF v_text LIKE '%safety%' OR v_text LIKE '%fraud%' OR v_text LIKE '%abuse%' OR v_text LIKE '%harass%' THEN
    RETURN 'trust_safety';
  ELSIF v_text LIKE '%driver%' OR v_text LIKE '%rider%' OR v_text LIKE '%ride%' OR v_text LIKE '%dispatch%' THEN
    RETURN 'operations';
  ELSIF v_text LIKE '%bug%' OR v_text LIKE '%crash%' OR v_text LIKE '%error%' OR v_text LIKE '%api%' THEN
    RETURN 'technical';
  ELSIF v_text LIKE '%engineer%' OR v_text LIKE '%integration%' OR v_text LIKE '%release%' THEN
    RETURN 'engineering';
  END IF;

  RETURN 'general';
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_pick_admin_for_department(
  p_department_key VARCHAR
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  SELECT a.id
  INTO v_admin_id
  FROM public.admins a
  JOIN public.users u ON u.id = a.user_id
  WHERE a.crm_enabled = TRUE
    AND COALESCE(a.department, 'general') = COALESCE(p_department_key, 'general')
    AND u.status = 'active'
  ORDER BY COALESCE((a.crm_meta->>'last_assigned_at')::TIMESTAMP, 'epoch'::TIMESTAMP) ASC, a.created_at ASC
  LIMIT 1;

  RETURN v_admin_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_prepare_support_ticket()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_department_key VARCHAR(100);
  v_department_id UUID;
  v_assigned_admin UUID;
  v_sender_email VARCHAR(255);
  v_recipient_email VARCHAR(255);
BEGIN
  NEW.crm_metadata = COALESCE(NEW.crm_metadata, '{}'::jsonb);
  NEW.source_channel = COALESCE(NEW.source_channel, 'in_app');

  IF NEW.department_id IS NULL OR NEW.assigned_to IS NULL THEN
    v_sender_email := NULLIF(COALESCE(NEW.source_email, NEW.crm_metadata->>'sender_email'), '');
    v_recipient_email := NULLIF(NEW.crm_metadata->>'recipient_email', '');
    v_department_key := public.crm_resolve_department_key(NEW.subject, NEW.description, v_sender_email, v_recipient_email);

    SELECT id
    INTO v_department_id
    FROM public.crm_departments
    WHERE department_key = v_department_key
    LIMIT 1;

    IF NEW.department_id IS NULL THEN
      NEW.department_id = v_department_id;
    END IF;

    IF NEW.assigned_to IS NULL THEN
      v_assigned_admin := public.crm_pick_admin_for_department(v_department_key);
      NEW.assigned_to = v_assigned_admin;

      IF v_assigned_admin IS NOT NULL THEN
        UPDATE public.admins
        SET crm_meta = jsonb_set(
          COALESCE(crm_meta, '{}'::jsonb),
          '{last_assigned_at}',
          to_jsonb(NOW()::text),
          TRUE
        )
        WHERE id = v_assigned_admin;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_prepare_support_ticket ON public.support_tickets;
CREATE TRIGGER trg_crm_prepare_support_ticket
BEFORE INSERT ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.crm_prepare_support_ticket();

-- --------------------------------------------------------------------------
-- 7) Updated-at triggers for new CRM tables
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crm_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_departments_updated_at ON public.crm_departments;
CREATE TRIGGER trg_crm_departments_updated_at
BEFORE UPDATE ON public.crm_departments
FOR EACH ROW
EXECUTE FUNCTION public.crm_set_updated_at();

DROP TRIGGER IF EXISTS trg_crm_internal_notes_updated_at ON public.crm_internal_notes;
CREATE TRIGGER trg_crm_internal_notes_updated_at
BEFORE UPDATE ON public.crm_internal_notes
FOR EACH ROW
EXECUTE FUNCTION public.crm_set_updated_at();

DROP TRIGGER IF EXISTS trg_crm_email_accounts_updated_at ON public.crm_email_accounts;
CREATE TRIGGER trg_crm_email_accounts_updated_at
BEFORE UPDATE ON public.crm_email_accounts
FOR EACH ROW
EXECUTE FUNCTION public.crm_set_updated_at();

DROP TRIGGER IF EXISTS trg_crm_email_messages_updated_at ON public.crm_email_messages;
CREATE TRIGGER trg_crm_email_messages_updated_at
BEFORE UPDATE ON public.crm_email_messages
FOR EACH ROW
EXECUTE FUNCTION public.crm_set_updated_at();

DROP TRIGGER IF EXISTS trg_crm_routing_rules_updated_at ON public.crm_routing_rules;
CREATE TRIGGER trg_crm_routing_rules_updated_at
BEFORE UPDATE ON public.crm_routing_rules
FOR EACH ROW
EXECUTE FUNCTION public.crm_set_updated_at();

-- --------------------------------------------------------------------------
-- 8) Realtime friendliness
-- --------------------------------------------------------------------------
ALTER TABLE public.support_tickets REPLICA IDENTITY FULL;
ALTER TABLE public.crm_internal_notes REPLICA IDENTITY FULL;
ALTER TABLE public.crm_email_messages REPLICA IDENTITY FULL;

COMMIT;