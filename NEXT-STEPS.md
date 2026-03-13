# PPF Mobile App — NEXT STEPS
## Implementation Tracker

> Last Updated: February 26, 2026
> Current Focus: Phase 1 MVP — Auth Flow + Schema Alignment

---

## 🔴 IMMEDIATE (Do Now)

### Step 0: Fix Environment & Schema Alignment
These are blockers for everything else.

- [x] Supabase credentials added to `.env`
- [ ] Fix `.env` — move real keys to `EXPO_PUBLIC_` prefix
- [ ] Align `types/models.ts` with actual `/tables/*.sql` schemas
- [ ] Align `lib/api.ts` field names with actual column names
- [ ] Align `hooks/useProducts.ts` field names

**Why:** Our code uses `title`, `active`, `verified` but the DB uses `name`, `is_active`, `is_verified`. This will crash immediately.

---

### Step 1: Full Authentication Flow ← **WE ARE HERE**
**Screens:** `(auth)/login`, `(auth)/signup`, `(auth)/forgot-password`
**Files to build/fix:**

- [ ] Fix `.env` file (EXPO_PUBLIC_ prefix)
- [ ] Fix `lib/supabase.ts` to use correct env keys
- [ ] Fix `lib/auth.ts` — `signUp` must pass `user_type` in metadata correctly
- [ ] Build `(auth)/login.tsx` — polished, matches design spec
  - Email + password fields
  - Error handling with inline messages
  - "Forgot password" link
  - "Sign up" link
  - Loading state on button
- [ ] Build `(auth)/signup.tsx` — polished, matches design spec
  - Client vs Engineer type selector (two-button toggle)
  - Full name, email, password fields
  - Password strength indicator
  - Terms acceptance
  - Error handling
- [ ] Build `(auth)/forgot-password.tsx`
  - Email field
  - Success state (email sent confirmation)
- [ ] Fix `app/index.tsx` — proper loading gate
- [ ] Test full flow on device

**Definition of Done:**
- Real user can sign up → auto-creates `profiles` row in Supabase
- Real user can log in → lands on Home tab
- Real user can reset password → receives email
- Session persists after app restart
- Signing out returns to login screen

---

## 🟡 NEXT (After Auth Works)

### Step 2: Home / Marketplace Screen
**File:** `app/(tabs)/index.tsx`

- [ ] Fix `lib/api.ts` field names (name, is_active, etc.)
- [ ] Fix `components/marketplace/ProductCard.tsx` field names
- [ ] Fetch and display featured products from Supabase
- [ ] Fetch and display featured companies from Supabase
- [ ] Category grid navigates to search with filter pre-set
- [ ] Search bar navigates to search tab
- [ ] Skeleton loading states
- [ ] Pull-to-refresh

### Step 3: Product Detail Screen
**File:** `app/product/[id].tsx`

- [ ] Full image display (product photo or placeholder)
- [ ] Company info strip (logo, name, verified badge, rating)
- [ ] Price display (formatted from cents)
- [ ] Description
- [ ] Delivery time
- [ ] Similar products horizontal scroll
- [ ] Sticky footer: "Message Vendor" + "Buy Now" buttons
- [ ] Save/unsave product (heart icon)
- [ ] Loading skeleton

### Step 4: Search Screen
**File:** `app/(tabs)/search.tsx`

- [ ] Search input (debounced)
- [ ] Category filter pills
- [ ] Price range filter
- [ ] Sort options
- [ ] Product grid results
- [ ] "No results" empty state
- [ ] Loading skeleton

### Step 5: Company Profile Screen
**File:** `app/company/[id].tsx`

- [ ] Company header (logo, name, verified badge, rating, location)
- [ ] About section
- [ ] Products/services list
- [ ] Contact info
- [ ] "Message" CTA

---

## 🟢 THEN (Phase 1 Completion)

### Step 6: Checkout Flow
**File:** `app/checkout/[id].tsx`

- [ ] Order summary
- [ ] Contact info review
- [ ] Project notes text area
- [ ] Stripe Payment Sheet integration
- [ ] Platform fee calculation (5%)
- [ ] Total display
- [ ] Place Order button
- [ ] Success screen

### Step 7: Orders Screen
**File:** `app/(tabs)/orders.tsx`

- [ ] Tab filter: Active / Completed / All
- [ ] `OrderCard` component
- [ ] Status badge
- [ ] Pull-to-refresh
- [ ] Empty state
- [ ] Navigate to order detail

### Step 8: Messaging Screen
**File:** `app/(tabs)/messages.tsx` + `app/conversation/[id].tsx`

- [ ] `ConversationItem` component
- [ ] Unread count badge
- [ ] Real-time conversation list
- [ ] Full chat screen with `MessageBubble`
- [ ] `ChatInput` component with send button
- [ ] Real-time messages via Supabase Realtime
- [ ] Mark as read on open

### Step 9: Profile Screen
**File:** `app/(tabs)/profile.tsx`

- [ ] Display real profile data from Supabase
- [ ] Edit profile form
- [ ] Avatar display (initials fallback)
- [ ] Sign out with confirmation
- [ ] Settings section

---

## 🔵 PHASE 2 (After MVP)

- [ ] Push notifications (Expo Notifications)
- [ ] Advanced search filters
- [ ] Image uploads (product images, avatar)
- [ ] Document picker for attachments
- [ ] Biometric login (Face ID)
- [ ] Saved products / wishlist
- [ ] Reviews & ratings

---

## 🔵 PHASE 3 (Advanced)

- [ ] RFQ System
- [ ] Project management
- [ ] Analytics dashboard (vendors)
- [ ] Video consultations
- [ ] Offline mode

---

## 🐛 Known Bugs / Issues to Fix

| # | Issue | File | Priority |
|---|---|---|---|
| 1 | `.env` has wrong prefix (`NEXT_PUBLIC_` instead of `EXPO_PUBLIC_`) | `.env` | 🔴 Critical |
| 2 | `types/models.ts` field names don't match DB schema | `types/models.ts` | 🔴 Critical |
| 3 | `lib/api.ts` queries wrong column names (`title` vs `name`) | `lib/api.ts` | 🔴 Critical |
| 4 | `app/(tabs)/_layout.tsx` uses `<span>` (web-only) for tab icons | `_layout.tsx` | 🔴 Critical |
| 5 | `types/models.ts` Profile missing `avatar_url`, `phone`, `company_name` (not in actual schema) | `types/models.ts` | 🟡 High |
| 6 | Stripe version mismatch warning | `package.json` | 🟢 Low |

---

## 📐 File Status Legend

| Status | Meaning |
|---|---|
| ✅ Done | Built and correct |
| ⚠️ Needs Fix | Built but has bugs / schema mismatch |
| 🚧 In Progress | Currently being built |
| 📋 Planned | Next to build |
| ❌ Blocked | Can't build until dependency done |

---

## 🗂️ Current File Status

| File | Status | Notes |
|---|---|---|
| `constants/Colors.ts` | ✅ | |
| `constants/Theme.ts` | ✅ | |
| `constants/Categories.ts` | ✅ | |
| `constants/Config.ts` | ✅ | |
| `types/models.ts` | ⚠️ | Schema mismatch with actual DB |
| `types/navigation.ts` | ✅ | |
| `lib/supabase.ts` | ⚠️ | Wrong env var names |
| `lib/auth.ts` | ⚠️ | Minor fixes needed |
| `lib/api.ts` | ⚠️ | Wrong column names |
| `lib/notifications.ts` | ✅ | |
| `hooks/useProducts.ts` | ⚠️ | Wrong column names |
| `hooks/useOrders.ts` | ✅ | |
| `hooks/useMessages.ts` | ✅ | |
| `contexts/AuthContext.tsx` | ✅ | |
| `contexts/CartContext.tsx` | ✅ | |
| `components/ui/Button.tsx` | ✅ | |
| `components/ui/Card.tsx` | ✅ | |
| `components/ui/Input.tsx` | ✅ | |
| `components/ui/Badge.tsx` | ✅ | |
| `components/marketplace/ProductCard.tsx` | ⚠️ | Wrong field names |
| `components/marketplace/CompanyCard.tsx` | ⚠️ | Wrong field names |
| `components/marketplace/CategoryGrid.tsx` | ✅ | |
| `app/_layout.tsx` | ✅ | |
| `app/index.tsx` | ✅ | |
| `app/(tabs)/_layout.tsx` | ⚠️ | Uses `<span>` (web only) |
| `app/(tabs)/index.tsx` | ⚠️ | Schema mismatch |
| `app/(tabs)/search.tsx` | 📋 | Placeholder only |
| `app/(tabs)/messages.tsx` | 📋 | Placeholder only |
| `app/(tabs)/orders.tsx` | 📋 | Placeholder only |
| `app/(tabs)/profile.tsx` | ⚠️ | Uses wrong fields |
| `app/(auth)/login.tsx` | ⚠️ | Needs polish |
| `app/(auth)/signup.tsx` | ⚠️ | Needs polish |
| `app/(auth)/forgot-password.tsx` | ⚠️ | Needs polish |
| `app/product/[id].tsx` | 📋 | Stub only |

---

*Update this file as items are completed.*
