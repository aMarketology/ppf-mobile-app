-- ─────────────────────────────────────────────────────────────────────────────
-- profiles_social_migration.sql
-- Adds social profile fields to public.profiles
--
-- Run in: Supabase Dashboard → SQL Editor → New query
-- Safe to re-run (IF NOT EXISTS guards).
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists job_title     text null,
  add column if not exists linkedin_url  text null,
  add column if not exists twitter_url   text null,
  add column if not exists github_url    text null,
  add column if not exists youtube_url   text null,
  add column if not exists instagram_url text null,
  add column if not exists website_url   text null;

-- Optional: keep URLs sane (allow null or http/https-prefixed values)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_website_url_check'
  ) then
    alter table public.profiles
      add constraint profiles_website_url_check
      check (website_url is null or website_url ~ '^https?://');
  end if;
end $$;

-- RLS note: profiles rows are already governed by existing policies
-- (users can update their own row) — no policy changes needed.
