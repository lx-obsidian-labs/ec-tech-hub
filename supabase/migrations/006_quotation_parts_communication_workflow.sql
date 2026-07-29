-- EC TECH HUB quotation, parts, progress and customer communication workflow schema
-- Apply after 005_repair_execution_workspace.sql.

alter table public.repair_quotes
  add column if not exists revision_reason text,
  add column if not exists customer_decision_note text,
  add column if not exists clarification_requested_at timestamptz,
  add column if not exists clarification_message text;

alter table public.repair_quote_line_items
  add column if not exists customer_visible boolean not null default true;

alter table public.repair_parts
  add column if not exists manufacturer text,
  add column if not exists unit_cost_amount numeric(12,2),
  add column if not exists availability text not null default 'available' check (availability in ('available', 'ordered', 'backordered', 'installed', 'cancelled')),
  add column if not exists notes text;

create table if not exists public.repair_collection_readiness (
  repair_request_id uuid primary key references public.repair_requests(id) on delete cascade,
  technician_profile_id uuid not null references public.profiles(id),
  repair_complete boolean not null default false,
  testing_passed boolean not null default false,
  photos_uploaded boolean not null default false,
  summary_generated boolean not null default false,
  warranty_recorded boolean not null default false,
  customer_notified boolean not null default false,
  ready_marked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.repair_collection_readiness enable row level security;

create policy "Repair participants can read collection readiness" on public.repair_collection_readiness for select using (
  exists (select 1 from public.repair_requests r where r.id = repair_collection_readiness.repair_request_id and (r.auth_user_id = auth.uid() or exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))))
);

create policy "Assigned technicians can manage collection readiness" on public.repair_collection_readiness for all using (
  exists (select 1 from public.repair_requests r join public.profiles p on p.auth_user_id = auth.uid() where r.id = repair_collection_readiness.repair_request_id and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))
) with check (
  exists (select 1 from public.repair_requests r join public.profiles p on p.auth_user_id = auth.uid() where r.id = repair_collection_readiness.repair_request_id and p.id = repair_collection_readiness.technician_profile_id and (p.id = r.assigned_technician_profile_id or p.role = 'administrator'))
);

create index if not exists repair_parts_availability_idx on public.repair_parts (repair_request_id, availability);