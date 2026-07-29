-- Admin marketplace uploads. Apply after 008_marketplace_schema.sql.
drop policy if exists "Marketplace admins can upload product media" on storage.objects;
drop policy if exists "Marketplace admins can update product media" on storage.objects;
drop policy if exists "Marketplace admins can delete product media" on storage.objects;
create policy "Marketplace admins can upload product media" on storage.objects for insert with check (
  bucket_id = 'marketplace-products' and exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and p.role = 'administrator')
);
create policy "Marketplace admins can update product media" on storage.objects for update using (
  bucket_id = 'marketplace-products' and exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and p.role = 'administrator')
);
create policy "Marketplace admins can delete product media" on storage.objects for delete using (
  bucket_id = 'marketplace-products' and exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and p.role = 'administrator')
);