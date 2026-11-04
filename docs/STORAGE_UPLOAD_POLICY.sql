-- BYX production: the existing sole CMS administrator may add media objects.
-- Public bucket reads already work; replacement/deletion are not used by DB.upload.
-- No anon, other-account, UPDATE, or DELETE permission is added.
create policy "byx_admin_media_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'media'
  and (select auth.uid()) = '837a88bf-9fe0-4642-b142-9991779749d4'::uuid
);

-- Rollback, if this specific policy ever needs removing:
-- drop policy "byx_admin_media_insert" on storage.objects;
