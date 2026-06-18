-- Mobile push campaigns for Charter Keke admin
-- Stores campaign drafts, sent campaigns, and per-recipient delivery history.

create table if not exists public.mobile_push_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  target_audience text not null default 'all',
  recipient_count integer not null default 0,
  delivered_count integer not null default 0,
  opened_count integer not null default 0,
  image_url text null,
  action_url text null,
  cta_label text null,
  category_id text not null default 'mobile_campaign',
  status text not null default 'draft' check (status in ('draft', 'sending', 'sent', 'failed', 'cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid null references public.users(id) on delete set null,
  sent_at timestamptz null,
  last_sent_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_mobile_push_campaigns_created_at on public.mobile_push_campaigns (created_at desc);
create index if not exists idx_mobile_push_campaigns_status on public.mobile_push_campaigns (status);
create index if not exists idx_mobile_push_campaigns_target_audience on public.mobile_push_campaigns (target_audience);

create table if not exists public.mobile_push_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.mobile_push_campaigns(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'read', 'opened')),
  error_message text null,
  sent_at timestamptz null,
  opened_at timestamptz null,
  read_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, user_id)
);

create index if not exists idx_mobile_push_campaign_recipients_campaign_id on public.mobile_push_campaign_recipients (campaign_id);
create index if not exists idx_mobile_push_campaign_recipients_user_id on public.mobile_push_campaign_recipients (user_id);
create index if not exists idx_mobile_push_campaign_recipients_status on public.mobile_push_campaign_recipients (status);

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_mobile_push_campaigns_updated_at on public.mobile_push_campaigns;
create trigger set_mobile_push_campaigns_updated_at
before update on public.mobile_push_campaigns
for each row execute procedure public.update_updated_at_column();

drop trigger if exists set_mobile_push_campaign_recipients_updated_at on public.mobile_push_campaign_recipients;
create trigger set_mobile_push_campaign_recipients_updated_at
before update on public.mobile_push_campaign_recipients
for each row execute procedure public.update_updated_at_column();

alter table public.mobile_push_campaigns enable row level security;
alter table public.mobile_push_campaign_recipients enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'mobile_push_campaigns' and policyname = 'service role manages mobile push campaigns'
  ) then
    execute 'create policy "service role manages mobile push campaigns"
      on public.mobile_push_campaigns
      for all
      using (true)
      with check (true)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'mobile_push_campaign_recipients' and policyname = 'service role manages mobile push campaign recipients'
  ) then
    execute 'create policy "service role manages mobile push campaign recipients"
      on public.mobile_push_campaign_recipients
      for all
      using (true)
      with check (true)';
  end if;
end $$;
