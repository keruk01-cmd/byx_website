-- Runs inside a transaction with CMS_MEMBERS.sql; every fixture and DDL change rolls back.
insert into auth.users(id,email,raw_app_meta_data,raw_user_meta_data) values
('00000000-0000-4000-8000-000000000011','byx-feed-test@example.invalid','{}','{}'),
('00000000-0000-4000-8000-000000000012','byx-project-test@example.invalid','{}','{}'),
('00000000-0000-4000-8000-000000000013','byx-inbox-test@example.invalid','{}','{}'),
('00000000-0000-4000-8000-000000000014','byx-owner-test@example.invalid','{}','{}');
insert into public.cms_members(user_id,email,role,permissions,active,must_change_password) values
('00000000-0000-4000-8000-000000000011','byx-feed-test@example.invalid','editor',array['feed'],true,false),
('00000000-0000-4000-8000-000000000012','byx-project-test@example.invalid','editor',array['projects'],true,true),
('00000000-0000-4000-8000-000000000013','byx-inbox-test@example.invalid','editor',array['inquiries'],true,false),
('00000000-0000-4000-8000-000000000014','byx-owner-test@example.invalid','owner','{}',true,false);
do $verify$
declare denied boolean; n bigint; inquiry uuid; post_id uuid:=gen_random_uuid();
begin
  perform set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000011","role":"authenticated"}',true);
  execute 'set local role authenticated';
  if not public.cms_has_permission('feed') or public.cms_has_permission('projects') or public.cms_is_owner() or not public.cms_can_upload() then raise exception 'EDITOR_CAPABILITIES'; end if;
  insert into public.posts(id,slug,t,d,pub,body) values(post_id,'cms-permission-fixture','Permission fixture','2099.01.01',false,'[]');
  insert into storage.objects(id,bucket_id,name,owner_id,metadata) values(gen_random_uuid(),'media','__byx_permission_probe__/'||gen_random_uuid()::text||'.webp','00000000-0000-4000-8000-000000000011','{"mimetype":"image/webp"}');
  denied:=false;begin insert into public.projects(code,name) values('CMS-RLS','Should be blocked');exception when insufficient_privilege then denied:=true;end;
  if not denied then raise exception 'PROJECT_WRITE_NOT_BLOCKED'; end if;
  denied:=false;begin insert into public.settings(k,v) values('contact','{}') on conflict(k) do update set v=excluded.v;exception when insufficient_privilege then denied:=true;end;
  if not denied then raise exception 'SETTINGS_WRITE_NOT_BLOCKED'; end if;
  denied:=false;begin update public.cms_members set role='owner' where user_id='00000000-0000-4000-8000-000000000011';exception when insufficient_privilege then denied:=true;end;
  if not denied then raise exception 'SELF_PROMOTION_NOT_BLOCKED'; end if;
  denied:=false;begin perform public.cms_manage_member('837a88bf-9fe0-4642-b142-9991779749d4','00000000-0000-4000-8000-000000000011','byx-feed-test@example.invalid','owner','{}',true,false);exception when insufficient_privilege then denied:=true;end;
  if not denied then raise exception 'CLIENT_RPC_NOT_BLOCKED'; end if;
  select count(*) into n from public.cms_members;if n<>1 then raise exception 'OTHER_MEMBERS_VISIBLE_TO_EDITOR'; end if;
  execute 'reset role';perform set_config('request.jwt.claims','{"role":"anon"}',true);execute 'set local role anon';
  select count(*) into n from public.posts where id=post_id;if n<>0 then raise exception 'DRAFT_VISIBLE_TO_ANON'; end if;
  denied:=false;begin perform public.cms_admin_context();exception when insufficient_privilege then denied:=true;end;
  if not denied then raise exception 'ANON_CONTEXT_ALLOWED'; end if;
  execute 'reset role';
  perform set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000012","role":"authenticated"}',true);
  execute 'set local role authenticated';if public.cms_has_permission('projects') or public.cms_can_upload() then raise exception 'TEMPORARY_PASSWORD_CAN_EDIT'; end if;
  execute 'reset role';execute 'set local role service_role';perform public.cms_password_changed('00000000-0000-4000-8000-000000000012');execute 'reset role';execute 'set local role authenticated';
  if not public.cms_has_permission('projects') or not public.cms_can_upload() then raise exception 'PASSWORD_COMPLETION_NOT_APPLIED'; end if;
  insert into public.projects(code,name) values('CMS-RLS','Transactional permission fixture');
  select count(*) into n from public.posts where id=post_id;if n<>0 then raise exception 'DRAFT_VISIBLE_WITHOUT_FEED'; end if;
  execute 'reset role';execute 'set local role service_role';
  inquiry:=public.submit_contact_request('CMS permission verification','byx-permissions@example.invalid','','This record exists only in a rolled-back verification transaction.',true,repeat('c',64));
  execute 'reset role';perform set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000011","role":"authenticated"}',true);execute 'set local role authenticated';
  select count(*) into n from public.contact_requests where id=inquiry;if n<>0 then raise exception 'INQUIRY_VISIBLE_WITHOUT_PERMISSION'; end if;
  execute 'reset role';perform set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000013","role":"authenticated"}',true);execute 'set local role authenticated';
  if public.cms_can_upload() or public.cms_is_owner() or not public.cms_has_permission('inquiries') then raise exception 'INBOX_CAPABILITIES'; end if;
  denied:=false;begin insert into storage.objects(id,bucket_id,name,owner_id,metadata) values(gen_random_uuid(),'media','__byx_permission_probe__/'||gen_random_uuid()::text||'.webp','00000000-0000-4000-8000-000000000013','{}');exception when insufficient_privilege then denied:=true;end;
  if not denied then raise exception 'INBOX_ONLY_STORAGE_INSERT_ALLOWED'; end if;
  select count(*) into n from public.contact_requests where id=inquiry;if n<>1 then raise exception 'INQUIRY_ACCESS_MISSING'; end if;
  update public.contact_requests set status='reviewed' where id=inquiry;get diagnostics n=row_count;if n<>1 then raise exception 'INQUIRY_STATUS_MISSING'; end if;
  denied:=false;begin update public.contact_requests set body='Should be blocked' where id=inquiry;exception when insufficient_privilege then denied:=true;end;
  if not denied then raise exception 'INQUIRY_BODY_NOT_PROTECTED'; end if;
  execute 'reset role';
  update public.cms_members set active=false where user_id='00000000-0000-4000-8000-000000000011';
  perform set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000011","role":"authenticated"}',true);execute 'set local role authenticated';
  if public.cms_has_permission('feed') or public.cms_can_upload() then raise exception 'REVOCATION_NOT_IMMEDIATE'; end if;
  select count(*) into n from public.posts where id=post_id;if n<>0 then raise exception 'REVOKED_DRAFT_VISIBLE'; end if;
  execute 'reset role';
  perform set_config('request.jwt.claims','{"sub":"837a88bf-9fe0-4642-b142-9991779749d4","role":"authenticated"}',true);execute 'set local role authenticated';
  if not public.cms_is_owner() or not public.cms_has_permission('projects') or not public.cms_has_permission('feed') then raise exception 'OWNER_ACCESS_CHANGED'; end if;
  select count(*) into n from public.posts where id=post_id;if n<>1 then raise exception 'OWNER_DRAFT_MISSING'; end if;
  execute 'reset role';execute 'set local role service_role';
  denied:=false;begin perform public.cms_manage_member('00000000-0000-4000-8000-000000000013','00000000-0000-4000-8000-000000000012','byx-project-test@example.invalid','owner','{}',true,false);exception when insufficient_privilege then denied:=true;end;
  if not denied then raise exception 'NONOWNER_MUTATION_ALLOWED'; end if;
  denied:=false;begin perform public.cms_manage_member('837a88bf-9fe0-4642-b142-9991779749d4','837a88bf-9fe0-4642-b142-9991779749d4','unused@example.invalid','editor',array['feed'],false,false);exception when insufficient_privilege then denied:=true;end;
  if not denied then raise exception 'OWNER_SELF_REMOVAL_ALLOWED'; end if;
  execute 'reset role';
  denied:=false;begin delete from public.cms_members where role='owner';exception when insufficient_privilege then denied:=true;end;
  if not denied then raise exception 'LAST_OWNER_DELETION_ALLOWED'; end if;
end $verify$;
