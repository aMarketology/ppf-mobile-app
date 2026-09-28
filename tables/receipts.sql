-- ─────────────────────────────────────────────────────────────────────────────
-- receipts — OCR-scanned expense receipts from the mobile app
--
-- Simplified for CNC / manufacturing job costing:
--   • No hard FK to a (nonexistent) projects table — job_number is free text
--   • cost_code is free text (CSI division e.g. "06-100 Rough Carpentry")
--   • vendor_name, transaction_date, totals, line_items extracted by OCR
--   • image_url points to a Supabase Storage object
--
-- Idempotent — safe to run multiple times.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.receipts (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  job_number      text,       -- free-text job / project number (e.g. "JOB-1042")
  vendor_name     text,
  transaction_date date,
  total_amount    numeric(12,2),
  tax_amount      numeric(12,2),
  subtotal        numeric(12,2),
  line_items      jsonb       default '[]'::jsonb,
  cost_code       text,       -- CSI division or cost code (free text)
  cost_code_desc  text,
  notes           text,
  image_url       text,
  ocr_raw_text    text,
  ocr_confidence  real,
  status          text        not null default 'pending'::text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Indexes
create index if not exists idx_receipts_user on public.receipts(user_id, created_at desc);
create index if not exists idx_receipts_job on public.receipts(job_number);
create index if not exists idx_receipts_status on public.receipts(status);
create index if not exists idx_receipts_date on public.receipts(transaction_date);

-- RLS
alter table public.receipts enable row level security;

drop policy if exists "Users can view own receipts" on public.receipts;
create policy "Users can view own receipts"
  on public.receipts for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can insert own receipts" on public.receipts;
create policy "Users can insert own receipts"
  on public.receipts for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can update own receipts" on public.receipts;
create policy "Users can update own receipts"
  on public.receipts for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can delete own receipts" on public.receipts;
create policy "Users can delete own receipts"
  on public.receipts for delete
  to authenticated
  using (user_id = auth.uid());

-- Storage bucket for receipt images
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

-- Storage RLS: authenticated users can upload/view their own receipts
drop policy if exists "Users can view own receipt images" on storage.objects;
create policy "Users can view own receipt images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can upload receipt images" on storage.objects;
create policy "Users can upload receipt images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);