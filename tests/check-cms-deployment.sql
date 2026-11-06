select jsonb_build_object(
 'existing_owner_ready',exists(select 1 from public.cms_members where user_id='837a88bf-9fe0-4642-b142-9991779749d4' and role='owner' and active and not must_change_password),
 'active_accounts',(select count(*) from public.cms_members where active),
 'fixture_users_absent',not exists(select 1 from auth.users where email like 'byx-%-test@example.invalid'),
 'fixture_posts_absent',not exists(select 1 from public.posts where slug='cms-permission-fixture'),
 'fixture_storage_absent',not exists(select 1 from storage.objects where name like '__byx_permission_probe__/%')
) as cms_deployment;
