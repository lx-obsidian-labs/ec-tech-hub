-- EC TECH HUB trusted marketplace schema
-- Apply after 007_technician_profile_reputation_analytics.sql.
-- This migration creates marketplace infrastructure only. It does not seed or fabricate products.

do $$ begin
  create type public.marketplace_listing_status as enum ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'archived', 'sold', 'unavailable');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.marketplace_product_condition as enum ('new', 'open_box', 'refurbished', 'used', 'for_parts');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.marketplace_availability_status as enum ('available', 'limited', 'on_request', 'reserved', 'sold', 'unavailable');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.marketplace_seller_type as enum ('business', 'technician', 'individual');
exception when duplicate_object then null;
end $$;

create table if not exists public.marketplace_sellers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  business_profile_id uuid references public.business_profiles(id) on delete set null,
  seller_type public.marketplace_seller_type not null default 'individual',
  display_name text not null,
  logo_url text,
  city text,
  province text,
  specialization text,
  verification_status public.verification_status not null default 'not_started',
  is_active boolean not null default false,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.marketplace_sellers(id) on delete cascade,
  title text not null,
  slug text unique,
  category text not null,
  brand text,
  model text,
  short_description text,
  condition public.marketplace_product_condition not null,
  condition_notes text,
  availability_status public.marketplace_availability_status not null default 'on_request',
  location_city text,
  location_province text,
  price_amount numeric(12,2),
  currency text,
  show_price boolean not null default false,
  is_featured boolean not null default false,
  status public.marketplace_listing_status not null default 'draft',
  approved_at timestamptz,
  submitted_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_products_price_visibility check ((show_price = false) or (price_amount is not null and currency is not null))
);

create table if not exists public.marketplace_product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.marketplace_products(id) on delete cascade,
  storage_bucket text default 'marketplace-products',
  storage_path text,
  public_url text,
  alt_text text,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.marketplace_saved_products (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.marketplace_products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, product_id)
);

create table if not exists public.marketplace_quote_requests (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.marketplace_products(id) on delete cascade,
  requester_profile_id uuid references public.profiles(id) on delete set null,
  seller_id uuid not null references public.marketplace_sellers(id) on delete cascade,
  message text,
  preferred_contact text,
  status text not null default 'submitted' check (status in ('submitted', 'responded', 'closed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketplace_products_public_idx on public.marketplace_products (status, is_featured, published_at desc, created_at desc);
create index if not exists marketplace_products_category_idx on public.marketplace_products (category, status, published_at desc);
create index if not exists marketplace_products_seller_idx on public.marketplace_products (seller_id, status);
create index if not exists marketplace_images_product_idx on public.marketplace_product_images (product_id, sort_order);
create index if not exists marketplace_sellers_public_idx on public.marketplace_sellers (is_active, verification_status, display_name);

alter table public.marketplace_sellers enable row level security;
alter table public.marketplace_products enable row level security;
alter table public.marketplace_product_images enable row level security;
alter table public.marketplace_saved_products enable row level security;
alter table public.marketplace_quote_requests enable row level security;

drop policy if exists "Public can read active approved sellers" on public.marketplace_sellers;
drop policy if exists "Seller owners can manage their seller profile" on public.marketplace_sellers;
drop policy if exists "Public can read approved marketplace products" on public.marketplace_products;
drop policy if exists "Seller owners can manage their products" on public.marketplace_products;
drop policy if exists "Public can read approved marketplace product images" on public.marketplace_product_images;
drop policy if exists "Seller owners can manage product images" on public.marketplace_product_images;
drop policy if exists "Users can manage their saved marketplace products" on public.marketplace_saved_products;
drop policy if exists "Users can submit quote requests" on public.marketplace_quote_requests;
drop policy if exists "Requesters can read their quote requests" on public.marketplace_quote_requests;
drop policy if exists "Sellers can read quote requests for their products" on public.marketplace_quote_requests;

create policy "Public can read active approved sellers" on public.marketplace_sellers for select using (is_active and verification_status = 'approved');
create policy "Seller owners can manage their seller profile" on public.marketplace_sellers for all using (exists (select 1 from public.profiles p where p.id = marketplace_sellers.profile_id and p.auth_user_id = auth.uid())) with check (exists (select 1 from public.profiles p where p.id = marketplace_sellers.profile_id and p.auth_user_id = auth.uid()));

create policy "Public can read approved marketplace products" on public.marketplace_products for select using (status = 'approved');
create policy "Seller owners can manage their products" on public.marketplace_products for all using (exists (select 1 from public.marketplace_sellers s join public.profiles p on p.id = s.profile_id where s.id = marketplace_products.seller_id and p.auth_user_id = auth.uid())) with check (exists (select 1 from public.marketplace_sellers s join public.profiles p on p.id = s.profile_id where s.id = marketplace_products.seller_id and p.auth_user_id = auth.uid()));

create policy "Public can read approved marketplace product images" on public.marketplace_product_images for select using (exists (select 1 from public.marketplace_products mp where mp.id = marketplace_product_images.product_id and mp.status = 'approved'));
create policy "Seller owners can manage product images" on public.marketplace_product_images for all using (exists (select 1 from public.marketplace_products mp join public.marketplace_sellers s on s.id = mp.seller_id join public.profiles p on p.id = s.profile_id where mp.id = marketplace_product_images.product_id and p.auth_user_id = auth.uid())) with check (exists (select 1 from public.marketplace_products mp join public.marketplace_sellers s on s.id = mp.seller_id join public.profiles p on p.id = s.profile_id where mp.id = marketplace_product_images.product_id and p.auth_user_id = auth.uid()));

create policy "Users can manage their saved marketplace products" on public.marketplace_saved_products for all using (exists (select 1 from public.profiles p where p.id = marketplace_saved_products.profile_id and p.auth_user_id = auth.uid())) with check (exists (select 1 from public.profiles p where p.id = marketplace_saved_products.profile_id and p.auth_user_id = auth.uid()));

create policy "Users can submit quote requests" on public.marketplace_quote_requests for insert with check (requester_profile_id is null or exists (select 1 from public.profiles p where p.id = marketplace_quote_requests.requester_profile_id and p.auth_user_id = auth.uid()));
create policy "Requesters can read their quote requests" on public.marketplace_quote_requests for select using (exists (select 1 from public.profiles p where p.id = marketplace_quote_requests.requester_profile_id and p.auth_user_id = auth.uid()));
create policy "Sellers can read quote requests for their products" on public.marketplace_quote_requests for select using (exists (select 1 from public.marketplace_sellers s join public.profiles p on p.id = s.profile_id where s.id = marketplace_quote_requests.seller_id and p.auth_user_id = auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('marketplace-products', 'marketplace-products', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;