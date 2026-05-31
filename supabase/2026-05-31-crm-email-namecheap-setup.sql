-- Charter Keke CRM email setup for Namecheap Private Email.
-- Run this in Supabase after the CRM tables exist.

insert into public.crm_departments (department_key, department_name, description, email_alias, route_priority, is_active)
values
  ('general', 'General', 'General customer operations inbox.', 'general@charterkeke.com', 100, true),
  ('support', 'Customer Support', 'General rider and driver support.', 'support@charterkeke.com', 10, true),
  ('billing', 'Billing', 'Payments, refunds, remittance, fares, and finance-facing billing issues.', 'billing@charterkeke.com', 20, true),
  ('operations', 'Operations', 'Dispatch, ride operations, driver coordination, and field operations.', 'operations@charterkeke.com', 30, true),
  ('trust_safety', 'Trust and Safety', 'Safety, abuse, fraud, emergency, and incident reports.', 'safety@charterkeke.com', 15, true),
  ('rider_management', 'Rider Management', 'Rider, driver, fleet, and assignment management.', 'riders@charterkeke.com', 40, true),
  ('technical', 'Technical Support', 'Bugs, login issues, app errors, and technical support.', 'tech@charterkeke.com', 25, true),
  ('engineering', 'Engineering', 'Engineering escalations, integrations, releases, and platform issues.', 'engineering@charterkeke.com', 70, true),
  ('product', 'Product and Systems', 'Feature requests, product workflow, and system feedback.', 'product@charterkeke.com', 80, true),
  ('finance', 'Finance', 'Settlements, remittance, reconciliation, and payout operations.', 'finance@charterkeke.com', 35, true)
on conflict (department_key) do update
set
  department_name = excluded.department_name,
  description = excluded.description,
  email_alias = excluded.email_alias,
  route_priority = excluded.route_priority,
  is_active = true,
  updated_at = now();

insert into public.crm_email_accounts (display_name, email_address, provider, department_id, is_active, settings)
select
  d.department_name,
  d.email_alias,
  'namecheap_private_email',
  d.id,
  true,
  jsonb_build_object(
    'imapHost', 'imap.privateemail.com',
    'imapPort', 993,
    'smtpHost', 'smtp.privateemail.com',
    'smtpPort', 465,
    'ssl', true,
    'catchAllMailbox', 'support@charterkeke.com'
  )
from public.crm_departments d
where d.email_alias is not null
on conflict (email_address) do update
set
  display_name = excluded.display_name,
  provider = excluded.provider,
  department_id = excluded.department_id,
  is_active = true,
  settings = excluded.settings,
  updated_at = now();
