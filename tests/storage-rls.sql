-- Verification only: all Storage probe inserts roll back in subtransactions.
-- No file bytes or CMS content are written. Run with an administrative SQL connection.
create temporary table byx_storage_checks(name text, passed boolean) on commit drop;
do $test$
declare test record;
begin
  for test in select * from (values
    ('existing_admin','authenticated','837a88bf-9fe0-4642-b142-9991779749d4','media',true),
    ('other_account','authenticated','00000000-0000-4000-8000-000000000001','media',false),
    ('anonymous','anon',null,'media',false),
    ('other_bucket','authenticated','837a88bf-9fe0-4642-b142-9991779749d4','not-a-byx-bucket',false)
  ) as t(name,db_role,user_id,bucket,allowed)
  loop
    begin
      perform set_config('request.jwt.claims',json_build_object('sub',test.user_id,'role',test.db_role)::text,true);
      execute format('set local role %I',test.db_role);
      insert into storage.objects(id,bucket_id,name,owner_id,metadata)
      values(gen_random_uuid(),test.bucket,'__byx_rls_probe__/'||gen_random_uuid()::text||'.webp',test.user_id,'{"mimetype":"image/webp"}'::jsonb);
      raise exception using errcode='P0001',message='byx_test_allowed';
    exception
      when insufficient_privilege then
        insert into byx_storage_checks values(test.name,not test.allowed);
      when raise_exception then
        if SQLERRM <> 'byx_test_allowed' then raise; end if;
        insert into byx_storage_checks values(test.name,test.allowed);
    end;
  end loop;
  if exists(select 1 from byx_storage_checks where not passed) then raise exception 'BYX Storage authorization regression'; end if;
end $test$;
select jsonb_build_object('checks',(select jsonb_agg(t) from byx_storage_checks t),'persisted_probe_objects',(select count(*) from storage.objects where name like '__byx_rls_probe__/%'),'policy',(select jsonb_agg(p) from (select policyname,roles,cmd,with_check from pg_policies where schemaname='storage' and tablename='objects') p)) as verification;
