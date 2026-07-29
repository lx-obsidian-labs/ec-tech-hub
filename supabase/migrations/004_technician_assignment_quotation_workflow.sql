-- EC TECH HUB technician assignment, diagnosis, quotation, messaging, and progress workflow
-- Apply after 003_repair_tracking_schema.sql.

alter type public.repair_request_status add value if not exists 'diagnosis_complete';
alter type public.repair_request_status add value if not exists 'quotation_sent';
alter type public.repair_request_status add value if not exists 'quotation_rejected';
alter type public.repair_request_status add value if not exists 'testing';
alter type public.repair_request_status add value if not exists 'quality_check';

do $$ begin
  create type public.repair_assignment_method as enum ('automatic', 'manual_admin', 'technician_claim');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.repair_assignment_decision as enum ('accepted', 'declined', 'requested_more_information', 'reassigned');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.repair_complexity as enum ('simple', 'moderate', 'complex', 'specialist');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.repair_progress_stage as enum ('repair_started', 'waiting_for_parts', 'testing', 'quality_check', 'ready_for_collection', 'completed');
exception when duplicate_object then null;
end $$;

alter table public.repair_requests
  add column if not exists assignment_method public.repair_assignment_method,
  add column if not exists assigned_at timestamptz,
  add column if not exists diagnosis_submitted_at timestamptz,
  add column if not exists quotation_sent_at timestamptz,
  add column if not exists repair_started_at timestamptz;

create table if not exists public.repair_assignment_rules (
  id uuid primary key default gen_random_uuid(),
  device_category text,
  province text,
  city text,
  require_verified boolean not null default true,
  max_active_jobs int not null default 5,
  performance_weight numeric(5,2) not null default 1,
  area_weight numeric(5,2) not null default 1,
  specialization_weight numeric(5,2) not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.repair_assignment_attempts (
  id uuid primary key default gen_random_uuid(),
  repair_request_id uuid not null references public.repair_requests(id) on delete cascade,
  technician_profile_id uuid not null references public.profiles(id),
  method public.repair_assignment_method not null default 'technician_claim',
  decision public.repair_assignment_decision,
  decline_reason text,
  decision_note text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists public.repair_diagnoses (
  id uuid primary key default gen_random_uuid(),
  repair_request_id uuid not null references public.repair_requests(id) on delete cascade,
  technician_profile_id uuid not null references public.profiles(id),
  summary text not null,
  observed_faults text not null,
  required_parts text,
  estimated_duration text,
  complexity public.repair_complexity not null default 'moderate',
  priority text not null default 'normal' check (priority in ('low', 'normal', 'urgent', 'safety')),
  public_notes text,
  private_notes text,
  submitted boolean not null default false,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.repair_quotes
  add column if not exists version int not null default 1,
  add column if not exists supersedes_quote_id uuid references public.repair_quotes(id),
  add column if not exists service_fee_amount numeric(12,2),
  add column if not exists discount_amount numeric(12,2),
  add column if not exists tax_amount numeric(12,2),
  add column if not exists total_amount numeric(12,2),
  add column if not exists estimated_completion_at timestamptz,
  add column if not exists warranty_note text,
  add column if not exists technician_profile_id uuid references public.profiles(id);

create table if not exists public.repair_quote_line_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.repair_quotes(id) on delete cascade,
  item_type text not null check (item_type in ('labour', 'part', 'service_fee', 'additional', 'discount', 'tax')),
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.repair_parts (
  id uuid primary key default gen_random_uuid(),
  repair_request_id uuid not null references public.repair_requests(id) on delete cascade,
  technician_profile_id uuid not null references public.profiles(id),
  part_name text not null,
  quantity int not null default 1 check (quantity > 0),
  condition text not null check (condition in ('new', 'refurbished', 'used')),
  warranty_note text,
  cost_amount numeric(12,2),
  currency text not null default 'ZAR',
  created_at timestamptz not null default now()
);

create table if not exists public.repair_messages (
  id uuid primary key default gen_random_uuid(),
  repair_request_id uuid not null references public.repair_requests(id) on delete cascade,
  sender_profile_id uuid not null references public.profiles(id),
  sender_role text not null check (sender_role in ('customer', 'technician', 'business', 'administrator', 'system')),
  message text not null,
  attachment_path text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.repair_progress_photos (
  id uuid primary key default gen_random_uuid(),
  repair_request_id uuid not null references public.repair_requests(id) on delete cascade,
  technician_profile_id uuid not null references public.profiles(id),
  phase text not null check (phase in ('before', 'during', 'completed')),
  storage_bucket text not null default 'repair-attachments',
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

alter table public.repair_assignment_rules enable row level security;
alter table public.repair_assignment_attempts enable row level security;
alter table public.repair_diagnoses enable row level security;
alter table public.repair_quote_line_items enable row level security;
alter table public.repair_parts enable row level security;
alter table public.repair_messages enable row level security;
alter table public.repair_progress_photos enable row level security;

create policy "Assigned technicians can create customer-visible status events" on public.repair_status_events for insert with check (
  visibility = 'customer'
  and exists (select 1 from public.repair_requests r join public.profiles p on p.auth_user_id = auth.uid() where r.id = repair_status_events.repair_request_id and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))
);

create policy "Assigned technicians can create public repair updates" on public.repair_updates for insert with check (
  is_public = true
  and exists (select 1 from public.repair_requests r join public.profiles p on p.auth_user_id = auth.uid() where r.id = repair_updates.repair_request_id and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))
);

create policy "Assigned technicians can read repair quotes" on public.repair_quotes for select using (
  exists (select 1 from public.repair_requests r join public.profiles p on p.auth_user_id = auth.uid() where r.id = repair_quotes.repair_request_id and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))
);

create policy "Assigned technicians can create repair quotes" on public.repair_quotes for insert with check (
  exists (select 1 from public.repair_requests r join public.profiles p on p.auth_user_id = auth.uid() where r.id = repair_quotes.repair_request_id and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))
);

create policy "Repair participants can create notifications" on public.repair_notifications for insert with check (
  exists (select 1 from public.repair_requests r join public.profiles p on p.auth_user_id = auth.uid() where r.id = repair_notifications.repair_request_id and (r.profile_id = repair_notifications.profile_id or r.assigned_technician_profile_id = repair_notifications.profile_id) and (r.auth_user_id = auth.uid() or p.id = r.assigned_technician_profile_id or p.role = 'administrator'))
);

create policy "Technicians can read open and assigned repair requests" on public.repair_requests for select using (
  exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and p.role in ('technician', 'administrator'))
  and (assigned_technician_profile_id is null or exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and (p.id = assigned_technician_profile_id or p.role = 'administrator')))
);

create policy "Assigned technicians can update workflow repair requests" on public.repair_requests for update using (
  exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and (p.id = assigned_technician_profile_id or p.role = 'administrator'))
) with check (
  exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and (p.id = assigned_technician_profile_id or p.role = 'administrator'))
);

create policy "Technicians can claim unassigned repair requests" on public.repair_requests for update using (
  assigned_technician_profile_id is null
  and status in ('submitted', 'reviewing', 'awaiting_assignment')
  and exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and p.role in ('technician', 'administrator'))
) with check (
  exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and (p.id = assigned_technician_profile_id or p.role = 'administrator'))
);

create policy "Technicians can read assignment attempts for their work" on public.repair_assignment_attempts for select using (
  exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and (p.id = technician_profile_id or p.role = 'administrator'))
);
create policy "Technicians can create assignment attempts" on public.repair_assignment_attempts for insert with check (
  exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and (p.id = technician_profile_id or p.role = 'administrator'))
);
create policy "Technicians can update their assignment attempts" on public.repair_assignment_attempts for update using (
  exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and (p.id = technician_profile_id or p.role = 'administrator'))
) with check (
  exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and (p.id = technician_profile_id or p.role = 'administrator'))
);

create policy "Repair participants can read submitted diagnoses" on public.repair_diagnoses for select using (
  exists (select 1 from public.repair_requests r where r.id = repair_diagnoses.repair_request_id and (r.auth_user_id = auth.uid() or exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))))
);
create policy "Assigned technicians can manage diagnoses" on public.repair_diagnoses for all using (
  exists (select 1 from public.profiles p join public.repair_requests r on r.id = repair_diagnoses.repair_request_id where p.auth_user_id = auth.uid() and (p.id = repair_diagnoses.technician_profile_id or p.role = 'administrator') and (r.assigned_technician_profile_id = p.id or p.role = 'administrator'))
) with check (
  exists (select 1 from public.profiles p join public.repair_requests r on r.id = repair_diagnoses.repair_request_id where p.auth_user_id = auth.uid() and (p.id = repair_diagnoses.technician_profile_id or p.role = 'administrator') and (r.assigned_technician_profile_id = p.id or p.role = 'administrator'))
);

create policy "Repair participants can read quote line items" on public.repair_quote_line_items for select using (
  exists (select 1 from public.repair_quotes q join public.repair_requests r on r.id = q.repair_request_id where q.id = repair_quote_line_items.quote_id and (r.auth_user_id = auth.uid() or exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))))
);
create policy "Assigned technicians can create quote line items" on public.repair_quote_line_items for insert with check (
  exists (select 1 from public.repair_quotes q join public.repair_requests r on r.id = q.repair_request_id join public.profiles p on p.auth_user_id = auth.uid() where q.id = repair_quote_line_items.quote_id and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))
);

create policy "Repair participants can read parts" on public.repair_parts for select using (
  exists (select 1 from public.repair_requests r where r.id = repair_parts.repair_request_id and (r.auth_user_id = auth.uid() or exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))))
);
create policy "Assigned technicians can manage parts" on public.repair_parts for all using (
  exists (select 1 from public.repair_requests r join public.profiles p on p.auth_user_id = auth.uid() where r.id = repair_parts.repair_request_id and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))
) with check (
  exists (select 1 from public.repair_requests r join public.profiles p on p.auth_user_id = auth.uid() where r.id = repair_parts.repair_request_id and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))
);

create policy "Repair participants can read messages" on public.repair_messages for select using (
  exists (select 1 from public.repair_requests r where r.id = repair_messages.repair_request_id and (r.auth_user_id = auth.uid() or exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))))
);
create policy "Repair participants can send messages" on public.repair_messages for insert with check (
  exists (select 1 from public.repair_requests r join public.profiles p on p.auth_user_id = auth.uid() where r.id = repair_messages.repair_request_id and p.id = repair_messages.sender_profile_id and (r.auth_user_id = auth.uid() or p.id = r.assigned_technician_profile_id or p.role = 'administrator'))
);

create policy "Repair participants can read progress photos" on public.repair_progress_photos for select using (
  exists (select 1 from public.repair_requests r where r.id = repair_progress_photos.repair_request_id and (r.auth_user_id = auth.uid() or exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))))
);
create policy "Assigned technicians can create progress photos" on public.repair_progress_photos for insert with check (
  exists (select 1 from public.repair_requests r join public.profiles p on p.auth_user_id = auth.uid() where r.id = repair_progress_photos.repair_request_id and p.id = repair_progress_photos.technician_profile_id and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))
);

create index if not exists repair_requests_assigned_status_idx on public.repair_requests (assigned_technician_profile_id, status, updated_at desc);
create index if not exists repair_assignment_attempts_request_idx on public.repair_assignment_attempts (repair_request_id, created_at desc);
create index if not exists repair_diagnoses_request_idx on public.repair_diagnoses (repair_request_id, created_at desc);
create index if not exists repair_quote_line_items_quote_idx on public.repair_quote_line_items (quote_id);
create index if not exists repair_messages_request_idx on public.repair_messages (repair_request_id, created_at desc);
create index if not exists repair_parts_request_idx on public.repair_parts (repair_request_id, created_at desc);