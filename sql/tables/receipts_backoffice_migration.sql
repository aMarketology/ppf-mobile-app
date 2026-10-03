-- ─────────────────────────────────────────────────────────────────────────────
-- receipts_backoffice_migration.sql
-- Adds back-office workflow fields to public.receipts for "Single Player Mode":
--   field worker scans → receipt lands in back office → approve/reject.
--
-- Run in: Supabase Dashboard → SQL Editor → New query
-- Safe to re-run (IF NOT EXISTS guards).
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.receipts
  add column if not exists company_id     uuid null references public.company_profiles(id) on delete set null,
  add column if not exists category       text null,
  add column if not exists review_status  text not null default 'pending',
  add column if not exists reviewed_by    uuid null references auth.users(id) on delete set null,
  add column if not exists reviewed_at    timestamptz null;

-- Constraint: review_status must be one of the workflow states
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'receipts_review_status_check'
  ) then
    alter table public.receipts
      add constraint receipts_review_status_check
      check (review_status in ('pending', 'approved', 'rejected'));
  end if;
end $$;

-- Indexes for back-office queries
create index if not exists idx_receipts_company on public.receipts(company_id);
create index if not exists idx_receipts_review_status on public.receipts(review_status);

-- ─── RLS: allow company members to view company receipts ────────────────────
-- Field workers (owner) already have full access via existing policies.
-- Add a policy so back-office staff (same company) can see + review receipts.

drop policy if exists "Company members can view company receipts" on public.receipts;
create policy "Company members can view company receipts"
  on public.receipts for select
  to authenticated
  using (
    company_id is not null
    and exists (
      select 1 from public.company_members cm
      where cm.company_id = receipts.company_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists "Company members can review company receipts" on public.receipts;
create policy "Company members can review company receipts"
  on public.receipts for update
  to authenticated
  using (
    company_id is not null
    and exists (
      select 1 from public.company_members cm
      where cm.company_id = receipts.company_id
        and cm.user_id = auth.uid()
    )
  )
  with check (
    company_id is not null
    and exists (
      select 1 from public.company_members cm
      where cm.company_id = receipts.company_id
        and cm.user_id = auth.uid()
    )
  );