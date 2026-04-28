# PPF Mobile — Production-Ready Step‑by‑Step Plan
## App Store / Play Store Launch Readiness

> Last updated: April 24, 2026
> Target launch: **iOS App Store + Google Play Store, Q3 2026**
> Owner: Mobile team
> App: `PPFMobile/` (React Native 0.84.1, bare workflow — *not* Expo)

---

## 0. Executive Summary — What's Missing Today

The current `PPFMobile/` build is a **functional alpha**. It boots, authenticates against Supabase, renders 7 tab screens (Home, Marketplace, Orders, Feed, Messages, Profile, Tokens), and has Stripe SDK installed. It is **NOT production-ready**. Critical gaps:

### 🔴 Critical Blockers (cannot ship without these)
| # | Gap | Where | Impact |
|---|---|---|---|
| 1 | **Hardcoded Supabase URL + anon key** in 8+ source files | `src/lib/supabase.ts`, `src/services/*.ts` | Security; breaks staging/prod separation; key rotation impossible |
| 2 | **Hardcoded Stripe publishable test key** in source | `App.tsx` line 18 | Will ship test mode to production users |
| 3 | **No `.env` or `react-native-config`** wired into the bare RN app | n/a | Cannot inject prod vs dev secrets at build time |
| 4 | **No backend Edge Functions** for Stripe (PaymentIntent, Connect onboarding, webhooks) | `supabase/` only has `config.toml` | Checkout cannot complete; no marketplace payouts |
| 5 | **No App Store / Play Store metadata** (icon, splash, bundle ID, signing) | `ios/`, `android/` — placeholder bundle id | Cannot submit |
| 6 | **No crash reporting** (Sentry / Crashlytics) | n/a | Blind to production crashes |
| 7 | **No push notifications** integration | n/a | Required by feature spec; Apple requires real push for messaging apps |
| 8 | **No privacy policy / ToS / data-deletion endpoint** | n/a | Apple §5.1.1 (v) and Google Data Safety form will reject |
| 9 | **No RLS verified** on `tables/*.sql` (file exists `rls_policies.sql` but unconfirmed deployed) | Supabase | Anyone with anon key can read/write all rows |
| 10 | **`NSUserTrackingUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSCameraUsageDescription` missing or empty** | `ios/PPFMobile/Info.plist` | Apple binary rejection |

### 🟡 High-Priority (must fix before public launch)
- No checkout / order-placement screen wired to Stripe PaymentSheet
- No image upload (avatar, products, message attachments) — Supabase Storage buckets not provisioned
- No deep linking / universal links
- No analytics (Mixpanel / Amplitude / Firebase)
- No CI/CD (EAS Build is N/A — bare RN; need Fastlane or GitHub Actions + Xcode Cloud)
- App icon, splash, launch screen still default RN placeholders
- `react-native.config.js` and font linking unverified for release build
- No `Reviews & Ratings` table or screens (feature spec promises it)
- Realtime channels disabled by default — messaging "real-time" is currently polling-only

### 🟢 Nice-to-Have (Phase 2/3)
- Biometric login (Face ID / Touch ID)
- Saved products / wishlist
- RFQ system
- Video consultations
- Offline mode / SQLite cache
- Maps / vendor location search

---

## 1. Required API Keys & Service Accounts — Procurement Checklist

Tick these off in order. Each blocks downstream work.

| # | Service | Account Owner | Plan | Cost (monthly) | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | **Supabase** (prod project) | DevOps | Pro | $25 | ⬜ | Separate project from dev. Need URL + anon + **service_role** key (server-side only) |
| 2 | **Stripe** (live mode + Connect) | Finance | Standard | 2.9% + $0.30 | ⬜ | Activate Connect Standard accounts. Create restricted keys for Edge Functions |
| 3 | **Stripe Webhook Secret** | DevOps | — | — | ⬜ | Endpoint URL = Supabase Edge Function `/stripe-webhook` |
| 4 | **Apple Developer Program** | Legal | Org account | $99/yr | ⬜ | Required for TestFlight + App Store + push certs (APNs) |
| 5 | **Google Play Console** | Legal | Org account | $25 one-time | ⬜ | D-U-N-S number for org listing |
| 6 | **Firebase** (FCM for Android push) | DevOps | Spark (free) | $0 | ⬜ | `google-services.json` for `android/app/` |
| 7 | **APNs Auth Key (.p8)** | DevOps | — | — | ⬜ | Generated in Apple Developer portal |
| 8 | **Sentry** | DevOps | Team | $26 | ⬜ | DSN per-platform (iOS, Android) |
| 9 | **Resend** (transactional email) | Marketing | Pro | $20 | ⬜ | Configured in Supabase Auth → SMTP custom |
| 10 | **Mixpanel** *or* **Amplitude** *or* **PostHog** | Product | Free tier | $0 | ⬜ | Project token + EU/US data residency choice |
| 11 | **App domain** (e.g. `app.precisionprojectflow.com`) | DevOps | — | — | ⬜ | For universal links + AASA file |
| 12 | **Privacy policy + ToS hosting URLs** | Legal | — | — | ⬜ | Required by both stores |
| 13 | **Cloudflare / CDN** (optional) | DevOps | Free | $0 | ⬜ | Asset delivery, AASA hosting |
| 14 | **Mapbox** *or* **Google Maps** (Phase 2) | Product | Free tier | $0 | ⬜ | Defer to Phase 2 |

**Estimated monthly fixed cost at launch: ~$75 + transaction fees.**

### Where each key lives
```
.env.development          → committed example, NOT real keys
.env.production           → NOT committed; injected via CI secrets
ios/PPFMobile/GoogleService-Info.plist → committed (no secret data)
android/app/google-services.json       → committed (no secret data)
ios/PPFMobile/AuthKey_XXXX.p8          → NEVER committed, stored in CI secret
Supabase Edge Function secrets         → set via `supabase secrets set`
```

---

## 2. Architecture Hardening (Refactor Before New Features)

These refactors must happen **first**, because every feature touches them.

### 2.1 Centralize Configuration
**Problem:** Every `src/services/*.ts` file repeats the Supabase URL + anon key as string literals.

**Action:**
1. Install `react-native-config` (works with bare RN; replaces missing Expo `EXPO_PUBLIC_*`).
   ```bash
   cd PPFMobile && npm install react-native-config
   cd ios && pod install
   ```
2. Create three env files:
   - `PPFMobile/.env` (default / dev)
   - `PPFMobile/.env.staging`
   - `PPFMobile/.env.production`
3. Add to `.gitignore`:
   ```
   PPFMobile/.env
   PPFMobile/.env.staging
   PPFMobile/.env.production
   ```
4. Commit `PPFMobile/.env.example` with empty values.
5. Replace **all** hardcoded constants with imports from a single `src/config/env.ts`:
   ```ts
   import Config from 'react-native-config';
   export const ENV = {
     SUPABASE_URL: Config.SUPABASE_URL!,
     SUPABASE_ANON_KEY: Config.SUPABASE_ANON_KEY!,
     STRIPE_PUBLISHABLE_KEY: Config.STRIPE_PUBLISHABLE_KEY!,
     SENTRY_DSN: Config.SENTRY_DSN,
     APP_ENV: Config.APP_ENV ?? 'development',
   };
   ```
6. Delete duplicates from: `services/products.ts`, `services/profiles.ts`, `services/orders.ts`, `services/friends.ts`, `services/feed.ts`, `services/servicesService.ts`, `services/tokens.ts`, `services/companies.ts`, `services/messages.ts`, `lib/supabase.ts`, `App.tsx`.

### 2.2 Single Supabase Client (Kill Raw `fetch` Helpers)
The raw-fetch helpers exist because of an iOS-simulator hang workaround. Validate with the latest `@supabase/supabase-js` (2.99.1) on a physical device — if the hang is gone, **delete every `restGet` / `hdrs` helper** and use `supabase.from(...)` everywhere. This regains: typed responses, RLS-aware errors, automatic auth refresh, retry logic.

### 2.3 Type Safety
Run `supabase gen types typescript --project-id <prod_id> > src/lib/database.types.ts` and pass it to `createClient<Database>(...)`. Replace the hand-written types in `src/lib/types.ts`.

### 2.4 Error Boundaries + Sentry
- Install `@sentry/react-native`.
- Wrap `<App>` in `Sentry.ErrorBoundary`.
- Initialize in `index.js` **before** the app renders.

### 2.5 Logging Hygiene
- Add `babel-plugin-transform-remove-console` only for production builds.
- Never log JWTs, emails, or Stripe IDs in release builds.

---

## 3. Database & Backend Readiness

### 3.1 Verify SQL Migrations Are Deployed
The `tables/` folder contains 12 SQL files. Confirm in Supabase Dashboard that each table exists in **both** dev and prod projects:

- [ ] `profiles`
- [ ] `company_profiles`
- [ ] `products`
- [ ] `product_orders`
- [ ] `conversations` (note: file is misspelled `converstations.sql` — fix)
- [ ] `messages`
- [ ] `credit_tokens`
- [ ] `token_purchase`
- [ ] `stripe_connect_accounts`
- [ ] `stripe_transfers`
- [ ] `refunds`
- [ ] `get_or_create_conversation` (RPC)
- [ ] `rls_policies` applied

### 3.2 Row-Level Security Audit
Run this in Supabase SQL editor and **every table must return `t`**:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```
For every `false` row, write a policy. Without RLS the anon key shipped in the app can read/modify all data.

### 3.3 Required Edge Functions
Create under `supabase/functions/`:

| Function | Purpose | Trigger |
|---|---|---|
| `create-payment-intent` | Server creates Stripe PaymentIntent (with destination charge to Connect acct) | Mobile checkout call |
| `stripe-webhook` | Handles `payment_intent.succeeded`, `account.updated`, `charge.refunded` | Stripe → HTTP |
| `create-connect-account` | Creates Stripe Express/Standard account for vendor; returns onboarding URL | Vendor onboarding |
| `send-push-notification` | Sends Expo/FCM/APNs push when row inserted in `messages` or `product_orders` | DB trigger or mobile call |
| `delete-account` | GDPR/Apple §5.1.1(v) — wipes user data | Mobile profile screen |
| `purchase-tokens` | Validates Stripe payment then increments `credit_tokens.balance` | Mobile token-buy |

### 3.4 Storage Buckets
Provision in Supabase Storage and apply policies:

| Bucket | Visibility | Max size | Allowed MIME |
|---|---|---|---|
| `avatars` | public read, auth write (own folder) | 5 MB | `image/*` |
| `product-images` | public read, vendor write | 10 MB | `image/*` |
| `company-logos` | public read, vendor write | 2 MB | `image/*` |
| `message-attachments` | private, conversation participants only | 25 MB | `image/*`, `application/pdf` |
| `rfq-documents` | private | 50 MB | `image/*`, `application/pdf`, `application/dwg` |

### 3.5 Database Triggers & Functions
- `on_auth_user_created` → insert row into `profiles` with `user_type` from metadata.
- `on_message_insert` → call `send-push-notification` Edge Function.
- `on_order_status_change` → push + email via Resend.

---

## 4. Native iOS Readiness

### 4.1 Bundle Identifier & Signing
- [ ] Set `PRODUCT_BUNDLE_IDENTIFIER = com.precisionprojectflow.mobile` in `project.pbxproj`.
- [ ] Create App ID in Apple Developer portal with capabilities: Push Notifications, Sign in with Apple (if used), Associated Domains.
- [ ] Generate Distribution certificate + App Store provisioning profile.
- [ ] Wire up Xcode Cloud or Fastlane Match for cert management.

### 4.2 `Info.plist` — Add Required Usage Strings
Currently empty `NSLocationWhenInUseUsageDescription`; add:
```xml
<key>NSCameraUsageDescription</key>
<string>PPF uses the camera so you can attach photos to messages and product listings.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>PPF needs access to your photos to attach images to listings and conversations.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>PPF saves receipts and order PDFs to your library on request.</string>
<key>NSFaceIDUsageDescription</key>
<string>Use Face ID to sign in to PPF quickly and securely.</string>
<key>NSUserTrackingUsageDescription</key>
<string>Allow PPF to deliver personalized recommendations and measure ad effectiveness.</string>
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```
Plus: app icon set, launch storyboard branded, splash screen image.

### 4.3 Push Notifications (APNs)
- Add Push Notifications capability in Xcode.
- Add Background Modes → Remote notifications.
- Generate `.p8` AuthKey, upload to Supabase / your push service.
- Integrate `@notifee/react-native` + `@react-native-firebase/messaging` (works for both APNs and FCM).

### 4.4 App Tracking Transparency
If using Mixpanel / Amplitude with IDFA → present ATT prompt via `react-native-tracking-transparency`.

### 4.5 Privacy Manifest (PrivacyInfo.xcprivacy)
File already exists at `ios/PPFMobile/PrivacyInfo.xcprivacy` — audit it lists every reason code for: `NSPrivacyAccessedAPICategoryUserDefaults`, `FileTimestamp`, `SystemBootTime`, `DiskSpace`. Required by Apple since May 2024.

---

## 5. Native Android Readiness

### 5.1 App Manifest
- [ ] `applicationId = "com.precisionprojectflow.mobile"` in `android/app/build.gradle`.
- [ ] `android:targetSdkVersion = 34` (Play Store requirement).
- [ ] Permissions: `INTERNET`, `CAMERA`, `READ_MEDIA_IMAGES`, `POST_NOTIFICATIONS`, `USE_BIOMETRIC`.

### 5.2 Signing
- [ ] Generate upload keystore (NOT `debug.keystore`).
- [ ] Store keystore + passwords in CI secrets.
- [ ] Enable Play App Signing.

### 5.3 FCM Setup
- [ ] Place `google-services.json` in `android/app/`.
- [ ] Apply `com.google.gms.google-services` plugin.

### 5.4 Adaptive Icon + Splash
- [ ] Replace default icon at all densities (mdpi → xxxhdpi).
- [ ] Adaptive icon foreground + background (`mipmap-anydpi-v26/`).
- [ ] Splash via `react-native-bootsplash`.

### 5.5 ProGuard / R8
Keep rules already in `proguard-rules.pro`; add for Stripe, Supabase, Sentry, Reanimated.

---

## 6. Feature Completion Map

Status legend: ✅ done · 🟡 partial · ❌ missing

| Feature | Status | Files | Outstanding work |
|---|---|---|---|
| Auth (login/signup) | 🟡 | `AuthScreen.tsx`, `AuthContext.tsx` | Forgot-password, email verification UX, biometric, error toasts |
| Profile view/edit | 🟡 | `ProfileScreen.tsx`, `services/profiles.ts` | Avatar upload, edit form, delete-account button |
| Marketplace browse | 🟡 | `MarketplaceScreen.tsx`, `services/products.ts` | Filters, sort, pagination, skeleton loaders |
| Product detail | ❌ | n/a | Build screen: gallery, description, "Buy Now", "Message Vendor" |
| Company profile | 🟡 | `services/companies.ts` | Build full screen w/ products list, contact, ratings |
| Search | ❌ | n/a | Debounced search, category pills, empty/loading states |
| Cart | ❌ | n/a | Context provider + screen (engineering services often single-line, can skip → direct PaymentSheet) |
| **Checkout / Stripe** | ❌ | Stripe SDK installed only | PaymentSheet wiring, Edge Function, success screen, receipt |
| Orders list | 🟡 | `OrdersScreen.tsx`, `services/orders.ts` | Status filters, vendor view, reorder action |
| Order detail | ❌ | n/a | Timeline, status updates, refund request, download invoice |
| Messages list | 🟡 | `MessagesScreen.tsx`, `services/messages.ts` | Unread badges, online indicators, sort by last message |
| Conversation | 🟡 | `ConversationScreen.tsx` | Real-time enable, typing indicator, attachments, read receipts |
| Feed (social) | 🟡 | `FeedScreen.tsx`, `services/feed.ts` | Verify against `feed_posts` schema (not in `/tables`?), post creation |
| Friends | 🟡 | `services/friends.ts` | Friend requests UI |
| Tokens (credits) | 🟡 | `TokenScreen.tsx`, `services/tokens.ts` | Wire to Stripe PaymentSheet, success refresh, history paging |
| Push notifications | ❌ | n/a | Permission prompt, token registration, deep-link from notification |
| Reviews & ratings | ❌ | no table | Schema, UI, vendor reply, moderation |
| Saved products | ❌ | no table | Schema (`saved_products`), heart icon, wishlist screen |
| RFQ | ❌ | Phase 3 | Defer |
| Analytics dashboard | ❌ | Phase 3 | Defer |

---

## 7. Milestones & Timeline

Each milestone ends with **a tagged build, a test plan executed, and a TestFlight/Internal Testing distribution**.

### M1 — Foundation Hardening (Week 1–2) 🔴 BLOCKER
**Goal:** Same app, but configurable, observable, and secure.

- [ ] Refactor §2.1 — `react-native-config` everywhere
- [ ] Refactor §2.2 — single supabase client
- [ ] Generate DB types (§2.3)
- [ ] Sentry integrated (§2.4)
- [ ] All RLS verified (§3.2)
- [ ] Two Supabase projects exist: `ppf-dev`, `ppf-prod`
- [ ] CI pipeline (GitHub Actions) lints + type-checks PRs

**Exit test:** Switch `.env` from dev → staging → prod via build flag; auth still works on each. Sentry receives a deliberate test crash.

### M2 — Backend & Payments (Week 3–4) 🔴 BLOCKER
**Goal:** A user can pay for a real product and the vendor gets paid out.

- [ ] Edge Function `create-payment-intent` + Stripe Connect destination charges
- [ ] Edge Function `stripe-webhook` updates `product_orders.status`
- [ ] Edge Function `create-connect-account` + vendor onboarding screen
- [ ] Edge Function `purchase-tokens` for credit packs
- [ ] Storage buckets provisioned + policies (§3.4)
- [ ] Stripe restricted keys committed to Supabase secrets
- [ ] Test mode end-to-end: client checkout → vendor payout in test dashboard

**Exit test:** Use Stripe test card `4242 4242 4242 4242` to complete a $1.00 order from a real device. Webhook fires, order row flips to `confirmed`, vendor's connected account shows a transfer.

### M3 — Core Commerce Screens (Week 5–6)
**Goal:** Feature-complete buyer flow.

- [ ] Product Detail screen
- [ ] Company Detail screen
- [ ] Search screen w/ filters
- [ ] Checkout screen (Stripe PaymentSheet)
- [ ] Order Detail screen w/ timeline
- [ ] Avatar / product image upload to Storage
- [ ] Skeleton loaders + pull-to-refresh on every list

**Exit test:** Full happy-path: browse → search → view product → message vendor → purchase → see order → message about delivery. No console errors.

### M4 — Real-Time & Notifications (Week 7)
**Goal:** Messages arrive instantly; users notified when offline.

- [ ] Supabase Realtime channel in ConversationScreen
- [ ] Push notification setup (APNs + FCM)
- [ ] Permission prompt UX
- [ ] Push tokens stored in `profiles.push_token`
- [ ] DB trigger → Edge Function → push for new messages and order events
- [ ] Deep links from notification → correct screen

**Exit test:** Two devices, two accounts. Send message from A while B is backgrounded. B receives push within 5s; tap → opens conversation.

### M5 — Compliance, Legal, Store Assets (Week 8)
**Goal:** Submittable build.

- [ ] Privacy Policy + ToS published at stable URLs
- [ ] In-app links to both, plus account-deletion screen (Apple §5.1.1(v))
- [ ] All `Info.plist` usage strings finalized
- [ ] Privacy Manifest (`PrivacyInfo.xcprivacy`) audited
- [ ] App icon (1024×1024 + adaptive) + splash screen designed
- [ ] App Store screenshots (6.7", 6.5", 5.5", iPad 12.9")
- [ ] Play Store screenshots + feature graphic
- [ ] App Store description, keywords, support URL
- [ ] Google Data Safety form completed
- [ ] Age rating questionnaire (Apple + IARC)
- [ ] Export compliance (`ITSAppUsesNonExemptEncryption=false`)

**Exit test:** TestFlight build passes Apple's automated review checks; Play Store internal testing track accepts AAB.

### M6 — Closed Beta (Week 9–10)
**Goal:** 25–50 real users (clients + vendors) hammer the app.

- [ ] Distribute via TestFlight (external) + Play Internal Testing
- [ ] Collect feedback via in-app form (Sentry User Feedback)
- [ ] Monitor Sentry — fix all P0/P1 crashes
- [ ] Verify analytics events fire correctly
- [ ] Stress-test Edge Functions (>= 100 concurrent payments)
- [ ] Run `react-native-bundle-visualizer` — keep JS bundle < 4 MB

**Exit test:** Crash-free sessions ≥ 99.5% across 7 days; ≥ 5 real Stripe test transactions complete end-to-end; no P1 bugs open.

### M7 — Production Launch (Week 11)
- [ ] Flip Stripe to live mode keys
- [ ] Switch Supabase to prod project
- [ ] Submit to App Store Review
- [ ] Submit to Play Store Production
- [ ] Status page + on-call rotation set
- [ ] Day-1 monitoring dashboard

**Exit test:** App live on both stores; first organic install reported.

### M8 — Phase 2 Enhancements (post-launch, weeks 12+)
- Reviews & ratings
- Saved products / wishlist
- Biometric login
- Advanced search + Mapbox
- Push notification preferences
- Promo codes / discounts

### M9 — Phase 3 (months 4–6)
- RFQ system
- Project management
- Vendor analytics dashboard
- Video consultations (Agora)
- Offline mode

---

## 8. Testing Strategy

### 8.1 Automated
- **Unit tests** (Jest): every `services/*.ts` function — mock fetch, assert query strings.
- **Component tests** (`@testing-library/react-native`): every screen renders empty, loading, error, populated states.
- **E2E** (Detox): smoke test login → browse → checkout → message.
- **Type-check** in CI: `tsc --noEmit`.
- **Lint** in CI: `eslint .`.

### 8.2 Manual QA Matrix
| Device | OS | Tested |
|---|---|---|
| iPhone SE (3rd gen) | iOS 17 | ⬜ |
| iPhone 15 Pro | iOS 18 | ⬜ |
| iPad (10th gen) | iPadOS 17 | ⬜ |
| Pixel 6 | Android 14 | ⬜ |
| Samsung A14 | Android 13 | ⬜ |

### 8.3 Stripe Test Scenarios
- `4242 4242 4242 4242` — success
- `4000 0000 0000 9995` — decline (insufficient funds)
- `4000 0027 6000 3184` — 3DS authentication required
- `4000 0000 0000 0341` — succeeds then disputed

### 8.4 Edge Cases
- Airplane mode mid-checkout
- Token expiry mid-session
- Stripe webhook retries (idempotency)
- Push notification while app foregrounded
- Profile photo upload at slow 3G

---

## 9. Security & Compliance Checklist

### Apple App Store Review Anti-Pattern Check
- [ ] No links to external purchase flows for digital goods
- [ ] Account deletion in-app (not just email)
- [ ] Login with Apple offered if any third-party login present
- [ ] Sign-up gated by ToS + Privacy acceptance
- [ ] No mention of "beta", "preview", "test" in user-facing copy
- [ ] All placeholders replaced (no Lorem ipsum)

### Google Play Data Safety
- [ ] Declare every data type collected (email, name, photos, payment info, location)
- [ ] Declare every purpose (App functionality, Analytics, Account management, Fraud prevention)
- [ ] Declare encryption in transit (TLS) and at rest (Supabase default)

### GDPR / CCPA
- [ ] Data export endpoint (Supabase Edge Function)
- [ ] Data deletion endpoint (`delete-account`)
- [ ] Cookie / tracking consent (analytics opt-in if EU user)
- [ ] DPA signed with Supabase, Stripe, Sentry, analytics vendor

### Secrets Hygiene
- [ ] Rotate the Supabase anon key currently committed in source (it's been in git history)
- [ ] Rotate the Stripe `pk_test_...` in `App.tsx`
- [ ] Audit git history for leaked `.env` files: `git log -p | grep -i 'sk_\|service_role'`
- [ ] Add `gitleaks` pre-commit hook

---

## 10. CI/CD Pipeline

**Branches:**
- `main` → production builds
- `develop` → staging builds (auto-deploy to TestFlight + Internal Testing)
- feature branches → PR checks only

**GitHub Actions jobs:**
1. **lint-and-test** — runs on every PR (eslint, tsc, jest)
2. **ios-build** — Fastlane `match` + `gym` → upload to TestFlight on `develop` push
3. **android-build** — Gradle bundle → upload to Play Internal Testing on `develop` push
4. **release** — manual trigger; promotes the latest TestFlight build to App Store Review

**Required CI secrets:**
```
APPLE_API_KEY_ID, APPLE_API_ISSUER_ID, APPLE_API_KEY_CONTENT
MATCH_PASSWORD, FASTLANE_PASSWORD
ANDROID_KEYSTORE_BASE64, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON
SENTRY_AUTH_TOKEN
SUPABASE_PROD_URL, SUPABASE_PROD_ANON_KEY
STRIPE_PROD_PUBLISHABLE_KEY
```

---

## 11. Day-1 Operations Runbook

When the app goes live, on-call must have:
- Sentry dashboard bookmarked
- Stripe dashboard (live) bookmarked
- Supabase dashboard (prod) bookmarked
- Status page (e.g. statuspage.io)
- Rollback playbook: previous TestFlight build pinned; Play Store staged rollout at 5% for first 24h
- Customer support inbox monitored (support@precisionprojectflow.com)
- Known-issues page on marketing site

---

## 12. Definition of "Production Ready"

We can ship when **every** box below is true:

- [ ] Zero hardcoded secrets in source
- [ ] Sentry crash-free rate ≥ 99.5% over last 7 days of beta
- [ ] All RLS policies verified
- [ ] Stripe live mode validated with a real $1 transaction (refunded after)
- [ ] Push notifications delivered to both iOS and Android in production env
- [ ] Account deletion flow works end-to-end
- [ ] Privacy Policy, ToS, Support URL all live and linked from app
- [ ] App icon, splash, screenshots final
- [ ] TestFlight beta with ≥ 25 external testers, no P0/P1 open
- [ ] Apple Privacy Manifest + Google Data Safety completed
- [ ] CI auto-deploys to staging on every `develop` push
- [ ] Disaster recovery: Supabase point-in-time recovery enabled (Pro plan)
- [ ] Stripe webhook idempotency tested (replay same event twice → no double charge / double row)

---

## Appendix A — File-by-File Refactor Targets

| File | Action |
|---|---|
| `PPFMobile/src/lib/supabase.ts` | Read keys from `react-native-config`; remove inline strings |
| `PPFMobile/src/services/products.ts` | Delete `restGet`/`hdrs`; use `supabase.from('products')` |
| `PPFMobile/src/services/profiles.ts` | Same as above |
| `PPFMobile/src/services/orders.ts` | Same; verify field names match `product_orders.sql` |
| `PPFMobile/src/services/feed.ts` | Same; create `feed_posts.sql` if missing |
| `PPFMobile/src/services/messages.ts` | Same; enable Realtime subscription |
| `PPFMobile/src/services/tokens.ts` | Same; wire RPC to Edge Function |
| `PPFMobile/src/services/friends.ts` | Same |
| `PPFMobile/src/services/companies.ts` | Same |
| `PPFMobile/src/services/servicesService.ts` | Decide: merge into `products.ts` or keep separate |
| `PPFMobile/App.tsx` | Replace inline `STRIPE_PK`; wrap in Sentry boundary |
| `PPFMobile/index.js` | Initialize Sentry before AppRegistry |
| `PPFMobile/ios/PPFMobile/Info.plist` | Add usage strings; finalize fonts |
| `PPFMobile/android/app/build.gradle` | Set `applicationId`, signing config, FCM |
| `PPFMobile/app.json` | Set `displayName: "Precision Project Flow"` |
| `tables/converstations.sql` | Rename to `conversations.sql` |
| `tables/rls_policies.sql` | Audit completeness for every table |
| `supabase/functions/` | Create 6 functions per §3.3 |

---

## Appendix B — Quick Triage of "Is It Worth Shipping Now?"

**No.** Shipping today would result in:
1. **Apple rejection** — missing Info.plist usage strings, no account deletion, hardcoded test Stripe key.
2. **Security incident waiting to happen** — Supabase anon key is in source AND likely no RLS on every table.
3. **No revenue path** — Stripe SDK is present but no PaymentIntent server endpoint exists.
4. **Blind operations** — no Sentry, no analytics, no logs.

Realistic earliest production launch = **8–11 weeks** of focused work following milestones M1 → M7 above. The code that exists is a solid head-start (~30% of total effort done); the missing 70% is mostly backend integration, native config, and compliance.

---

*Update this file as milestones are completed. PRs should reference the milestone (`M2`) and the checkbox they close.*
