# PPF Mobile Application — Environment & Integration Reference
**Precision Project Flow | Engineering Marketplace Platform**
*Revision: March 31, 2026 — Confidential Technical Document*

---

## Overview

The PPF mobile application shares the **exact same backend** as the web platform. There is no separate API layer — the mobile app connects directly to Supabase (database + auth + storage) and calls the same Next.js API routes hosted on the web server. Stripe handles all payment processing. Resend handles all transactional email.

The "magic" — marketplace purchasing, feed auto-posts on transactions, token-gated messaging, friends graph — all lives in these three services wired together.

---

## 1. Environment Variables

These are the **exact keys** the mobile app must be configured with. Mirror these 1:1 from the web `.env.local` into your mobile environment config (`.env`, `app.config.js`, or Expo `eas.json` secrets depending on your build system).

```bash
# ─── Supabase ────────────────────────────────────────────────────────────────
# Project URL — all DB queries, auth, and storage calls go here
NEXT_PUBLIC_SUPABASE_URL=https://ifrxzmemiihxfdimwvcw.supabase.co

# Anon key — safe to embed in client (RLS enforces data access)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlmcnh6bWVtaWloeGZkaW13dmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNzYzNDEsImV4cCI6MjA4NzY1MjM0MX0.2_xxH2XZyNrLaRIQBMr2Fr2upn-3CKZuUTf1SVgojvc

# Service role key — SERVER ONLY, never ship in mobile bundle
# Only used in Next.js API routes (admin operations, webhook handlers)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlmcnh6bWVtaWloeGZkaW13dmN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjA3NjM0MSwiZXhwIjoyMDg3NjUyMzQxfQ.WSL9LMRhr8HulQFBGOETst08940d9yUNkmjTfrzzKHA

# ─── Stripe ──────────────────────────────────────────────────────────────────
# Secret key — SERVER ONLY, never ship in mobile bundle
# Lives only in Next.js API routes (/api/stripe/*)
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY_HERE

# Publishable key — safe to embed in mobile client
# Used to initialize Stripe SDK on device: Stripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE

# Webhook secret — SERVER ONLY
# Verifies Stripe event signatures in /api/stripe/webhook
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# ─── Resend ──────────────────────────────────────────────────────────────────
# SERVER ONLY — never ship in mobile bundle
# Used in Next.js API routes to fire transactional email
RESEND_API_KEY=re_AJN4JfQb_E3qmbYgDjQE6i3MsU5rnCfpF

# ─── Web Platform Base URL ───────────────────────────────────────────────────
# Mobile app uses this to call Next.js API routes
# Change to production URL when deploying
NEXT_PUBLIC_APP_URL=https://precisionprojectflow.com
# Local dev: NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 2. Security Model — What Goes Where

```
┌─────────────────────────────────────────────────────────────┐
│  MOBILE APP BUNDLE (safe to include)                        │
│  NEXT_PUBLIC_SUPABASE_URL           ✅                      │
│  NEXT_PUBLIC_SUPABASE_ANON_KEY      ✅  (RLS protects data) │
│  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ✅                      │
│  NEXT_PUBLIC_APP_URL                ✅                      │
├─────────────────────────────────────────────────────────────┤
│  SERVER ONLY — Next.js API routes  (never in mobile bundle) │
│  SUPABASE_SERVICE_ROLE_KEY          🔒                      │
│  STRIPE_SECRET_KEY                  🔒                      │
│  STRIPE_WEBHOOK_SECRET              🔒                      │
│  RESEND_API_KEY                     🔒                      │
└─────────────────────────────────────────────────────────────┘
```

All sensitive operations (create payment intent, send email, write orders, spend tokens) are **proxied through Next.js API routes**. The mobile app never touches Stripe's secret API or Resend directly.

---

## 3. Database Schema — Live Tables (Supabase Project: `ifrxzmemiihxfdimwvcw`)

```sql
-- Core identity
public.profiles              -- all users (vendors/engineers and buyers/suppliers)
  id              UUID       -- = auth.users.id
  email           TEXT
  full_name       TEXT
  user_type       TEXT       -- 'engineer' (vendor) | 'client' (supplier/buyer)
  company_name    TEXT
  bio             TEXT
  location        TEXT
  token_balance   INTEGER    -- messaging token balance, default 0
  avatar_url      TEXT

-- Marketplace
public.services              -- service listings posted by vendors
  id              UUID
  provider_id     UUID       -- FK → profiles.id
  title           TEXT
  description     TEXT
  price           DECIMAL(10,2)
  category        TEXT
  tags            TEXT[]
  active          BOOLEAN

public.orders                -- completed/pending purchases
  id              UUID
  client_id       UUID       -- FK → profiles.id (buyer)
  engineer_id     UUID       -- FK → profiles.id (vendor)
  service_id      UUID       -- FK → services.id
  status          TEXT       -- 'pending' | 'in_progress' | 'completed' | 'cancelled'
  total_amount    DECIMAL(10,2)

-- Social feed
public.feed_posts            -- all posts (manual + auto-generated from transactions)
  id              UUID
  author_id       UUID       -- FK → profiles.id
  content         TEXT
  post_type       TEXT       -- 'update' | 'project_showcase' | 'job_post' | 'milestone'
  media_urls      TEXT[]     -- images/videos in Supabase storage bucket: post-media
  linked_type     TEXT       -- 'service' | 'order' | null
  linked_id       UUID       -- deep-link back to a service or order
  likes_count     INTEGER    -- maintained automatically by DB trigger
  comments_count  INTEGER    -- maintained automatically by DB trigger
  is_published    BOOLEAN

public.feed_likes            -- post likes (UNIQUE per user per post)
  post_id         UUID       -- FK → feed_posts.id
  user_id         UUID       -- FK → profiles.id

public.feed_comments         -- post comments
  post_id         UUID       -- FK → feed_posts.id
  author_id       UUID       -- FK → profiles.id
  content         TEXT

-- Messaging
public.user_conversations    -- one row per unique user pair
  id              UUID
  participant_one_id  UUID   -- always the smaller UUID (enforces UNIQUE constraint)
  participant_two_id  UUID
  is_contracted   BOOLEAN    -- true = all messages free (active order relationship)
  last_message_at TIMESTAMP

public.user_messages         -- individual messages
  id              UUID
  conversation_id UUID       -- FK → user_conversations.id
  sender_id       UUID       -- FK → profiles.id
  content         TEXT
  is_read         BOOLEAN
  tokens_spent    INTEGER    -- 0 if free, 2 if cold outreach

-- Social graph
public.friends               -- connection requests between users
  id              UUID
  requester_id    UUID       -- FK → profiles.id
  addressee_id    UUID       -- FK → profiles.id
  status          TEXT       -- 'pending' | 'accepted' | 'declined'
```

---

## 4. API Routes — Mobile Calls These via HTTP

The mobile app calls these Next.js API routes. All require a valid Supabase JWT (set via the Supabase client SDK automatically on every authenticated request).

```
POST  /api/stripe/create-payment-intent
      Body:    { productId: string }        ← service UUID
      Returns: { clientSecret, paymentIntentId, amount, currency }
      Side effects (all automatic, fire-and-forget):
        → INSERT into orders (status: 'pending')
        → POST /api/feed/auto-post { type: 'service_purchased' }
            → INSERT feed_posts (post_type: 'milestone') from vendor's account
        → Resend: 'order_placed'   email  → vendor inbox
        → Resend: 'order_accepted' email  → buyer inbox

POST  /api/messages/send
      Body:    { conversationId: string, content: string }
      Returns: { message, free: boolean, tokensSpent: number, reason: string }
      reason values: 'first_message' | 'contracted' | 'friends' | 'paid'
      Returns HTTP 402 { error: 'insufficient_tokens', cost: 2 } if balance < 2

POST  /api/feed/auto-post
      Body:    { type: 'service_listed' | 'service_purchased', serviceId, vendorId, buyerId? }
      Internal use only — called by payment intent route and service create route
      Auto-generates feed posts on marketplace events

GET   /api/feed?page=0&type=all
      Returns: { posts: FeedPost[], page: number, hasMore: boolean }
      type filter: 'all' | 'update' | 'project_showcase' | 'job_post' | 'milestone'
      Pagination: 10 posts per page, pass page=1, page=2, etc.

POST  /api/feed
      Body:    { content: string, post_type?: string, media_urls?: string[] }
      Returns: { post }
      Creates a manual feed post (author = authenticated user)

POST  /api/feed/:id/like
      Toggles like on a post for the authenticated user
      (INSERT feed_likes on first call, DELETE on second — toggle behavior)
```

---

## 5. DB Functions — Callable via `supabase.rpc()`

```typescript
// Get or create a conversation between two users (idempotent)
supabase.rpc('get_or_create_conversation', {
  user_one_id: string,   // UUID
  user_two_id: string,   // UUID
})
// Returns: UUID — the conversation id

// Check if two users have an accepted friend connection
supabase.rpc('are_friends', {
  user_a: string,        // UUID
  user_b: string,        // UUID
})
// Returns: boolean

// Spend tokens from a user's balance (atomic, safe for concurrent calls)
supabase.rpc('spend_tokens', {
  p_user_id:     string,  // UUID
  p_amount:      number,
  p_description: string,  // optional audit label
})
// Returns: 'ok' | 'insufficient_tokens'

// Add tokens to a user's balance (called after Stripe payment confirms)
supabase.rpc('add_tokens', {
  p_user_id:            string,  // UUID
  p_amount:             number,
  p_stripe_payment_id:  string,  // optional, for audit trail
})
// Returns: void
```

---

## 6. The Marketplace ↔ Feed Integration Flow

This is where the two surfaces connect. Every economic event on the marketplace produces a social signal on the feed automatically.

```
VENDOR publishes a service
──────────────────────────
  INSERT into services (active: true)
  → POST /api/feed/auto-post { type: 'service_listed', serviceId, vendorId }
    → INSERT feed_posts {
        author_id:   vendorId,
        post_type:   'project_showcase',
        content:     '🚀 New service available: [title]\n[description preview]\n💰 $[price] · [category]',
        linked_type: 'service',
        linked_id:   serviceId,
      }

  Feed renders: service card deep-linkable into /marketplace/service/[id]


SUPPLIER purchases a service
─────────────────────────────
  POST /api/stripe/create-payment-intent
  → Stripe PaymentIntent created (amount in cents)
  → INSERT orders { client_id, engineer_id, service_id, status: 'pending', total_amount }
  → POST /api/feed/auto-post { type: 'service_purchased', serviceId, vendorId, buyerId }
    → INSERT feed_posts {
        author_id:   vendorId,
        post_type:   'milestone',
        content:     '🎉 New order received for [title]! Thanks to [buyer.full_name]...',
        linked_type: 'service',
        linked_id:   serviceId,
      }
  → Resend fires:
      order_placed   → vendor email  ("You have a new order")
      order_accepted → buyer email   ("Your order is confirmed")

  Feed renders: vendor milestone post visible to entire network
```

---

## 7. Messaging Token Economics

```
Cold outreach between strangers:
  Message #1       → FREE   (first opener is always free)
  Message #2+      → 2 tokens each

Free messaging — any one condition unlocks free messaging permanently:
  are_friends(sender, recipient) = true     → accepted connection
  conversation.is_contracted     = true     → active order relationship

Token packs (purchased via Stripe, credits added via add_tokens()):
  Starter   10 tokens    $10.00   ($1.00/token)
  Pro       50 tokens    $45.00   ($0.90/token)
  Business  120 tokens   $99.00   ($0.83/token)

Token balance:  profiles.token_balance  (INTEGER, default 0)
Deduct:         spend_tokens()          (atomic DB function)
Credit:         add_tokens()            (called after Stripe webhook confirms)
Insufficient:   HTTP 402 from /api/messages/send
```

---

## 8. Supabase Storage

```
Bucket ID:   post-media
Visibility:  public  (anyone can read, authenticated users can write)
Path format: {user_id}/{unix_timestamp}-{random_hex}.{ext}
Allowed:     image/jpeg, image/png, image/webp, image/gif,
             video/mp4, video/quicktime, video/webm
Max files:   4 per post
Public URL:  supabase.storage.from('post-media').getPublicUrl(path).data.publicUrl
```

---

## 9. Auth Flow (Mobile SDK)

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Sign in with email + password
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
})

// Get current authenticated user
const { data: { user } } = await supabase.auth.getUser()

// Fetch full profile including token balance
const { data: profile } = await supabase
  .from('profiles')
  .select('id, full_name, user_type, token_balance, avatar_url, company_name, location')
  .eq('id', user.id)
  .single()

// Route based on user type
// profile.user_type === 'engineer'  →  Vendor experience (list services, manage orders)
// profile.user_type === 'client'    →  Buyer experience  (browse, purchase, message)
```

---

## 10. Test Credentials

```
Vendor (engineer):   vendor@ppf.test    / 123456md
Supplier (client):   supplier@ppf.test  / 123456md

Stripe test card:    4242 4242 4242 4242
Expiry:              12/26
CVC:                 123
ZIP:                 12345

Note: test accounts have token_balance = 20
```

---

*End of document.*
*All keys, schemas, and API contracts above reflect the live production state as of March 31, 2026.*
*When switching to production Stripe keys, replace sk_test_* → sk_live_* and pk_test_* → pk_live_**
