-- EC TECH HUB diagnosis and repair execution workspace schema
-- Apply after 004_technician_assignment_quotation_workflow.sql.

alter table public.repair_diagnoses
  add column if not exists likely_cause text,
  add column if not exists confirmed_cause text,
  add column if not exists repair_recommendation text;

alter table public.repair_parts
  add column if not exists part_number text,
  add column if not exists supplier text,
  add column if not exists installed_at timestamptz;

create table if not exists public.repair_inspection_items (
  id uuid primary key default gen_random_uuid(),
  repair_request_id uuid not null references public.repair_requests(id) on delete cascade,
  technician_profile_id uuid not null references public.profiles(id),
  item_key text not null,
  label text not null,
  result text not null default 'not_tested' check (result in ('pass', 'fail', 'not_tested')),
  notes text,
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (repair_request_id, item_key)
);

create table if not exists public.repair_execution_checklist_items (
  id uuid primary key default gen_random_uuid(),
  repair_request_id uuid not null references public.repair_requests(id) on delete cascade,
  technician_profile_id uuid not null references public.profiles(id),
  item_key text not null,
  label text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (repair_request_id, item_key)
);

create table if not exists public.repair_testing_items (
  id uuid primary key default gen_random_uuid(),
  repair_request_id uuid not null references public.repair_requests(id) on delete cascade,
  technician_profile_id uuid not null references public.profiles(id),
  item_key text not null,
  label text not null,
  result text not null default 'retest' check (result in ('pass', 'fail', 'retest')),
  notes text,
  tested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (repair_request_id, item_key)
);

create table if not exists public.repair_time_entries (
  id uuid primary key default gen_random_uuid(),
  repair_request_id uuid not null references public.repair_requests(id) on delete cascade,
  technician_profile_id uuid not null references public.profiles(id),
  category text not null check (category in ('diagnosis', 'repair', 'testing', 'paused')),
  minutes int not null default 0 check (minutes >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.repair_warranty_records (
  id uuid primary key default gen_random_uuid(),
  repair_request_id uuid not null unique references public.repair_requests(id) on delete cascade,
  technician_profile_id uuid not null references public.profiles(id),
  warranty_provided boolean not null default false,
  duration text,
  coverage text,
  terms text,
  serial_numbers text,
  warranty_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.repair_quality_confirmations (
  id uuid primary key default gen_random_uuid(),
  repair_request_id uuid not null references public.repair_requests(id) on delete cascade,
  technician_profile_id uuid not null references public.profiles(id),
  confirmation_text text not null,
  confirmed_at timestamptz not null default now()
);

alter table public.repair_inspection_items enable row level security;
alter table public.repair_execution_checklist_items enable row level security;
alter table public.repair_testing_items enable row level security;
alter table public.repair_time_entries enable row level security;
alter table public.repair_warranty_records enable row level security;
alter table public.repair_quality_confirmations enable row level security;

create policy "Repair participants can read inspection items" on public.repair_inspection_items for select using (
  exists (select 1 from public.repair_requests r where r.id = repair_inspection_items.repair_request_id and (r.auth_user_id = auth.uid() or exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))))
);
create policy "Assigned technicians can manage inspection items" on public.repair_inspection_items for all using (
  exists (select 1 from public.repair_requests r join public.profiles p on p.auth_user_id = auth.uid() where r.id = repair_inspection_items.repair_request_id and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))
) with check (
  exists (select 1 from public.repair_requests r join public.profiles p on p.auth_user_id = auth.uid() where r.id = repair_inspection_items.repair_request_id and p.id = repair_inspection_items.technician_profile_id and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))
);

create policy "Repair participants can read execution checklist" on public.repair_execution_checklist_items for select using (
  exists (select 1 from public.repair_requests r where r.id = repair_execution_checklist_items.repair_request_id and (r.auth_user_id = auth.uid() or exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))))
);
create policy "Assigned technicians can manage execution checklist" on public.repair_execution_checklist_items for all using (
  exists (select 1 from public.repair_requests r join public.profiles p on p.auth_user_id = auth.uid() where r.id = repair_execution_checklist_items.repair_request_id and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))
) with check (
  exists (select 1 from public.repair_requests r join public.profiles p on p.auth_user_id = auth.uid() where r.id = repair_execution_checklist_items.repair_request_id and p.id = repair_execution_checklist_items.technician_profile_id and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))
);

create policy "Repair participants can read testing items" on public.repair_testing_items for select using (
  exists (select 1 from public.repair_requests r where r.id = repair_testing_items.repair_request_id and (r.auth_user_id = auth.uid() or exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))))
);
create policy "Assigned technicians can manage testing items" on public.repair_testing_items for all using (
  exists (select 1 from public.repair_requests r join public.profiles p on p.auth_user_id = auth.uid() where r.id = repair_testing_items.repair_request_id and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))
) with check (
  exists (select 1 from public.repair_requests r join public.profiles p on p.auth_user_id = auth.uid() where r.id = repair_testing_items.repair_request_id and p.id = repair_testing_items.technician_profile_id and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))
);

create policy "Repair participants can read time entries" on public.repair_time_entries for select using (
  exists (select 1 from public.repair_requests r where r.id = repair_time_entries.repair_request_id and (r.auth_user_id = auth.uid() or exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))))
);
create policy "Assigned technicians can create time entries" on public.repair_time_entries for insert with check (
  exists (select 1 from public.repair_requests r join public.profiles p on p.auth_user_id = auth.uid() where r.id = repair_time_entries.repair_request_id and p.id = repair_time_entries.technician_profile_id and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))
);

create policy "Repair participants can read warranty records" on public.repair_warranty_records for select using (
  exists (select 1 from public.repair_requests r where r.id = repair_warranty_records.repair_request_id and (r.auth_user_id = auth.uid() or exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))))
);
create policy "Assigned technicians can manage warranty records" on public.repair_warranty_records for all using (
  exists (select 1 from public.repair_requests r join public.profiles p on p.auth_user_id = auth.uid() where r.id = repair_warranty_records.repair_request_id and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))
) with check (
  exists (select 1 from public.repair_requests r join public.profiles p on p.auth_user_id = auth.uid() where r.id = repair_warranty_records.repair_request_id and p.id = repair_warranty_records.technician_profile_id and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))
);

create policy "Repair participants can read quality confirmations" on public.repair_quality_confirmations for select using (
  exists (select 1 from public.repair_requests r where r.id = repair_quality_confirmations.repair_request_id and (r.auth_user_id = auth.uid() or exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))))
);
create policy "Assigned technicians can create quality confirmations" on public.repair_quality_confirmations for insert with check (
  exists (select 1 from public.repair_requests r join public.profiles p on p.auth_user_id = auth.uid() where r.id = repair_quality_confirmations.repair_request_id and p.id = repair_quality_confirmations.technician_profile_id and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))
);

create index if not exists repair_inspection_items_request_idx on public.repair_inspection_items (repair_request_id, item_key);
create index if not exists repair_execution_checklist_request_idx on public.repair_execution_checklist_items (repair_request_id, item_key);
create index if not exists repair_testing_items_request_idx on public.repair_testing_items (repair_request_id, item_key);
create index if not exists repair_time_entries_request_idx on public.repair_time_entries (repair_request_id, category);