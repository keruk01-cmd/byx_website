-- Private inquiry inbox. Only the existing CMS administrator may read/update status.
-- The public Edge Function uses its server-only service role to call the bounded RPC.
begin;
create table public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  subject text not null check(char_length(btrim(subject)) between 3 and 160),
  email text not null check(char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  phone text not null default '' check(char_length(phone) <= 40),
  body text not null check(char_length(btrim(body)) between 10 and 8000),
  consent boolean not null check(consent),
  status text not null default 'new' check(status in ('new','reviewed','closed')),
  client_hash text not null check(client_hash ~ '^[0-9a-f]{64}$')
);
create index contact_requests_created_idx on public.contact_requests(created_at desc);
create index contact_requests_client_created_idx on public.contact_requests(client_hash,created_at desc);
create index contact_requests_email_created_idx on public.contact_requests(email,created_at desc);
alter table public.contact_requests enable row level security;
revoke all on public.contact_requests from public,anon,authenticated;
grant select on public.contact_requests to authenticated;
grant update(status) on public.contact_requests to authenticated;
grant all on public.contact_requests to service_role;
create policy byx_inquiry_admin_read on public.contact_requests for select to authenticated
using ((select auth.uid())='837a88bf-9fe0-4642-b142-9991779749d4'::uuid);
create policy byx_inquiry_admin_status on public.contact_requests for update to authenticated
using ((select auth.uid())='837a88bf-9fe0-4642-b142-9991779749d4'::uuid)
with check ((select auth.uid())='837a88bf-9fe0-4642-b142-9991779749d4'::uuid);

create function public.submit_contact_request(p_subject text,p_email text,p_phone text,p_body text,p_consent boolean,p_client_hash text)
returns uuid language plpgsql security invoker set search_path=''
as $$
declare result uuid; normalized_email text:=lower(btrim(p_email));
begin
  if p_consent is distinct from true or p_subject is null or char_length(btrim(p_subject)) not between 3 and 160
    or p_body is null or char_length(btrim(p_body)) not between 10 and 8000
    or normalized_email is null or char_length(normalized_email)>254 or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or char_length(coalesce(p_phone,''))>40 or p_client_hash is null or p_client_hash !~ '^[0-9a-f]{64}$'
  then raise exception 'INVALID_INPUT' using errcode='22023'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('BYX inquiry intake',0));
  if (select count(*) from public.contact_requests where client_hash=p_client_hash and created_at>now()-interval '15 minutes')>=5
    or (select count(*) from public.contact_requests where email=normalized_email and created_at>now()-interval '1 hour')>=3
    or (select count(*) from public.contact_requests where created_at>now()-interval '1 day')>=100
  then raise exception 'RATE_LIMITED'; end if;
  insert into public.contact_requests(subject,email,phone,body,consent,client_hash)
  values(btrim(p_subject),normalized_email,btrim(coalesce(p_phone,'')),btrim(p_body),true,p_client_hash)
  returning id into result;
  return result;
end;
$$;
revoke all on function public.submit_contact_request(text,text,text,text,boolean,text) from public,anon,authenticated;
grant execute on function public.submit_contact_request(text,text,text,text,boolean,text) to service_role;
commit;
