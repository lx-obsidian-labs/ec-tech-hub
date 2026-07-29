-- EC TECH HUB authentication and onboarding schema
-- Apply in Supabase SQL editor or via Supabase CLI after reviewing for your project.

do $$ begin
  create type public.account_role as enum ('customer', 'technician', 'business', 'student', 'administrator');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.onboarding_status as enum ('role_required', 'incomplete', 'submitted', 'complete', 'more_information_required');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.verification_status as enum ('not_started', 'in_progress', 'submitted', 'under_review', 'more_information_required', 'approved', 'rejected', 'suspended', 'expired');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  display_name text,
  avatar_url text,
  email text,
  phone text,
  province text,
  city text,
  role public.account_role,
  onboarding_status public.onboarding_status not null default 'role_required',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.technician_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  headline text,
  biography text,
  years_experience int,
  service_area text,
  verification_status public.verification_status not null default 'not_started',
  submitted_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  business_name text not null,
  registration_number text,
  category text,
  description text,
  logo_url text,
  verification_status public.verification_status not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.onboarding_progress (
  profile_id uuid not null,
  flow_type text not null,
  current_step text not null,
  completed_steps jsonb not null default '[]'::jsonb,
  draft_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (profile_id, flow_type)
);

create table if not exists public.verification_submissions (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  owner_type text not null check (owner_type in ('technician', 'business')),
  status public.verification_status not null default 'submitted',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewer_id uuid references public.profiles(id),
  rejection_reason_public text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.technician_profiles enable row level security;
alter table public.business_profiles enable row level security;
alter table public.onboarding_progress enable row level security;
alter table public.verification_submissions enable row level security;

drop policy if exists "Users can read their own private profile" on public.profiles;
drop policy if exists "Users can insert their own non-admin profile" on public.profiles;
drop policy if exists "Users can update their own non-admin profile" on public.profiles;
drop policy if exists "Owners can manage onboarding progress" on public.onboarding_progress;
drop policy if exists "Owners can read technician profiles" on public.technician_profiles;
drop policy if exists "Owners can write technician profiles" on public.technician_profiles;
drop policy if exists "Owners can read business profiles" on public.business_profiles;
drop policy if exists "Owners can write business profiles" on public.business_profiles;
drop policy if exists "Owners can read verification submissions" on public.verification_submissions;
drop policy if exists "Owners can submit verification" on public.verification_submissions;

create policy "Users can read their own private profile" on public.profiles for select using (auth.uid() = auth_user_id);
create policy "Users can insert their own non-admin profile" on public.profiles for insert with check (auth.uid() = auth_user_id and role is distinct from 'administrator');
create policy "Users can update their own non-admin profile" on public.profiles for update using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id and role is distinct from 'administrator');

create policy "Owners can manage onboarding progress" on public.onboarding_progress for all using (
  exists (select 1 from public.profiles p where p.id = onboarding_progress.profile_id and p.auth_user_id = auth.uid())
) with check (
  exists (select 1 from public.profiles p where p.id = onboarding_progress.profile_id and p.auth_user_id = auth.uid())
);

create policy "Owners can read technician profiles" on public.technician_profiles for select using (
  exists (select 1 from public.profiles p where p.id = technician_profiles.profile_id and p.auth_user_id = auth.uid())
);
create policy "Owners can write technician profiles" on public.technician_profiles for all using (
  exists (select 1 from public.profiles p where p.id = technician_profiles.profile_id and p.auth_user_id = auth.uid())
) with check (
  exists (select 1 from public.profiles p where p.id = technician_profiles.profile_id and p.auth_user_id = auth.uid())
);

create policy "Owners can read business profiles" on public.business_profiles for select using (
  exists (select 1 from public.profiles p where p.id = business_profiles.profile_id and p.auth_user_id = auth.uid())
);
create policy "Owners can write business profiles" on public.business_profiles for all using (
  exists (select 1 from public.profiles p where p.id = business_profiles.profile_id and p.auth_user_id = auth.uid())
) with check (
  exists (select 1 from public.profiles p where p.id = business_profiles.profile_id and p.auth_user_id = auth.uid())
);

create policy "Owners can read verification submissions" on public.verification_submissions for select using (
  exists (select 1 from public.profiles p where p.id = verification_submissions.owner_profile_id and p.auth_user_id = auth.uid())
);
create policy "Owners can submit verification" on public.verification_submissions for insert with check (
  exists (select 1 from public.profiles p where p.id = verification_submissions.owner_profile_id and p.auth_user_id = auth.uid())
);
