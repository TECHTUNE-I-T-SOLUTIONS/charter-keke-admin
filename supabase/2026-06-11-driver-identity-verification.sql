alter table public.drivers
  drop column if exists union_name,
  add column if not exists guarantor_name text,
  add column if not exists guarantor_phone text,
  add column if not exists guarantor_address text,
  add column if not exists bank_code text,
  add column if not exists nin_number text,
  add column if not exists identity_type text not null default 'nin',
  add column if not exists identity_last4 text,
  add column if not exists identity_document_url text,
  add column if not exists identity_verified boolean not null default false,
  add column if not exists identity_verification_status text not null default 'not_started',
  add column if not exists identity_verification_provider text,
  add column if not exists identity_verification_reference text,
  add column if not exists identity_verification_reason text,
  add column if not exists identity_verification_payload jsonb not null default '{}'::jsonb,
  add column if not exists identity_verified_at timestamptz;

alter table public.drivers
  drop column if exists identity_hash,
  drop column if exists paystack_customer_code;

alter table public.drivers
  drop constraint if exists drivers_identity_type_check,
  add constraint drivers_identity_type_check
    check (identity_type = 'nin');

alter table public.drivers
  drop constraint if exists drivers_identity_verification_status_check,
  add constraint drivers_identity_verification_status_check
    check (identity_verification_status in ('not_started', 'pending_details', 'pending', 'verified', 'failed'));

create index if not exists idx_drivers_identity_verification_status
  on public.drivers(identity_verification_status);

create index if not exists idx_drivers_nin_number
  on public.drivers(nin_number)
  where nin_number is not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'nin-documents',
  'nin-documents',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read NIN documents" on storage.objects;
create policy "Public read NIN documents"
on storage.objects
for select
using (bucket_id = 'nin-documents');

drop policy if exists "Service role manages NIN documents" on storage.objects;
create policy "Service role manages NIN documents"
on storage.objects
for all
using (bucket_id = 'nin-documents' and auth.role() = 'service_role')
with check (bucket_id = 'nin-documents' and auth.role() = 'service_role');
