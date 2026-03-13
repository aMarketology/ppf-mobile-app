# PPF Mobile App — MANIFESTO
## The Source of Truth for How We Build This App

> Last Updated: February 26, 2026
> Status: Active Development — Phase 1 (MVP)

---

## 🎯 What We Are Building

**Precision Project Flow Mobile** is a native iOS-first B2B engineering marketplace app that allows:

- **Clients** → Browse engineering services, request quotes, place orders, message vendors, track projects
- **Engineers/Vendors** → List services, manage orders, communicate with clients, receive payments

The mobile app is a companion to the existing web platform. It shares the **same Supabase database**, the **same auth system**, and the **same business logic**. It is NOT a separate product — it is the same platform on a different surface.

---

## 🧱 Non-Negotiable Principles

### 1. Real Data. No Mocks.
We connect to the live Supabase database from day one. No mock APIs, no hardcoded data, no fake users. Every screen that can show real data, does.

### 2. Type Safety Everywhere
Every Supabase table has a corresponding TypeScript interface in `types/models.ts`. Every function has typed parameters and return values. We never use `any` unless absolutely forced.

### 3. Design System Compliance
Every screen, component, and interaction follows `ppf-design.md` exactly:
- Colors from `constants/Colors.ts` only — no hardcoded hex values
- Spacing from `constants/Theme.ts` only — no magic numbers
- Typography from `constants/Theme.ts` only
- Minimum touch targets: 44x44px
- Card shadows: exactly `0 2 8 rgba(0,0,0,0.1)`
- Border radius: 12px for cards, 8px for inputs

### 4. Match the Actual Database Schema
Our `types/models.ts` must always mirror the real Supabase table schemas in `/tables/*.sql` exactly.
- `profiles` uses `is_verified` NOT `verified` (company_profiles uses `is_verified`)
- `products` uses `name` NOT `title`, `is_active` NOT `active`, `delivery_time_days` NOT `delivery_days`
- `product_orders` has `product_name`, `product_price`, `platform_fee`, `total_amount`
- No assumptions — always check `/tables/*.sql` before writing a query

### 5. Auth Is the Gate
Every screen behind the tab navigator requires an authenticated session. The root `app/index.tsx` redirects unauthenticated users to `/(auth)/login`. Period.

### 6. Error States Are Features
Every API call must handle:
- Loading state (skeleton or spinner)
- Error state (message + retry button)
- Empty state (icon + message + CTA)

### 7. iOS First, Then Android
Build, test, and polish for iOS. Android support follows. All platform-specific code must be wrapped in `Platform.OS` checks.

---

## 🏗️ Tech Stack (Locked)

| Layer | Technology | Notes |
|---|---|---|
| Framework | React Native via Expo SDK 55 | Managed workflow |
| Router | Expo Router v4 | File-based routing |
| Language | TypeScript | Strict mode |
| Backend | Supabase | Shared with web app |
| Auth | Supabase Auth | Email/password + biometrics |
| Payments | Stripe React Native | Connect marketplace |
| State | React Context API | Auth + Cart |
| Storage | AsyncStorage | Session persistence |
| Secure Store | expo-secure-store | Sensitive tokens |
| Notifications | expo-notifications | Push via Expo |

---

## 🗄️ Database: The Ground Truth

**Supabase Project:** `vqmadoejowuyvdrisnyd.supabase.co`

### Tables (in order of dependency)

1. **`profiles`** — All users (clients + engineers). Auto-created on signup via trigger. Fields: `id, email, full_name, user_type, bio, location, created_at`

2. **`company_profiles`** — Vendor companies. Fields: `id, owner_id, company_name, description, email, phone, website, address, city, state, zip_code, specialties, certifications, is_verified, is_claimed, created_at`

3. **`products`** — Services listed by companies. Fields: `id, company_id, name, description, price (cents), category, delivery_time_days, is_active, requires_consultation, created_at`

4. **`product_orders`** — Purchase transactions. Fields: `id, order_number, product_id, company_id, buyer_id, product_name, product_price, platform_fee, total_amount, status, stripe_payment_intent_id, created_at, completed_at`

5. **`stripe_connect_accounts`** — Vendor Stripe accounts

6. **`conversations`** — Message threads. Fields: `id, subject, product_id, order_id, company_id, status, last_message_at, created_at`

7. **`conversation_participants`** — Who is in each conversation

8. **`messages`** — Individual messages. Fields: `id, conversation_id, sender_id, content, attachments, edited_at, is_system_message, created_at`

---

## 📂 Folder Structure (Canonical)

```
ppf-mobile/
├── app/                        # Screens (Expo Router)
│   ├── _layout.tsx            # Root: AuthProvider + CartProvider + StripeProvider
│   ├── index.tsx              # Gate: redirect to (auth) or (tabs)
│   ├── (auth)/                # Unauthenticated screens
│   │   ├── _layout.tsx        # Stack, no header
│   │   ├── login.tsx          # Login screen
│   │   ├── signup.tsx         # Signup screen (type selection)
│   │   └── forgot-password.tsx
│   ├── (tabs)/                # Authenticated tab screens
│   │   ├── _layout.tsx        # Tab navigator
│   │   ├── index.tsx          # Home / Marketplace
│   │   ├── search.tsx         # Search + Filters
│   │   ├── messages.tsx       # Conversations list
│   │   ├── orders.tsx         # Orders / Sales
│   │   └── profile.tsx        # Profile + Settings
│   ├── product/[id].tsx       # Product detail
│   ├── company/[id].tsx       # Company profile
│   ├── checkout/[id].tsx      # Checkout flow
│   ├── conversation/[id].tsx  # Message thread
│   └── (modals)/
│       ├── filters.tsx
│       └── notifications.tsx
│
├── components/
│   ├── ui/                    # Atomic components
│   │   ├── Button.tsx         ✅ Done
│   │   ├── Card.tsx           ✅ Done
│   │   ├── Input.tsx          ✅ Done
│   │   ├── Badge.tsx          ✅ Done
│   │   └── ScreenHeader.tsx   🚧 Needed
│   ├── marketplace/
│   │   ├── ProductCard.tsx    ✅ Done
│   │   ├── CompanyCard.tsx    ✅ Done
│   │   └── CategoryGrid.tsx   ✅ Done
│   ├── messaging/
│   │   ├── ConversationItem.tsx  🚧 Needed
│   │   ├── MessageBubble.tsx     🚧 Needed
│   │   └── ChatInput.tsx         🚧 Needed
│   └── orders/
│       ├── OrderCard.tsx         🚧 Needed
│       └── StatusBadge.tsx       🚧 Needed
│
├── lib/
│   ├── supabase.ts            ✅ Done (needs env fix)
│   ├── auth.ts                ✅ Done
│   ├── api.ts                 ⚠️  Needs schema alignment
│   └── notifications.ts       ✅ Done
│
├── hooks/
│   ├── useProducts.ts         ⚠️  Needs schema alignment
│   ├── useOrders.ts           ⚠️  Needs schema alignment
│   └── useMessages.ts         ✅ Done
│
├── contexts/
│   ├── AuthContext.tsx         ✅ Done
│   └── CartContext.tsx         ✅ Done
│
├── types/
│   ├── models.ts              ⚠️  Needs schema alignment
│   └── navigation.ts          ✅ Done
│
└── constants/
    ├── Colors.ts              ✅ Done
    ├── Theme.ts               ✅ Done
    ├── Categories.ts          ✅ Done
    └── Config.ts              ✅ Done
```

---

## 🔐 Authentication Flow (The Law)

```
App Launches
     │
     ▼
app/index.tsx
     │
     ├── loading? → Splash/spinner
     │
     ├── no session? → /(auth)/login
     │                      │
     │                      ├── /login     (email + password)
     │                      ├── /signup    (name + email + password + type)
     │                      └── /forgot-password (email)
     │
     └── has session? → /(tabs)
                             │
                             ├── / (Home)
                             ├── /search
                             ├── /messages
                             ├── /orders
                             └── /profile
```

**On signup:** Supabase trigger auto-creates `profiles` row.
**Session:** Persisted in AsyncStorage. Auto-refreshed by Supabase client.
**On logout:** Clear session → redirect to `/(auth)/login`.

---

## 💰 Pricing & Fees

- All prices stored in **cents** (integer). `$15,000 = 1500000`
- Platform fee: **5%** (`platform_fee = total_amount * 0.05`)
- Display: Always divide by 100, use `toLocaleString()`

---

## 🎨 Design Rules (Hard Rules)

1. **Primary button** — `backgroundColor: Colors.primary[600]`, height 48px, `borderRadius: 12`
2. **Screen padding** — always `Layout.screenPadding` (16px)
3. **Section headers** — `Typography.h3`, `Colors.text.primary`
4. **Secondary text** — `Colors.text.secondary` (#6b7280)
5. **Cards** — white background, `borderRadius: 12`, `border: 1px Colors.border.light`, shadow
6. **Inputs** — `borderRadius: 8`, `borderColor: Colors.border.medium`, focus → `Colors.primary[600]`
7. **Empty states** — large emoji (64px), bold title, secondary text, CTA button
8. **Loading** — skeleton shimmer for lists, `ActivityIndicator` (primary color) for actions

---

## 🚫 What We Do NOT Do

- ❌ No `any` types
- ❌ No hardcoded colors, spacing, or font sizes
- ❌ No `console.error` swallowing errors silently
- ❌ No screen without a loading and error state
- ❌ No direct Supabase calls in components — always go through `lib/api.ts` or hooks
- ❌ No `NEXT_PUBLIC_` env vars — Expo uses `EXPO_PUBLIC_`
- ❌ No skipping RLS — all queries run as the authenticated user

---

## 📋 Coding Standards

### File Naming
- Screens: `lowercase-kebab.tsx` (Expo Router requirement)
- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utilities: `camelCase.ts`

### Component Pattern
```tsx
// 1. Imports
// 2. Types/Interfaces
// 3. Component function (named export)
// 4. Styles (StyleSheet.create at bottom)
```

### API Pattern
```ts
// All Supabase calls in lib/api.ts
// Returns typed data or throws Error
// Components consume via hooks
```

---

## 🏆 Definition of Done (per feature)

A feature is DONE when:
- [ ] It works on a real iOS device via Expo Go
- [ ] Loading state is implemented
- [ ] Error state is implemented
- [ ] Empty state is implemented (if it's a list)
- [ ] Types match the actual database schema
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Follows the design system exactly

---

*This document is the source of truth. When in doubt, refer here first.*
