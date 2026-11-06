-- BYX private administrators and per-menu capabilities.
-- Apply after reviewing tests/cms-permissions.sql. Existing content is not moved.
begin;
create table if not exists public.cms_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique check (char_length(email) between 3 and 254),
  role text not null default 'editor' check (role in ('owner','editor')),
  permissions text[] not null default '{}' check (permissions <@ array['projects','feed','about','contact','inquiries']::text[]),
  active boolean not null default true,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.cms_member_audit (
  id bigint generated always as identity primary key,
  actor_id uuid not null,
  target_id uuid not null,
  action text not null,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.cms_members enable row level security;
alter table public.cms_member_audit enable row level security;
revoke all on public.cms_members,public.cms_member_audit from anon,authenticated;
grant select on public.cms_members,public.cms_member_audit to authenticated;
grant all on public.cms_members,public.cms_member_audit to service_role;
revoke all on sequence public.cms_member_audit_id_seq from public,anon,authenticated;
grant usage,select on sequence public.cms_member_audit_id_seq to service_role;

-- Bootstrap only the already-authorized BYX account; never infer an owner from signup order.
insert into public.cms_members(user_id,email,role,permissions,active,must_change_password)
select id,lower(email),'owner',array['projects','feed','about','contact','inquiries'],true,false
from auth.users where id='837a88bf-9fe0-4642-b142-9991779749d4'::uuid
on conflict(user_id) do nothing;
do $$ begin
  if not exists(select 1 from public.cms_members where role='owner' and active and not must_change_password)
  then raise exception 'EXISTING_OWNER_REQUIRED'; end if;
end $$;

create or replace function public.cms_has_permission(capability text)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.cms_members m where m.user_id=(select auth.uid())
    and m.active and not m.must_change_password and (m.role='owner' or capability=any(m.permissions)));
$$;
create or replace function public.cms_is_owner()
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.cms_members m where m.user_id=(select auth.uid())
    and m.active and not m.must_change_password and m.role='owner');
$$;
create or replace function public.cms_can_upload()
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.cms_members m where m.user_id=(select auth.uid())
    and m.active and not m.must_change_password
    and (m.role='owner' or m.permissions && array['projects','feed','about','contact']::text[]));
$$;
create or replace function public.cms_admin_context()
returns jsonb language sql stable security definer set search_path='' as $$
  select coalesce((select jsonb_build_object('user_id',m.user_id,'email',m.email,'role',m.role,
    'permissions',case when m.role='owner' then array['projects','feed','about','contact','inquiries'] else m.permissions end,
    'active',m.active,'must_change_password',m.must_change_password)
    from public.cms_members m where m.user_id=(select auth.uid()) and m.active),'null'::jsonb);
$$;
revoke all on function public.cms_has_permission(text),public.cms_is_owner(),public.cms_can_upload(),public.cms_admin_context() from public,anon,authenticated;
grant execute on function public.cms_has_permission(text),public.cms_is_owner(),public.cms_can_upload() to anon,authenticated;
grant execute on function public.cms_admin_context() to authenticated;
create policy byx_cms_member_self_read on public.cms_members for select to authenticated
using(user_id=(select auth.uid()) or (select public.cms_is_owner()));
create policy byx_cms_audit_owner_read on public.cms_member_audit for select to authenticated
using((select public.cms_is_owner()));

create or replace function public.cms_preserve_owner()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('BYX CMS membership',0));
  if old.role='owner' and old.active and
     (tg_op='DELETE' or new.role<>'owner' or not new.active or new.must_change_password)
     and not exists(select 1 from public.cms_members where user_id<>old.user_id and role='owner' and active and not must_change_password)
  then raise exception 'LAST_OWNER_REQUIRED' using errcode='42501'; end if;
  if tg_op='DELETE' then return old; end if;
  new.updated_at=now();return new;
end $$;
revoke all on function public.cms_preserve_owner() from public,anon,authenticated;
create trigger byx_cms_preserve_owner before update or delete on public.cms_members
for each row execute function public.cms_preserve_owner();

-- Only the verified server endpoint may invoke membership mutations.
create or replace function public.cms_manage_member(
  p_actor uuid,p_target uuid,p_email text,p_role text,p_permissions text[],p_active boolean,p_require_password boolean
) returns jsonb language plpgsql security definer set search_path='' as $$
declare previous public.cms_members; result public.cms_members;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('BYX CMS membership',0));
  if not exists(select 1 from public.cms_members where user_id=p_actor and role='owner' and active and not must_change_password)
  then raise exception 'OWNER_REQUIRED' using errcode='42501'; end if;
  if p_actor=p_target then raise exception 'CANNOT_CHANGE_SELF' using errcode='42501'; end if;
  if p_role not in ('owner','editor') or p_permissions is null
     or not (p_permissions <@ array['projects','feed','about','contact','inquiries']::text[])
     or p_email is null or not exists(select 1 from auth.users where id=p_target and lower(email)=lower(p_email))
  then raise exception 'INVALID_MEMBER' using errcode='22023'; end if;
  select * into previous from public.cms_members where user_id=p_target;
  if p_active and not coalesce(previous.active,false) and (select count(*) from public.cms_members where active)>=30
  then raise exception 'MEMBER_LIMIT' using errcode='22023'; end if;
  insert into public.cms_members(user_id,email,role,permissions,active,must_change_password)
  values(p_target,lower(p_email),p_role,p_permissions,p_active,p_require_password)
  on conflict(user_id) do update set role=excluded.role,permissions=excluded.permissions,active=excluded.active,
    must_change_password=excluded.must_change_password returning * into result;
  insert into public.cms_member_audit(actor_id,target_id,action,details)
  values(p_actor,p_target,case when not p_active then 'revoke' when previous.user_id is null then 'create' else 'update' end,
    jsonb_build_object('role',result.role,'permissions',result.permissions,'active',result.active));
  return to_jsonb(result);
end $$;
create or replace function public.cms_password_changed(p_user uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.cms_members where user_id=p_user and active)
  then raise exception 'ADMIN_REQUIRED' using errcode='42501'; end if;
  update public.cms_members set must_change_password=false where user_id=p_user;
  insert into public.cms_member_audit(actor_id,target_id,action) values(p_user,p_user,'password_changed');
end $$;
revoke all on function public.cms_manage_member(uuid,uuid,text,text,text[],boolean,boolean),public.cms_password_changed(uuid) from public,anon,authenticated;
grant execute on function public.cms_manage_member(uuid,uuid,text,text,text[],boolean,boolean),public.cms_password_changed(uuid) to service_role;

-- Replace broad authenticated writes with membership checks. Public reads are preserved.
drop policy if exists "write in" on public.projects;
create policy byx_cms_projects_write on public.projects for all to authenticated
using((select public.cms_has_permission('projects'))) with check((select public.cms_has_permission('projects')));
drop policy if exists "write in" on public.news;
create policy byx_cms_news_write on public.news for all to authenticated
using((select public.cms_has_permission('feed'))) with check((select public.cms_has_permission('feed')));
drop policy if exists "write in" on public.posts;
drop policy if exists "read all" on public.posts;
create policy byx_cms_posts_read on public.posts for select to anon,authenticated
using(pub is distinct from false or (select public.cms_has_permission('feed')));
create policy byx_cms_posts_write on public.posts for all to authenticated
using((select public.cms_has_permission('feed'))) with check((select public.cms_has_permission('feed')));
drop policy if exists "write in" on public.settings;
create policy byx_cms_settings_write on public.settings for all to authenticated
using((select public.cms_is_owner()) or (k='about' and (select public.cms_has_permission('about'))) or (k='contact' and (select public.cms_has_permission('contact'))))
with check((select public.cms_is_owner()) or (k='about' and (select public.cms_has_permission('about'))) or (k='contact' and (select public.cms_has_permission('contact'))));
drop policy if exists byx_inquiry_admin_read on public.contact_requests;
drop policy if exists byx_inquiry_admin_status on public.contact_requests;
create policy byx_inquiry_admin_read on public.contact_requests for select to authenticated
using((select public.cms_has_permission('inquiries')));
create policy byx_inquiry_admin_status on public.contact_requests for update to authenticated
using((select public.cms_has_permission('inquiries'))) with check((select public.cms_has_permission('inquiries')));
drop policy if exists byx_admin_media_insert on storage.objects;
create policy byx_admin_media_insert on storage.objects for insert to authenticated
with check(bucket_id='media' and (select public.cms_can_upload()));
commit;
