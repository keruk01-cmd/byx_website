-- All fixtures are rolled back; no inquiry survives this verification.
create temporary table byx_contact_verification(result jsonb) on commit drop;
do $test$
declare report jsonb:='{}'; inserted uuid; visible_count bigint; denied boolean;
begin
  begin
    execute 'set local role service_role';
    inserted:=public.submit_contact_request('RLS verification','rls-probe@example.invalid','','This inquiry exists only inside a rolled-back verification.',true,repeat('a',64));
    report:=report||jsonb_build_object('service_insert',inserted is not null);
    execute 'reset role';
    perform set_config('request.jwt.claims','{"sub":"837a88bf-9fe0-4642-b142-9991779749d4","role":"authenticated"}',true);
    execute 'set local role authenticated';
    select count(*) into visible_count from public.contact_requests where id=inserted;
    report:=report||jsonb_build_object('admin_read',visible_count=1);
    update public.contact_requests set status='reviewed' where id=inserted;
    get diagnostics visible_count=row_count;
    report:=report||jsonb_build_object('admin_status',visible_count=1);
    denied:=false;begin update public.contact_requests set body='altered private text' where id=inserted;exception when insufficient_privilege then denied:=true;end;
    report:=report||jsonb_build_object('body_immutable_for_admin_client',denied);
    perform set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
    select count(*) into visible_count from public.contact_requests where id=inserted;
    report:=report||jsonb_build_object('other_user_hidden',visible_count=0);
    execute 'reset role';execute 'set local role anon';
    denied:=false;begin select count(*) into visible_count from public.contact_requests;exception when insufficient_privilege then denied:=true;end;
    report:=report||jsonb_build_object('anonymous_read_denied',denied);
    denied:=false;begin perform public.submit_contact_request('Direct insert attempt','direct@example.invalid','','Direct access should be denied.',true,repeat('b',64));exception when insufficient_privilege then denied:=true;end;
    report:=report||jsonb_build_object('anonymous_rpc_denied',denied);
    execute 'reset role';execute 'set local role service_role';
    denied:=false;begin perform public.submit_contact_request('x','invalid','','too short',false,repeat('a',64));exception when invalid_parameter_value then denied:=true;end;
    report:=report||jsonb_build_object('server_validation',denied);
    perform public.submit_contact_request('RLS verification 2','rls-probe@example.invalid','','This second message also rolls back.',true,repeat('a',64));
    perform public.submit_contact_request('RLS verification 3','rls-probe@example.invalid','','This third message also rolls back.',true,repeat('a',64));
    denied:=false;begin perform public.submit_contact_request('RLS verification 4','rls-probe@example.invalid','','This message should hit the rate limit.',true,repeat('a',64));exception when raise_exception then if SQLERRM='RATE_LIMITED' then denied:=true;else raise;end if;end;
    report:=report||jsonb_build_object('database_rate_limit',denied);
    raise exception 'ROLLBACK_CONTACT_VERIFICATION';
  exception when raise_exception then if SQLERRM<>'ROLLBACK_CONTACT_VERIFICATION' then raise;end if;end;
  if exists(select 1 from jsonb_each(report) where value<>'true'::jsonb) then raise exception 'Inquiry authorization regression: %',report;end if;
  insert into byx_contact_verification values(report);
end $test$;
select jsonb_build_object('checks',(select result from byx_contact_verification),'persisted_fixtures',(select count(*) from public.contact_requests where email='rls-probe@example.invalid')) as verification;
