# Google Play Store Deployment — Step by Step

> **Date:** September 17, 2026
> **Package:** `com.precisionprojectflow.mobile`
> **Version:** 1.0 (build 1)
> **AAB:** `PPFMobile/android/app/build/outputs/bundle/release/app-release.aab` (52MB)

---

## ✅ Artifacts Ready

| Artifact | Location | Status |
|----------|----------|--------|
| Release AAB | `PPFMobile/android/app/build/outputs/bundle/release/app-release.aab` | ✅ Built |
| App Icon (512×512) | `play-store-assets/icon-512.png` | ✅ Generated |
| Feature graphic | ⚠️ Need to create (1024×500) | ❌ |
| Screenshots | ⚠️ Need to capture | ❌ |

---

## 📤 Step 1: Deploy to Internal Testing (Boss First)

1. Go to **[play.google.com/console](https://play.google.com/console)**
2. Select your app
3. Left menu → **"Testing" → "Internal testing"**
4. Click **"Create new release"**
5. Upload `app-release.aab`
6. Release notes:
   ```
   v1.0 — Initial internal test
   - Activity feed with blockchain ledger
   - Shop marketplace with services
   - RFQ marketplace with bidding
   - Direct messaging
   - Token-gated features
   ```
7. Click **"Save"** → **"Review release"** → **"Start rollout to Internal testing"**
8. Under **"Testers"**, create email list + add boss's email
9. Copy **"Opt-in URL"** and send to boss

---

## 📝 Step 2: Complete Store Listing (Required for Production)

### App Details
- **Name:** Precision Project Flow
- **Short description (80 chars):** Industrial sourcing & project management for engineers
- **Full description:** (see below)
- **Category:** Business
- **Content rating:** Complete questionnaire (likely "Everyone")

### Store Listing Assets Needed
- [ ] **App icon** — `play-store-assets/icon-512.png` ✅
- [ ] **Feature graphic** — 1024×500 PNG (need to create)
- [ ] **Screenshots** — phone (min 2), tablet (optional)
- [ ] **Privacy policy URL** — https://precisionprojectflow.com/privacy
- [ ] **Support URL** — https://precisionprojectflow.com/support

---

## 📱 Suggested Full Description

```
Precision Project Flow connects engineering professionals with verified industrial suppliers, manufacturers, and service providers.

MARKETPLACE
• Browse verified suppliers across 50+ countries
• Search by category, service, or location
• View detailed service listings with pricing

RFQ & BIDDING
• Post Requests for Quotes (RFQs) to multiple suppliers
• Receive competitive bids side-by-side
• Award projects directly from the app

ACTIVITY FEED
• Real-time blockchain-verified activity ledger
• See RFQs posted, offers submitted, orders placed
• Cryptographic SHA256 hash chain for immutability

MESSAGING
• Direct messaging between buyers and suppliers
• Token-gated communication (75 tokens for new DMs)
• Real-time chat with typing indicators

TOKENS
• Token-based platform access
• 50 tokens to bid on RFQs
• 100 tokens to unlock conversations
• Secure Stripe payments

Get started free — connect with verified engineering suppliers today.
```

---

## 🚀 Step 3: Promote to Production

Once internal testing passes:
1. Left menu → **"Production"**
2. Click **"Create new release"**
3. Upload the same `app-release.aab`
4. Complete all store listing requirements
5. Click **"Save"** → **"Review release"** → **"Start rollout to Production"**

Review timeline: 3-7 days for first submission.

---

## ⚠️ Before Production — Checklist

- [ ] Switch Stripe test keys → live keys (`.env.production`)
- [ ] Verify all Supabase RLS policies
- [ ] Set up error monitoring (Sentry)
- [ ] Test on multiple devices
- [ ] Confirm privacy policy is live at URL
