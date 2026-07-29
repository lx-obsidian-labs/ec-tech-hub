-- EC TECH HUB repair request intake schema
-- Apply after 001_auth_onboarding_schema.sql.

do $$ begin
  create type public.repair_request_status as enum ('draft', 'submitted', 'reviewing', 'accepted', 'in_progress', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.repair_urgency as enum ('low', 'normal', 'urgent', 'safety');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.repair_service_preference as enum ('drop_off', 'technician_visit', 'remote_assistance');
exception when duplicate_object then null;
end $$;

create or replace function public.generate_repair_reference()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := 'ECTH-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8));
    exit when not exists (select 1 from public.repair_requests where reference = candidate);
  end loop;
  return candidate;
end;
$$;

create table if not exists public.repair_request_drafts (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  current_step int not null default 1 check (current_step between 1 and 5),
  draft_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.repair_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default public.generate_repair_reference(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  status public.repair_request_status not null default 'submitted',
  device_category text not null,
  brand text not null,
  model text not null,
  approximate_age text not null,
  warranty_status text,
  purchase_date date,
  problem_title text not null,
  problem_description text not null,
  symptoms text not null,
  started_when text not null,
  repaired_before boolean not null default false,
  urgency public.repair_urgency not null default 'normal',
  province text not null,
  city text not null,
  area text not null,
  service_preference public.repair_service_preference not null,
  location_notes text,
  confirmation_accepted boolean not null default false,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.repair_request_attachments (
  id uuid primary key default gen_random_uuid(),
  repair_request_id uuid not null references public.repair_requests(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  storage_bucket text not null default 'repair-attachments',
  storage_path text not null,
  file_name text not null,
  content_type text not null,
  file_size_bytes bigint not null,
  created_at timestamptz not null default now()
);

alter table public.repair_request_drafts enable row level security;
alter table public.repair_requests enable row level security;
alter table public.repair_request_attachments enable row level security;

drop policy if exists "Owners can manage repair drafts" on public.repair_request_drafts;
drop policy if exists "Owners can create repair requests" on public.repair_requests;
drop policy if exists "Owners can read repair requests" on public.repair_requests;
drop policy if exists "Owners can update draft or submitted repair requests" on public.repair_requests;
drop policy if exists "Owners can read repair attachments" on public.repair_request_attachments;
drop policy if exists "Owners can create repair attachments" on public.repair_request_attachments;

create policy "Owners can manage repair drafts" on public.repair_request_drafts for all using (
  exists (select 1 from public.profiles p where p.id = repair_request_drafts.profile_id and p.auth_user_id = auth.uid())
) with check (
  exists (select 1 from public.profiles p where p.id = repair_request_drafts.profile_id and p.auth_user_id = auth.uid())
);

create policy "Owners can create repair requests" on public.repair_requests for insert with check (auth.uid() = auth_user_id);
create policy "Owners can read repair requests" on public.repair_requests for select using (auth.uid() = auth_user_id);
create policy "Owners can update draft or submitted repair requests" on public.repair_requests for update using (auth.uid() = auth_user_id and status in ('draft', 'submitted')) with check (auth.uid() = auth_user_id);

create policy "Owners can read repair attachments" on public.repair_request_attachments for select using (
  exists (select 1 from public.profiles p where p.id = repair_request_attachments.profile_id and p.auth_user_id = auth.uid())
);
create policy "Owners can create repair attachments" on public.repair_request_attachments for insert with check (
  exists (select 1 from public.profiles p where p.id = repair_request_attachments.profile_id and p.auth_user_id = auth.uid())
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'repair-attachments',
  'repair-attachments',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

drop policy if exists "Repair owners can upload attachments" on storage.objects;
drop policy if exists "Repair owners can read their attachments" on storage.objects;
drop policy if exists "Repair owners can delete draft attachments" on storage.objects;

create policy "Repair owners can upload attachments" on storage.objects for insert with check (
  bucket_id = 'repair-attachments'
  and exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and storage.objects.name like p.id::text || '/%')
);

create policy "Repair owners can read their attachments" on storage.objects for select using (
  bucket_id = 'repair-attachments'
  and exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and storage.objects.name like p.id::text || '/%')
);

create policy "Repair owners can delete draft attachments" on storage.objects for delete using (
  bucket_id = 'repair-attachments'
  and exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and storage.objects.name like p.id::text || '/%')
);