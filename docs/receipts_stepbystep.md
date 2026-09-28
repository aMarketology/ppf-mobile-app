# 🧾 OCR Receipt Scanning — Step-by-Step Implementation Guide

> **Last Updated:** September 15, 2026
> **Feature:** Mobile receipt scanning with OCR for construction expense management
> **Status:** Backend deployed, mobile screens built, awaiting DB migration + API key

---

## 📋 Overview

Precision Project Flow's mobile OCR feature allows field workers to scan receipts with their phone camera, automatically extract vendor, date, total, and line items, and sync expenses to the project in real-time.

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐     ┌──────────────┐
│  Mobile Camera   │ ──► │  scan-receipt     │ ──► │  Google Cloud       │ ──► │  receipts     │
│  (React Native)  │     │  Edge Function    │     │  Vision API (OCR)  │     │  table (DB)   │
└─────────────────┘     └──────────────────┘     └─────────────────────┘     └──────────────┘
```

### Files Created/Modified

| File | Purpose | Status |
|------|---------|--------|
| `tables/receipts.sql` | SQL schema — receipts table, RLS, storage bucket | ✅ Written |
| `supabase/functions/scan-receipt/index.ts` | Edge Function — OCR processing via Google Cloud Vision | ✅ Deployed |
| `PPFMobile/src/screens/ReceiptsScreen.tsx` | Receipt list view with status, vendor, amount | ✅ Built |
| `PPFMobile/src/screens/ScanReceiptScreen.tsx` | Camera/gallery capture + OCR results display | ✅ Built |
| `PPFMobile/src/screens/ProfileScreen.tsx` | Added "Receipts" menu item | ✅ Wired |
| `PPFMobile/App.tsx` | Added Receipts + ScanReceipt routes | ✅ Wired |

---

## 🔴 Step 1: Run SQL in Supabase Dashboard

The `receipts` table doesn't exist yet. Run the SQL to create it.

1. Go to **[Supabase Dashboard → SQL Editor](https://supabase.com/dashboard/project/ifrxzmemiihxfdimwvcw/sql/new)**
2. Click **"New Query"**
3. Paste the SQL below
4. Click **"Run"**

```sql
-- ─────────────────────────────────────────────────────────────────────────────
-- receipts — OCR-scanned expense receipts from the mobile app
-- ─────────────────────────────────────────────────────────────────────────────

create table public.receipts (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  project_id      uuid        references projects(id) on delete set null,
  project_name    text,
  vendor_name     text,
  transaction_date date,
  total_amount    numeric(10,2),
  tax_amount      numeric(10,2),
  subtotal        numeric(10,2),
  line_items      jsonb       default '[]',
  cost_code       text,
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
create index idx_receipts_user on public.receipts(user_id, created_at desc);
create index idx_receipts_project on public.receipts(project_id);
create index idx_receipts_status on public.receipts(status);
create index idx_receipts_date on public.receipts(transaction_date);

-- RLS
alter table public.receipts enable row level security;

create policy "Users can view own receipts"
  on public.receipts for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own receipts"
  on public.receipts for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own receipts"
  on public.receipts for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own receipts"
  on public.receipts for delete
  to authenticated
  using (user_id = auth.uid());

-- Updated at trigger
create trigger set_receipts_updated_at
  before update on public.receipts
  for each row
  execute function update_updated_at_column();

-- Storage bucket for receipt images
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

-- Storage RLS: authenticated users can upload/view their own receipts
create policy "Users can view own receipt images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can upload receipt images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
```

### What this SQL does:
- ✅ Creates `receipts` table with all fields
- ✅ Adds indexes for fast queries (by user, project, status, date)
- ✅ Enables Row Level Security (users see only their own receipts)
- ✅ Creates storage bucket `receipts` for receipt images
- ✅ Sets up storage RLS policies

---

## 🔴 Step 2: Get Google Cloud Vision API Key

The Edge Function uses Google Cloud Vision for OCR. You need an API key.

1. Go to **[console.cloud.google.com](https://console.cloud.google.com)**
2. Create a new project (or select existing)
3. Navigate to **APIs & Services → Library**
4. Search for **"Cloud Vision API"** and click **Enable**
5. Go to **APIs & Services → Credentials**
6. Click **"Create Credentials" → "API Key"**
7. Copy the generated key
8. Restrict the key to **Cloud Vision API** only (recommended)

### Set the secret in Supabase

```bash
cd /Users/thelegendofzjui/Documents/GitHub/ppf-mobile-app
supabase secrets set GOOGLE_CLOUD_VISION_API_KEY=your_key_here
```

---

## ✅ Step 3: Verify Everything Works

### Check the Edge Function is deployed

```bash
supabase functions list --project-ref ifrxzmemiihxfdimwvcw
```

Expected output: `scan-receipt` listed as deployed.

### Check the table exists

```bash
curl -s "https://ifrxzmemiihxfdimwvcw.supabase.co/rest/v1/receipts?select=id&limit=1" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

Expected: Returns `[]` (empty array — no receipts yet, but table exists)

### Test on device

1. Open the app on your phone
2. Tap **Profile → Receipts**
3. Tap **"Scan Receipt"**
4. Take a photo of a receipt
5. Wait for OCR processing
6. Verify extracted data (vendor, date, total)
7. Tap **"Done — View Receipts"**
8. Verify receipt appears in the list

---

## 🔧 Troubleshooting

### Edge Function returns 500
- Check `supabase functions logs scan-receipt --project-ref ifrxzmemiihxfdimwvcw`
- Verify `GOOGLE_CLOUD_VISION_API_KEY` is set: `supabase secrets list`

### Camera doesn't open
- Android: Check camera permissions in Settings → Apps → Precision Project Flow → Permissions
- The app uses `react-native-image-picker` which requests camera access automatically

### Receipts list is empty after scanning
- Check the `receipts` table in Supabase Dashboard → Table Editor
- Verify the user is authenticated (check JWT is valid)

### OCR results are inaccurate
- Ensure the receipt image is well-lit and in focus
- Try a standard store receipt (clear text, simple layout)
- Complex receipts with dense text may have lower accuracy

---

## 📝 Notes

- **Google Cloud Vision Free Tier**: 1,000 images/month free, then ~$1.50 per 1,000 images
- **Image Storage**: Receipt images stored in Supabase Storage `receipts` bucket
- **Security**: RLS ensures users can only see their own receipts
- **Cost Codes**: Future enhancement — auto-map to CSI divisions based on vendor/category