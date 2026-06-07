-- TruckGuard: fotos opcionais em alertas manuais
alter table public.alerts
  add column if not exists photo_url text;

insert into storage.buckets (id, name, public)
values ('alert-photos', 'alert-photos', true)
on conflict (id) do update
set public = excluded.public;

create policy "alert_photos_select_public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'alert-photos');

create policy "alert_photos_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'alert-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "alert_photos_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'alert-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'alert-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "alert_photos_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'alert-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
