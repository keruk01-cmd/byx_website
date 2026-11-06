select jsonb_build_object('policies',(select jsonb_agg(to_jsonb(p)) from (
  select schemaname,tablename,policyname,roles,cmd,qual,with_check from pg_catalog.pg_policies
  where (schemaname='public' and tablename in ('projects','posts','news','settings','contact_requests'))
     or (schemaname='storage' and tablename='objects') order by schemaname,tablename,policyname
) p),'existing_owner_present',(select count(*) from auth.users
where id='837a88bf-9fe0-4642-b142-9991779749d4'::uuid)) as inspection;
