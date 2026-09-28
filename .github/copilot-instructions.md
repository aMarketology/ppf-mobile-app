# Copilot Instructions — PPF Mobile App

## NEVER EDIT
Never edit anything inside `/Users/thelegendofzjui/Documents/GitHub/ppf-mobile-app/Precision Project Flow/`. That folder is the web reference only — use it for understanding existing patterns, SQL schemas, RPC functions, and business logic, but never modify it.

## Reference-Only
The `Precision Project Flow/` directory contains the production Next.js web app. You may read files there to:
- Understand how a feature works on the web side
- Copy SQL schema or RPC function signatures
- Reference API route patterns
- Check business logic (token costs, message flows, etc.)

## Mobile App Location
All mobile app code lives in `/Users/thelegendofzjui/Documents/GitHub/ppf-mobile-app/PPFMobile/`. This is the only directory you should create or edit files in.

## Key Architecture
- React Native 0.84 with Fabric (New Architecture)
- Supabase backend via raw fetch REST client (`src/lib/restClient.ts`)
- No supabase-js client (causes iOS simulator hangs)
- Theme in `src/theme.ts` (Deep Blue `#003D82`, Orange `#FF6B35`)
- Token-gated features: 75 tokens for new DMs, 50 tokens for RFQ bids, 100 tokens for unlock
- Tab navigation: Feed → Shop → RFQ → Messages → Profile

## Package Info
- Android package: `com.precisionprojectflow.mobile`
- iOS bundle: `com.maxdeleonardis.precisionprojectflow`
- Supabase project: `ifrxzmemiihxfdimwvcw.supabase.co`
- Test account: `vendor.test@precisionprojectflow.com` / `VendorTest2026!` (500 tokens)

## Current State (Sep 10, 2026)
### ✅ Completed
- Auth (sign in, sign up, forgot password, session persistence)
- Activity feed (blockchain ledger with 3,979 events, filters, search, real-time)
- Shop (services browsing, search, category filters)
- **Service Detail View** (provider card, stats, tags, Request Quote CTA)
- **Request Quote → auto-DM** (75-token deduction via `spend_tokens` RPC)
- **Post New Service** (form with company ownership check)
- RFQ marketplace (browse, 4-step create wizard, 50-token bidding)
- Real-time messaging (typing indicators, unread badges, token-gated unlock)
- Profile (user info, token balance, company profile)
- Settings (profile editing, password change)
- Android AAB built (52MB) for Play Store
- Google Play Developer account created

### 🔜 Next Up
1. Orders Flow (accept offer → create order → Stripe payment)
2. Community Feed (social posts, comments, likes, bids)
3. Notifications (preferences, push registration)
4. Reviews & Ratings (star ratings on service detail)
5. iOS TestFlight deployment