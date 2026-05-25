-- Storage bucket for nominee images
insert into storage.buckets (id, name, public)
values ('nominee-images', 'nominee-images', true)
on conflict (id) do nothing;

-- Public read
create policy "nominee_images_public_read"
on storage.objects for select
using (bucket_id = 'nominee-images');

-- Admin upload / update / delete
create policy "nominee_images_admin_insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'nominee-images'
  and exists (select 1 from public.admins a where a.user_id = auth.uid())
);

create policy "nominee_images_admin_update"
on storage.objects for update to authenticated
using (
  bucket_id = 'nominee-images'
  and exists (select 1 from public.admins a where a.user_id = auth.uid())
);

create policy "nominee_images_admin_delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'nominee-images'
  and exists (select 1 from public.admins a where a.user_id = auth.uid())
);

-- Admins can read all profiles for user management UI
create policy "admins_profiles_select" on public.profiles
  for select to authenticated using (
    exists (select 1 from public.admins a where a.user_id = auth.uid())
  );
