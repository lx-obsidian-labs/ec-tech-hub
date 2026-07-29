-- EC TECH HUB repair tracking workspace schema
-- Apply after 002_repair_requests_schema.sql.

alter type public.repair_request_status add value if not exists 'awaiting_assignment';
alter type public.repair_request_status add value if not exists 'technician_assigned';
alter type public.repair_request_status add value if not exists 'diagnosis_started';
alter type public.repair_request_status add value if not exists 'waiting_for_customer_approval';
alter type public.repair_request_status add value if not exists 'waiting_for_parts';
alter type public.repair_request_status add value if not exists 'repair_in_progress';
alter type public.repair_request_status add value if not exists 'ready_for_collection';

do $$ begin
  create type public.repair_quote_status as enum ('awaiting_approval', 'approved', 'declined', 'expired', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.repair_event_visibility as enum ('customer', 'technician', 'internal');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.repair_notification_type as enum ('status_changed', 'technician_assigned', 'quote_available', 'message', 'repair_completed', 'system');
exception when duplicate_object then null;
end $$;

alter table public.repair_requests
  add column if not exists assigned_technician_profile_id uuid references public.profiles(id),
  add column if not exists estimated_completion_at timestamptz,
  add column if not exists estimated_completion_confidence text check (estimated_completion_confidence in ('low', 'medium', 'high')),
  add column if not exists cancelled_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists customer_confirmed_at timestamptz;

create table if not exists public.repair_status_events (
  id uuid primary key default gen_random_uuid(),
  repair_request_id uuid not null references public.repair_requests(id) on delete cascade,
  status public.repair_request_status not null,
  title text not null,
  description text,
  responsible_party text not null default 'EC TECH HUB' check (responsible_party in ('customer', 'technician', 'EC TECH HUB', 'system')),
  visibility public.repair_event_visibility not null default 'customer',
  created_by_profile_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.repair_updates (
  id uuid primary key default gen_random_uuid(),
  repair_request_id uuid not null references public.repair_requests(id) on delete cascade,
  author_profile_id uuid references public.profiles(id),
  author_role text not null default 'system' check (author_role in ('customer', 'technician', 'business', 'administrator', 'system')),
  title text not null,
  message text not null,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.repair_quotes (
  id uuid primary key default gen_random_uuid(),
  repair_request_id uuid not null references public.repair_requests(id) on delete cascade,
  labour_amount numeric(12,2),
  parts_amount numeric(12,2),
  additional_fees_amount numeric(12,2),
  currency text not null default 'ZAR',
  status public.repair_quote_status not null default 'awaiting_approval',
  notes text,
  created_by_profile_id uuid references public.profiles(id),
  approved_at timestamptz,
  declined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint repair_quote_non_negative_amounts check (
    coalesce(labour_amount, 0) >= 0 and coalesce(parts_amount, 0) >= 0 and coalesce(additional_fees_amount, 0) >= 0
  )
);

create table if not exists public.repair_notifications (
  id uuid primary key default gen_random_uuid(),
  repair_request_id uuid not null references public.repair_requests(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  type public.repair_notification_type not null default 'system',
  title text not null,
  message text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.repair_status_events enable row level security;
alter table public.repair_updates enable row level security;
alter table public.repair_quotes enable row level security;
alter table public.repair_notifications enable row level security;

create policy "Repair owners can read customer-visible status events" on public.repair_status_events for select using (
  visibility = 'customer'
  and exists (
    select 1 from public.repair_requests r
    where r.id = repair_status_events.repair_request_id and r.auth_user_id = auth.uid()
  )
);

create policy "Repair owners can read public repair updates" on public.repair_updates for select using (
  is_public = true
  and exists (
    select 1 from public.repair_requests r
    where r.id = repair_updates.repair_request_id and r.auth_user_id = auth.uid()
  )
);

create policy "Repair owners can read their repair quotes" on public.repair_quotes for select using (
  exists (
    select 1 from public.repair_requests r
    where r.id = repair_quotes.repair_request_id and r.auth_user_id = auth.uid()
  )
);

create policy "Repair owners can update quote decisions" on public.repair_quotes for update using (
  status = 'awaiting_approval'
  and exists (
    select 1 from public.repair_requests r
    where r.id = repair_quotes.repair_request_id and r.auth_user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.repair_requests r
    where r.id = repair_quotes.repair_request_id and r.auth_user_id = auth.uid()
  )
);

create policy "Repair owners can read repair notifications" on public.repair_notifications for select using (
  exists (select 1 from public.profiles p where p.id = repair_notifications.profile_id and p.auth_user_id = auth.uid())
);

create policy "Repair owners can add additional repair attachments" on public.repair_request_attachments for insert with check (
  exists (select 1 from public.profiles p where p.id = repair_request_attachments.profile_id and p.auth_user_id = auth.uid())
  and exists (select 1 from public.repair_requests r where r.id = repair_request_attachments.repair_request_id and r.auth_user_id = auth.uid())
);

create index if not exists repair_status_events_request_created_idx on public.repair_status_events (repair_request_id, created_at desc);
create index if not exists repair_updates_request_created_idx on public.repair_updates (repair_request_id, created_at desc);
create index if not exists repair_quotes_request_created_idx on public.repair_quotes (repair_request_id, created_at desc);
create index if not exists repair_notifications_profile_created_idx on public.repair_notifications (profile_id, created_at desc);