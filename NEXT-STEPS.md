# PPF Mobile App — NEXT STEPS
## Implementation Tracker

> **Last Updated:** September 10, 2026
> **Current Phase:** Marketplace Launch — Service Detail + DM Flow Complete
> **Device:** Samsung SM-A156U (Android 15) connected via ADB
> **Package:** `com.precisionprojectflow.mobile` (changed from `com.ppfmobile`)

---

## ✅ COMPLETED FEATURES

### Auth & Onboarding
- [x] Auth screen with Sign In / Sign Up toggle
- [x] Password visibility toggle (eye icon)
- [x] Keyboard-avoiding scroll view on auth
- [x] Forgot password flow
- [x] Session persistence across restarts
- [x] Sign Out with confirmation dialog

### Navigation & Tab Bar
- [x] 5-tab layout: Feed, Shop, RFQ, Messages, Profile
- [x] Lucide icons with Deep Blue active state
- [x] Tab bar badge for unread messages

### Activity Feed (Blockchain Ledger)
- [x] Deep Blue gradient hero matching web design
- [x] Filter pills (All, RFQs Posted, Offers, Awarded, Orders, etc.)
- [x] Expandable search bar
- [x] Activity cards with colored icon pills, actor name, timeAgo
- [x] SHA256 hash preview + chain link footer
- [x] Real-time subscription for live updates
- [x] Load more pagination
- [x] 3,979 total events on the ledger (live data)

### Shop (Marketplace)
- [x] Services browsing with live data from Supabase (3 live services)
- [x] Search with category filter pills
- [x] Price display with provider info
- [x] **Service Detail View** — full detail page with provider card, stats, tags
- [x] **Request Quote → auto-create DM** with 75-token deduction
- [x] **"Post New Service" button** (`+` in hero header)

### RFQ Marketplace
- [x] RFQ browsing with live data (2 open RFQs)
- [x] Status tags (Open, Awarded, etc.)
- [x] Create RFQ wizard (4-step: details → budget → line items → review)
- [x] Submit Offer / Bid with 50-token gating

### Messaging
- [x] Conversations list (inbox)
- [x] Real-time chat with optimistic sends
- [x] Typing indicator broadcast
- [x] Mark messages as read
- [x] Unread counts
- [x] Token-gated unlock modal (100 tokens to unlock DM)
- [x] 75-token deduction for new DMs via `spend_tokens` RPC

### Profile & Settings
- [x] Profile card with avatar initials, name, email, account type
- [x] Token balance card with "Buy Tokens" link
- [x] Menu items: Company Profile, Orders, Feed, Messages, Notifications
- [x] **Company Profile Screen** — view company details, specialties, certifications
- [x] **Settings Screen** — profile editing (name, bio, location), password change
- [x] Sign Out with confirmation

### Tokens
- [x] Token balance display in header + profile
- [x] Token store with pack options
- [x] Stripe payment integration
- [x] Balance refreshes after purchase
- [x] Token-gated features (75 DM, 50 bid, 100 unlock)

### Android Build & Deployment
- [x] Release keystore: `ppf-release.keystore`
- [x] Package name changed to `com.precisionprojectflow.mobile`
- [x] AAB built (52MB) — ready for Play Store
- [x] APK built (73MB) — ready for direct sharing
- [x] Google Play Developer account created (Account ID: 6012929753643779828)
- [x] AAB uploaded to Internal Testing track

---

## 🔴 NEXT PRIORITIES

### 1. Orders Flow (Accept Offer → Create Order)
- [ ] Build Order Detail screen
- [ ] Accept offer → create order via RPC
- [ ] Stripe payment intent creation
- [ ] Order status tracking (pending → active → completed)
- [ ] View my orders (client) / view sales (vendor)

### 2. Community Feed (Social Posts)
- [ ] Feed posts from `feed_posts` table
- [ ] Like/unlike posts
- [ ] Comment on posts
- [ ] Bid on posts (token gated)
- [ ] Create new post

### 3. Notifications
- [ ] Notification preferences screen
- [ ] Notification list
- [ ] Push notification registration

### 4. Reviews & Ratings
- [ ] Star rating on service detail
- [ ] Review submission
- [ ] Average rating display

---

## 🟡 MEDIUM PRIORITY

### 5. Polish Remaining Screens
- [ ] Bring login screen's clean design language to Messages, Profile, Tokens
- [ ] Consistent card styling across all screens
- [ ] Loading skeletons instead of spinners

### 6. iOS App Store Deployment
- [ ] Archive in Xcode
- [ ] Upload to App Store Connect
- [ ] Set up TestFlight
- [ ] Add internal testers

### 7. Production Readiness
- [ ] Switch Stripe from test → live keys
- [ ] Verify all RLS policies are locked down
- [ ] Set up error monitoring (Sentry)

---

## 🟢 LOWER PRIORITY

### 8. Additional Features
- [ ] Dashboard / Analytics
- [ ] Admin panel
- [ ] Social login (Google, Apple)
- [ ] Onboarding walkthrough for new users
- [ ] Deep linking
- [ ] File attachments in messages
- [ ] Voice/video calls

---

## 📋 Testing Status

### Device: Samsung SM-A156U (Android 15)
- ADB connected: ✅ `RZCY21QP0WT`
- App running: ✅ `com.precisionprojectflow.mobile`
- Activity feed: ✅ 3,979 events, real-time updates
- Service detail: ✅ PLC Programming card opens detail view
- Request Quote CTA: ✅ "Request Quote · 75 tokens" with balance
- Shop tab: ✅ Shows 3 results with categories

### Test Credentials
| Account | Email | Password | Tokens |
|---------|-------|----------|--------|
| Vendor | `vendor.test@precisionprojectflow.com` | `VendorTest2026!` | 500 |

---

## 🔧 Quick Commands

```bash
# Build and install debug APK
cd PPFMobile
npx react-native bundle --platform android --dev false --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res
cd android && ./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk

# Build release AAB (Play Store)
cd android && ENVFILE=.env.production ./gradlew bundleRelease

# Build release APK (direct sharing)
cd android && ENVFILE=.env.production ./gradlew assembleRelease
```
