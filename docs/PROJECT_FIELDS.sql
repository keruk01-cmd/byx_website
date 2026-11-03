-- Optional additive fields for project dates and map selections.
-- Run manually in Supabase SQL Editor after reviewing this file.
-- Existing year/month/loc columns, rows, policies, and tables are preserved.
begin;
alter table public.projects add column if not exists date_start text;
alter table public.projects add column if not exists date_end text;
alter table public.projects add column if not exists location_point jsonb;
commit;
