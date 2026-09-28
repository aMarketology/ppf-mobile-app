# Schema Audit — Local vs Live Supabase

> **Date:** September 25, 2026
> **Purpose:** Verify `sql/tables/*.sql` are 1:1 with the live Supabase schema before implementing OCR receipt scanning.

---

## ⚠️ Critical Finding

### `sql/tables/` is STALE and EMPTY
The 11 files in `/sql/tables/` are **empty placeholder stubs**. They do NOT contain the real schema.

```
sql/tables/
├── company_profiles.sql   (empty)
├── converstations.sql     (empty)
├── messages.sql           (empty)
├── product_orders.sql     (empty)
├── products.sql           (empty)
├── profiles.sql           (empty)
├── refunds.sql            (empty)
├── services_media_migration.sql (empty)
├── stripe_connnect_accounts.sql  (empty)
├── stripe_transfers.sql   (empty)
└── token_purchase.sql     (empty)
```

### The REAL schema lives in `/tables/` (32 files)
This is the authoritative source:
```
tables/
├── company_claims.sql
├── company_members.sql
├── company_profiles.sql       ✅
├── conversation_participants.sql
├── converstations.sql         ✅ (note: misspelled "converstations")
├── credit_tokens.sql
├── feed_bids.sql
├── feed_comments.sql
├── feed_likes.sql
├── feed_migration.sql
├── friends.sql
├── get_or_create_conversation.sql
├── message_mentions.sql
├── messages.sql
├── orders.sql
├── product_orders.sql
├── products.sql               ✅
├── profiles.sql               ✅
├── receipts.sql               ✅ (just fixed)
├── refunds.sql
├── rfqs.sql
├── rfqs_offers.sql            (note: plural "rfqs_offers")
├── services.sql               ✅
├── site_activites.sql         (note: misspelled "activites")
├── stripe_add_tokens_rpc.sql
├── stripe_connect_accounts.sql
├── stripe_transfers.sql
├── token_purchases.sql
├── token_transactions.sql
├── user_converstations.sql    (note: misspelled)
└── user_messages.sql          (empty!)
```

---

## 📋 Live Supabase Table Inventory

Confirmed via PostgREST probes:

| Table | Exists in live DB? | Local file? |
|-------|-------------------|-------------|
| `profiles` | ✅ | `tables/profiles.sql` |
| `products` | ✅ | `tables/products.sql` |
| `services` | ✅ | `tables/services.sql` |
| `company_profiles` | ✅ | `tables/company_profiles.sql` |
| `feed_posts` | ✅ | `tables/feed_likes.sql` (contains feed_posts) |
| `site_activities` | ✅ | `tables/site_activites.sql` |
| `rfqs` | ✅ | `tables/rfqs.sql` |
| `conversations` | ✅ | `tables/converstations.sql` |
| `user_conversations` | ✅ | `tables/user_converstations.sql` |
| `orders` | ✅ | `tables/orders.sql` |
| **`receipts`** | ❌ **NOT created** | `tables/receipts.sql` |
| **`projects`** | ❌ **DOES NOT EXIST** | (was wrongly referenced) |

---

## 🔧 Fixes Applied

### 1. `receipts.sql` — fixed FK bug + simplified
- ❌ Removed `project_id uuid REFERENCES projects(id)` — `projects` table doesn't exist
- ✅ Added `job_number text` (free-text project/job number for CNC job costing)
- ✅ `cost_code text` (free-text CSI division)
- ✅ Made fully idempotent (`if not exists`, `drop policy if exists`)

### 2. Receipts now needs NO `projects` table
The receipt flow works standalone: user → job_number → cost_code → line_items.

---

## 🎯 Next: Run the Fixed receipts.sql

The corrected `receipts.sql` is ready. It needs to be run against the live Supabase DB via:
- **Supabase Dashboard → SQL Editor**, OR
- `supabase db push` (requires Docker)

The `receipts` table will then be created, and OCR receipt scanning can go live.

---

## 📝 Recommended Cleanup (later, not blocking)

1. **Delete/replace empty `sql/tables/` stubs** — they're misleading
2. **Fix typos**: `converstations.sql` → `conversations.sql`, `activites` → `activities`
3. **`user_messages.sql` is empty** despite being referenced by `rfq_offers`
4. **`vqmadoejowuyvdrisnyd` vs `ifrxzmemiihxfdimwvcw`** — verify which project URL is correct (docs reference both)