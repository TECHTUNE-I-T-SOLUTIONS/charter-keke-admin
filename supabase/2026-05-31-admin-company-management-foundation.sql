-- Charter Keke admin/company-management foundation.
-- Run this in Supabase before enabling the new HR/department messaging workflows.

alter table if exists public.admins
  add column if not exists admin_level varchar(40) default 'admin',
  add column if not exists department varchar(80) default 'general',
  add column if not exists crm_enabled boolean default false,
  add column if not exists permissions jsonb default '{}'::jsonb;

update public.admins
set
  admin_level = coalesce(admin_level, 'admin'),
  department = coalesce(department, 'general'),
  crm_enabled = case
    when coalesce(lower(department), '') in ('support', 'general', 'customer_support') then true
    else coalesce(crm_enabled, false)
  end,
  permissions = coalesce(permissions, '{}'::jsonb);

insert into public.crm_departments (department_key, department_name, description, email_alias, route_priority, is_active)
values
  ('hr', 'Human Resources', 'Admin onboarding, staff operations, driver onboarding coordination, and internal people operations.', 'hr@charterkeke.com', 60, true)
on conflict (department_key) do update set
  department_name = excluded.department_name,
  description = excluded.description,
  email_alias = excluded.email_alias,
  route_priority = excluded.route_priority,
  is_active = true,
  updated_at = now();

create table if not exists public.admin_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  is_active boolean not null default true,
  last_seen_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_admin_push_subscriptions_admin_user_id
  on public.admin_push_subscriptions(admin_user_id);

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid references public.users(id) on delete cascade,
  recipient_department varchar(80),
  title text not null,
  body text not null,
  type varchar(80) not null default 'admin_event',
  action_url text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint admin_notifications_recipient_check check (
    recipient_user_id is not null or recipient_department is not null
  )
);

create index if not exists idx_admin_notifications_recipient_user
  on public.admin_notifications(recipient_user_id, read_at, created_at desc);

create index if not exists idx_admin_notifications_department
  on public.admin_notifications(recipient_department, read_at, created_at desc);

create table if not exists public.admin_conversations (
  id uuid primary key default gen_random_uuid(),
  conversation_type varchar(30) not null check (conversation_type in ('department', 'direct', 'ticket')),
  department_key varchar(80),
  ticket_id uuid references public.support_tickets(id) on delete set null,
  title text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_admin_conversations_department
  on public.admin_conversations(department_key, updated_at desc);

create table if not exists public.admin_conversation_members (
  conversation_id uuid not null references public.admin_conversations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role varchar(30) not null default 'member',
  last_read_at timestamptz,
  created_at timestamptz default now(),
  primary key (conversation_id, user_id)
);

create index if not exists idx_admin_conversation_members_user
  on public.admin_conversation_members(user_id);

create table if not exists public.admin_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.admin_conversations(id) on delete cascade,
  sender_user_id uuid references public.users(id) on delete set null,
  body text not null,
  attachments jsonb not null default '[]'::jsonb,
  mentions uuid[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_admin_messages_conversation
  on public.admin_messages(conversation_id, created_at);

create index if not exists idx_admin_messages_mentions
  on public.admin_messages using gin(mentions);

create or replace function public.touch_admin_conversation_on_message()
returns trigger
language plpgsql
as $$
begin
  update public.admin_conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists trg_touch_admin_conversation_on_message on public.admin_messages;
create trigger trg_touch_admin_conversation_on_message
after insert on public.admin_messages
for each row execute function public.touch_admin_conversation_on_message();

create or replace function public.emit_admin_notification_event()
returns trigger
language plpgsql
as $$
begin
  perform pg_notify(
    'admin_notifications',
    json_build_object(
      'id', new.id,
      'recipientUserId', new.recipient_user_id,
      'recipientDepartment', new.recipient_department,
      'title', new.title,
      'body', new.body,
      'type', new.type,
      'actionUrl', new.action_url,
      'metadata', new.metadata,
      'createdAt', new.created_at
    )::text
  );

  return new;
end;
$$;

drop trigger if exists trg_emit_admin_notification_event on public.admin_notifications;
create trigger trg_emit_admin_notification_event
after insert on public.admin_notifications
for each row execute function public.emit_admin_notification_event();

create or replace function public.notify_admin_conversation_member_added()
returns trigger
language plpgsql
as $$
declare
  v_conversation public.admin_conversations%rowtype;
begin
  select *
  into v_conversation
  from public.admin_conversations
  where id = new.conversation_id;

  if new.user_id is not null and (v_conversation.created_by is null or new.user_id <> v_conversation.created_by) then
    insert into public.admin_notifications (
      recipient_user_id,
      title,
      body,
      type,
      action_url,
      metadata
    )
    values (
      new.user_id,
      'Added to admin conversation',
      coalesce(v_conversation.title, 'You were added to a new admin conversation.'),
      'admin_conversation_member_added',
      '/admin/messages?conversationId=' || new.conversation_id::text,
      jsonb_build_object(
        'conversationId', new.conversation_id,
        'conversationType', v_conversation.conversation_type,
        'departmentKey', v_conversation.department_key,
        'ticketId', v_conversation.ticket_id,
        'memberRole', new.role
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_admin_conversation_member_added on public.admin_conversation_members;
create trigger trg_notify_admin_conversation_member_added
after insert on public.admin_conversation_members
for each row execute function public.notify_admin_conversation_member_added();

create or replace function public.notify_admin_message_insert()
returns trigger
language plpgsql
as $$
declare
  v_conversation public.admin_conversations%rowtype;
  v_sender_name text;
  v_preview text;
begin
  select *
  into v_conversation
  from public.admin_conversations
  where id = new.conversation_id;

  select trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))
  into v_sender_name
  from public.users
  where id = new.sender_user_id;

  v_sender_name := nullif(v_sender_name, '');
  v_preview := left(regexp_replace(coalesce(new.body, ''), '\s+', ' ', 'g'), 160);

  -- Notify explicitly mentioned admins first.
  insert into public.admin_notifications (
    recipient_user_id,
    title,
    body,
    type,
    action_url,
    metadata
  )
  select
    mentioned_user_id,
    coalesce(v_sender_name, 'An admin') || ' mentioned you',
    v_preview,
    'admin_message_mention',
    '/admin/messages?conversationId=' || new.conversation_id::text,
    jsonb_build_object(
      'messageId', new.id,
      'conversationId', new.conversation_id,
      'conversationType', v_conversation.conversation_type,
      'departmentKey', v_conversation.department_key,
      'ticketId', v_conversation.ticket_id,
      'senderUserId', new.sender_user_id
    )
  from unnest(new.mentions) as mentioned_user_id
  where mentioned_user_id is not null
    and (new.sender_user_id is null or mentioned_user_id <> new.sender_user_id);

  -- Notify direct/ticket conversation members.
  if v_conversation.conversation_type in ('direct', 'ticket') then
    insert into public.admin_notifications (
      recipient_user_id,
      title,
      body,
      type,
      action_url,
      metadata
    )
    select
      member.user_id,
      coalesce(v_conversation.title, 'New admin message'),
      v_preview,
      'admin_message',
      '/admin/messages?conversationId=' || new.conversation_id::text,
      jsonb_build_object(
        'messageId', new.id,
        'conversationId', new.conversation_id,
        'conversationType', v_conversation.conversation_type,
        'departmentKey', v_conversation.department_key,
        'ticketId', v_conversation.ticket_id,
        'senderUserId', new.sender_user_id
      )
    from public.admin_conversation_members member
    where member.conversation_id = new.conversation_id
      and (new.sender_user_id is null or member.user_id <> new.sender_user_id)
      and not (member.user_id = any(new.mentions));
  end if;

  -- Notify every admin in the department, plus superadmins, for department channels.
  if v_conversation.conversation_type = 'department' and v_conversation.department_key is not null then
    insert into public.admin_notifications (
      recipient_user_id,
      recipient_department,
      title,
      body,
      type,
      action_url,
      metadata
    )
    select distinct
      admin.user_id,
      v_conversation.department_key,
      coalesce(v_conversation.title, initcap(replace(v_conversation.department_key, '_', ' ')) || ' message'),
      v_preview,
      'admin_department_message',
      '/admin/messages?conversationId=' || new.conversation_id::text,
      jsonb_build_object(
        'messageId', new.id,
        'conversationId', new.conversation_id,
        'conversationType', v_conversation.conversation_type,
        'departmentKey', v_conversation.department_key,
        'senderUserId', new.sender_user_id
      )
    from public.admins admin
    where admin.user_id is not null
      and (new.sender_user_id is null or admin.user_id <> new.sender_user_id)
      and not (admin.user_id = any(new.mentions))
      and (
        lower(coalesce(admin.department, '')) = lower(v_conversation.department_key)
        or lower(coalesce(admin.admin_level, '')) = 'super_admin'
      );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_admin_message_insert on public.admin_messages;
create trigger trg_notify_admin_message_insert
after insert on public.admin_messages
for each row execute function public.notify_admin_message_insert();

create or replace function public.notify_admin_department_conversation_created()
returns trigger
language plpgsql
as $$
begin
  if new.conversation_type = 'department' and new.department_key is not null then
    insert into public.admin_notifications (
      recipient_user_id,
      recipient_department,
      title,
      body,
      type,
      action_url,
      metadata
    )
    select distinct
      admin.user_id,
      new.department_key,
      'New department channel',
      coalesce(new.title, initcap(replace(new.department_key, '_', ' ')) || ' conversation') || ' is ready.',
      'admin_department_conversation_created',
      '/admin/messages?conversationId=' || new.id::text,
      jsonb_build_object(
        'conversationId', new.id,
        'conversationType', new.conversation_type,
        'departmentKey', new.department_key,
        'createdBy', new.created_by
      )
    from public.admins admin
    where admin.user_id is not null
      and (new.created_by is null or admin.user_id <> new.created_by)
      and (
        lower(coalesce(admin.department, '')) = lower(new.department_key)
        or lower(coalesce(admin.admin_level, '')) = 'super_admin'
      );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_admin_department_conversation_created on public.admin_conversations;
create trigger trg_notify_admin_department_conversation_created
after insert on public.admin_conversations
for each row execute function public.notify_admin_department_conversation_created();
