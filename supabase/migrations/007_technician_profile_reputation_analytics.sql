-- EC TECH HUB technician professional profile, verification, reputation, and analytics support
-- Apply after 006_quotation_parts_communication_workflow.sql.

alter table public.technician_profiles
  add column if not exists professional_title text,
  add column if not exists languages text,
  add column if not exists education text,
  add column if not exists memberships text,
  add column if not exists availability_status text not null default 'available' check (availability_status in ('available', 'busy', 'vacation', 'temporarily_unavailable')),
  add column if not exists accepting_urgent_repairs boolean not null default false,
  add column if not exists expected_response_time text,
  add column if not exists show_phone boolean not null default false,
  add column if not exists show_email boolean not null default false,
  add column if not exists show_business_address boolean not null default false,
  add column if not exists show_portfolio boolean not null default true,
  add column if not exists show_availability boolean not null default true,
  add column if not exists public_slug text unique;

create table if not exists public.technician_skills (
  id uuid primary key default gen_random_uuid(),
  technician_profile_id uuid not null references public.technician_profiles(id) on delete cascade,
  skill_name text not null,
  experience_level text not null default 'intermediate' check (experience_level in ('beginner', 'intermediate', 'advanced', 'expert')),
  years_experience int check (years_experience is null or years_experience >= 0),
  verification_status public.verification_status not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (technician_profile_id, skill_name)
);

create table if not exists public.technician_certifications (
  id uuid primary key default gen_random_uuid(),
  technician_profile_id uuid not null references public.technician_profiles(id) on delete cascade,
  certification_name text not null,
  issuing_organization text not null,
  issue_date date,
  expiry_date date,
  credential_id text,
  verification_status public.verification_status not null default 'submitted',
  storage_bucket text default 'technician-certificates',
  storage_path text,
  file_name text,
  content_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.technician_portfolio_items (
  id uuid primary key default gen_random_uuid(),
  technician_profile_id uuid not null references public.technician_profiles(id) on delete cascade,
  title text not null,
  description text,
  device_category text,
  completed_at date,
  technologies_used text,
  consent_confirmed boolean not null default false,
  before_storage_path text,
  after_storage_path text,
  before_file_name text,
  after_file_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.technician_service_areas (
  id uuid primary key default gen_random_uuid(),
  technician_profile_id uuid not null references public.technician_profiles(id) on delete cascade,
  province text not null,
  city text not null,
  radius_km int check (radius_km is null or radius_km between 0 and 500),
  remote_support boolean not null default false,
  onsite_support boolean not null default false,
  dropoff_service boolean not null default false,
  collection_service boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.technician_business_hours (
  id uuid primary key default gen_random_uuid(),
  technician_profile_id uuid not null references public.technician_profiles(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  is_closed boolean not null default false,
  opens_at time,
  closes_at time,
  emergency_support boolean not null default false,
  timezone text not null default 'Africa/Johannesburg',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (technician_profile_id, day_of_week)
);

create table if not exists public.technician_reviews (
  id uuid primary key default gen_random_uuid(),
  technician_profile_id uuid not null references public.technician_profiles(id) on delete cascade,
  repair_request_id uuid references public.repair_requests(id) on delete set null,
  customer_profile_id uuid references public.profiles(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  review_text text,
  technician_response text,
  responded_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.technician_skills enable row level security;
alter table public.technician_certifications enable row level security;
alter table public.technician_portfolio_items enable row level security;
alter table public.technician_service_areas enable row level security;
alter table public.technician_business_hours enable row level security;
alter table public.technician_reviews enable row level security;

create policy "Technicians manage their skills" on public.technician_skills for all using (exists (select 1 from public.technician_profiles tp join public.profiles p on p.id = tp.profile_id where tp.id = technician_skills.technician_profile_id and p.auth_user_id = auth.uid())) with check (exists (select 1 from public.technician_profiles tp join public.profiles p on p.id = tp.profile_id where tp.id = technician_skills.technician_profile_id and p.auth_user_id = auth.uid()));
create policy "Technicians manage their certifications" on public.technician_certifications for all using (exists (select 1 from public.technician_profiles tp join public.profiles p on p.id = tp.profile_id where tp.id = technician_certifications.technician_profile_id and p.auth_user_id = auth.uid())) with check (exists (select 1 from public.technician_profiles tp join public.profiles p on p.id = tp.profile_id where tp.id = technician_certifications.technician_profile_id and p.auth_user_id = auth.uid()));
create policy "Technicians manage their portfolio" on public.technician_portfolio_items for all using (exists (select 1 from public.technician_profiles tp join public.profiles p on p.id = tp.profile_id where tp.id = technician_portfolio_items.technician_profile_id and p.auth_user_id = auth.uid())) with check (exists (select 1 from public.technician_profiles tp join public.profiles p on p.id = tp.profile_id where tp.id = technician_portfolio_items.technician_profile_id and p.auth_user_id = auth.uid() and technician_portfolio_items.consent_confirmed));
create policy "Technicians manage their service areas" on public.technician_service_areas for all using (exists (select 1 from public.technician_profiles tp join public.profiles p on p.id = tp.profile_id where tp.id = technician_service_areas.technician_profile_id and p.auth_user_id = auth.uid())) with check (exists (select 1 from public.technician_profiles tp join public.profiles p on p.id = tp.profile_id where tp.id = technician_service_areas.technician_profile_id and p.auth_user_id = auth.uid()));
create policy "Technicians manage their business hours" on public.technician_business_hours for all using (exists (select 1 from public.technician_profiles tp join public.profiles p on p.id = tp.profile_id where tp.id = technician_business_hours.technician_profile_id and p.auth_user_id = auth.uid())) with check (exists (select 1 from public.technician_profiles tp join public.profiles p on p.id = tp.profile_id where tp.id = technician_business_hours.technician_profile_id and p.auth_user_id = auth.uid()));
create policy "Technicians read their genuine reviews" on public.technician_reviews for select using (exists (select 1 from public.technician_profiles tp join public.profiles p on p.id = tp.profile_id where tp.id = technician_reviews.technician_profile_id and p.auth_user_id = auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('technician-certificates', 'technician-certificates', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;