# Google Vision API — Step-by-Step Setup Guide

> **Goal:** Wire Google Cloud Vision into (1) receipt OCR scanning and (2) AI-assisted post/RFQ writing.
> **Status:** Code is written — needs API key + deployment.
> **Last updated:** October 3, 2026

---

## 📋 Overview

| Piece | File | Status |
|---|---|---|
| Receipt OCR function | `supabase/functions/scan-receipt/index.ts` | ✅ Written (already calls Vision) |
| Post/RFQ assist function | `supabase/functions/vision-assist/index.ts` | ✅ Written (new) |
| Receipt screen | `PPFMobile/src/screens/ScanReceiptScreen.tsx` | ✅ Already calls `scan-receipt` |
| Post composer "Auto-write" | `PPFMobile/src/screens/ActivityFeedScreen.tsx` | ✅ Button added |
| RFQ "Auto-write" | `PPFMobile/src/screens/CreateRFQScreen.tsx` | ✅ Button added |
| **API key** | Supabase Edge Function secret | ❌ **Not set yet** |
| **Deploy functions** | Supabase | ❌ **Not deployed yet** |

---

## ✅ STEP 1 — Get the Google Cloud Vision API key

1. Go to **https://console.cloud.google.com/apis/credentials**
   - Make sure you're in the **correct Google Cloud project** (the one with Vision API enabled — you just got Google Suite access, so confirm which project that is).
2. Click **+ Create Credentials** → **API key**
3. Copy the key — it looks like `AIzaSy...`
4. **Restrict the key (important):**
   - Click the key you just created
   - Under **API restrictions** → select **Cloud Vision API** only
   - Save
   - This prevents abuse if the key ever leaks.

> ⚠️ **Never** put this key in the mobile app's `.env` or commit it to git. It only lives in Supabase's secret store.

---

## ✅ STEP 2 — Add the key to Supabase (Edge Function secret)

The edge functions read it via `Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY')`.

### Option A — Dashboard (easiest)
1. Open **Supabase Dashboard** → project `ifrxzmemiihxfdimwvcw`
2. Left sidebar → **Edge Functions**
3. Click the **gear / Settings** icon → **Secrets** (or "Manage secrets")
4. Add a new secret:
   - **Name:** `GOOGLE_CLOUD_VISION_API_KEY`
   - **Value:** `AIzaSy...` (your key)
5. Save

### Option B — CLI
```bash
cd /Users/thelegendofzjui/Documents/GitHub/ppf-mobile-app
supabase secrets set GOOGLE_CLOUD_VISION_API_KEY=AIzaSy...
```

---

## ✅ STEP 3 — Deploy the edge functions

```bash
cd /Users/thelegendofzjui/Documents/GitHub/ppf-mobile-app

# Deploy the receipt OCR function (may already be live — redeploy to pick up latest)
supabase functions deploy scan-receipt

# Deploy the new vision-assist function
supabase functions deploy vision-assist
```

> If you don't have the Supabase CLI installed:
> ```bash
> brew install supabase/tap/supabase
> supabase login
> supabase link --project-ref ifrxzmemiihxfdimwvcw
> ```

---

## ✅ STEP 4 — Verify the secret is set

```bash
supabase secrets list
```

You should see `GOOGLE_CLOUD_VISION_API_KEY` in the list.

---

## ✅ STEP 5 — Test end-to-end

### Test the function directly (curl)
```bash
# Replace TOKEN with a valid user JWT (from the app session)
curl -X POST \
  "https://ifrxzmemiihxfdimwvcw.supabase.co/functions/v1/vision-assist" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"image_url": "https://example.com/sample-drawing.jpg"}'
```

**Expected response:**
```json
{
  "ocr_text": "...",
  "suggested_title": "...",
  "suggested_body": "...",
  "suggested_tags": ["..."]
}
```

### Test in the app
1. Reload the app on the device (Metro must be running)
2. **Receipts:** Profile → Receipts → Scan Receipt → take/upload a photo → should now return parsed fields instead of "pending"
3. **Post:** Feed → **+** → attach a photo → tap **✨ Auto-write** → post text should pre-fill
4. **RFQ:** RFQ tab → **+ Post RFQ** → Step 1 → attach a drawing/spec → tap **✨ Auto-write** → title + description pre-fill

---

## ✅ STEP 6 — Commit the code

```bash
cd /Users/thelegendofzjui/Documents/GitHub/ppf-mobile-app
git add supabase/functions/vision-assist PPFMobile/src/screens/ActivityFeedScreen.tsx PPFMobile/src/screens/CreateRFQScreen.tsx
git commit -m "feat: Google Vision AI assist for posts, RFQs, and receipts"
```

---

## 🧯 Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `GOOGLE_CLOUD_VISION_API_KEY not configured` | Secret not set | Do Step 2 |
| `401 Unauthorized` from function | Bad/missing JWT | Use a fresh session token |
| `403` from Vision API | Key not restricted to Vision, or billing not enabled | Check API restrictions + billing in Google Cloud |
| `Quota exceeded` | Free tier hit | Check usage in Google Cloud console |
| Receipt shows "pending" | OCR returned empty | Check Vision API logs; test with a clearer photo |

---

## 🔒 Security notes

- The API key lives **only** in Supabase secrets — never in the app bundle
- Both functions require a valid **user JWT** (Authorization header) before processing
- Consider adding a **rate limit** later if usage grows (Supabase Edge Function rate limiting or a simple per-user counter)