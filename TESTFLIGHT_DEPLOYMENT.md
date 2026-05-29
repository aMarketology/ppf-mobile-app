# 🚀 TestFlight Deployment — Quick Start Guide

**App:** Precision Project Flow  
**Status:** ✅ Ready for TestFlight (App Store metadata needed for production)  
**Time to TestFlight:** ~20 minutes (build + upload)  
**Time to Production:** 2-3 weeks (after beta testing + App Store review)

---

## ✅ Pre-Flight Check — Run This First

```bash
cd /Users/thelegendofzjui/Documents/GitHub/ppf-mobile-app
./scripts/validate-submission.sh
```

**Expected result:**
- ✓ Passed: 12
- ⚠ Warnings: 7 (App Store metadata — can fix after TestFlight)
- ✗ Failed: 0

---

## 🚀 Deploy to TestFlight (Internal Beta)

### Step 1: Build & Upload (~20 min)

```bash
cd /Users/thelegendofzjui/Documents/GitHub/ppf-mobile-app/PPFMobile
ENVFILE=.env.production ../scripts/build-ios-release.sh
```

**What this does:**
1. Archives Release build with production keys
2. Exports signed .ipa
3. Uploads to App Store Connect via `altool`
4. Build appears in TestFlight after ~30-60 min processing

**Expected output:**
```
*** CREATING ARCHIVE ***
▸ Archive Succeeded
*** EXPORTING IPA ***
▸ Exported PPFMobile.ipa
*** UPLOADING TO APP STORE CONNECT ***
No errors uploading 'PPFMobile.ipa'
✅ Build uploaded successfully!
```

### Step 2: Distribute to Internal Testers (App Store Connect)

1. Go to [App Store Connect](https://appstoreconnect.apple.com) → My Apps → Precision Project Flow
2. Click **TestFlight** tab
3. Wait for build to finish processing (~30-60 min)
4. Select build → **Groups** → Add internal testers (up to 100, no Apple review needed)
5. Testers receive TestFlight email → Download app from TestFlight app

**Internal testing:** Available immediately (no Apple review)

---

## 📸 BEFORE PRODUCTION: Complete App Store Metadata

### 1. Take Screenshots (~30 min)

Use iPhone 16 Pro Max (6.7") simulator:

```bash
# Start app in simulator
cd PPFMobile
npx react-native run-ios --simulator='iPhone 16 Pro Max'

# In another terminal, run screenshot helper:
../scripts/take-screenshots.sh
```

**Screens to capture:**
1. Home screen (hero section)
2. Marketplace (supplier cards with filters)
3. Marketplace scrolled (verified badges visible)
4. Feed (posts)
5. Messages (conversations)
6. Token balance (shows "Coming Soon" on iOS)
7. Profile

Saved to: `./app-store-screenshots/`

### 2. Upload Screenshots to App Store Connect

1. Go to App Store Connect → Precision Project Flow → **App Store** tab
2. Under **App Store Information** → **Screenshots**
3. Select **6.7" Display** (iPhone 16 Pro Max)
4. Drag/drop screenshots from `./app-store-screenshots/`
5. Reorder so Home screen is first
6. (Optional) Repeat for 5.5" display

### 3. Write App Description

**Copy this template into App Store Connect:**

```
Name: Precision Project Flow
Subtitle: Industrial Marketplace & Engineering Tools

Description:
Precision Project Flow connects engineering professionals with verified industrial suppliers, manufacturers, and service providers.

MARKETPLACE
• Browse 10,000+ verified suppliers across 50+ countries
• Filter by Civil, Mechanical, Electrical, Controls, Manufacturing, Construction, Logistics
• Request quotes and view detailed supplier profiles
• Premium verified badges for quality assurance

PROJECT TOOLS
• Token-based system for unlocking supplier contacts
• Direct messaging with suppliers
• Feed for industry updates and project showcases
• Secure order management

TRUSTED PLATFORM
• 98% customer satisfaction
• 24/7 secure platform
• Verified supplier network
• Streamlined sourcing for engineering projects

Keywords: engineering,industrial,marketplace,suppliers,manufacturing,procurement,B2B,construction,civil,mechanical,electrical

Support URL: https://precisionprojectflow.com/support
Marketing URL: https://precisionprojectflow.com
Privacy Policy: https://precisionprojectflow.com/privacy
```

### 4. Create Demo Account

**Important:** Apple reviewer needs login credentials.

1. Create account: `demo@precisionprojectflow.com` / `Demo2026!`
2. Pre-seed data via Supabase SQL:
   - Add 100 tokens to balance
   - Create 2-3 sample messages
   - Add 1-2 sample orders

3. Add to **App Review Information** in App Store Connect:
   ```
   Username: demo@precisionprojectflow.com
   Password: Demo2026!
   
   Notes:
   - Token purchases are disabled on iOS per Guideline 3.1.1
   - Users can browse suppliers, view profiles, and use platform features
   - Android users can purchase tokens via Stripe (will implement IAP for iOS in v2)
   - Demo account has 100 tokens pre-loaded for testing
   ```

### 5. Set Age Rating

App Store Connect → **Age Rating** questionnaire:
- Unrestricted Web Access: **NO**
- Commerce: **YES** (marketplace features)
- Recommended: **9+** or **12+**

---

## 🎯 Production Release Checklist

Before clicking "Submit for Review":

- [ ] **TestFlight tested by 10+ users**
- [ ] **All critical bugs fixed**
- [ ] **Screenshots uploaded (6.7" + 5.5")**
- [ ] **Description, keywords, URLs complete**
- [ ] **Demo account created and working**
- [ ] **Age rating set**
- [ ] **Review notes explain iOS payment restriction**
- [ ] **Privacy policy live at URL**
- [ ] **Support page live at URL**

**Timeline after submission:**
- 2-5 days: App Store review
- Day 1: Live in App Store (if approved on first try)

---

## 🚨 Common Rejection Reasons (And How We Avoid Them)

### ❌ Guideline 3.1.1 — In-App Purchase
**Issue:** Stripe payments for digital goods on iOS  
**Our fix:** ✅ Buy tokens UI hidden on iOS with `Platform.OS !== 'ios'` guard

### ❌ Guideline 2.1 — App Completeness
**Issue:** "Coming Soon" features blocking core functionality  
**Our mitigation:** ✅ App is fully functional without buying tokens (browse, search, profiles work)

### ❌ Guideline 2.3.1 — Accurate Metadata
**Issue:** Screenshots don't match app  
**Our fix:** ✅ Real screenshots from working simulator (use helper script)

### ❌ Guideline 5.1.1 — Privacy
**Issue:** Missing PrivacyInfo.xcprivacy  
**Our fix:** ✅ `PrivacyInfo.xcprivacy` present with data declarations

### ❌ Guideline 2.3.10 — Hidden Features
**Issue:** Reviewer can't access features  
**Our fix:** ✅ Demo account with pre-seeded data

---

## 🔄 Resubmitting After Changes

If you need to upload a new build:

1. **Increment build number:**
   ```bash
   # In Xcode: Select project → Target → General → Build = 2
   # Or edit project.pbxproj: CURRENT_PROJECT_VERSION = 2;
   ```

2. **Rebuild and upload:**
   ```bash
   cd PPFMobile
   ENVFILE=.env.production ../scripts/build-ios-release.sh
   ```

3. **Select new build in App Store Connect:**
   - TestFlight tab → Select new build
   - OR App Store tab → Build section → Select new build

---

## 📊 Monitoring After Launch

### TestFlight Feedback
- App Store Connect → TestFlight → Feedback
- Monitor crash reports and tester comments

### Production Analytics
- App Store Connect → Analytics → Metrics
- Impressions, downloads, crashes, ratings

### Crash Reporting (Recommended)
Add Sentry to `.env.production`:
```bash
SENTRY_DSN=https://...@sentry.io/...
```

---

## 🎉 Launch Day Checklist

Once approved:

- [ ] **Announce on social media** (LinkedIn, Twitter, website)
- [ ] **Email existing users** with App Store link
- [ ] **Update website** with "Download on App Store" badge
- [ ] **Monitor reviews** and respond to feedback
- [ ] **Track analytics** (downloads, active users, crashes)
- [ ] **Plan v1.1** based on user feedback

---

## 🛟 Support & Resources

- **Validation script:** `./scripts/validate-submission.sh`
- **Screenshot helper:** `./scripts/take-screenshots.sh`
- **Build script:** `./scripts/build-ios-release.sh`
- **Checklist:** `APP_STORE_SUBMISSION_CHECKLIST.md`

**Apple Resources:**
- [App Store Connect](https://appstoreconnect.apple.com)
- [Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [TestFlight Help](https://developer.apple.com/testflight/)

---

## ⚡ Quick Commands Reference

```bash
# Validate before upload
./scripts/validate-submission.sh

# Build and upload to TestFlight
cd PPFMobile && ENVFILE=.env.production ../scripts/build-ios-release.sh

# Take screenshots
./scripts/take-screenshots.sh

# Run app in simulator
cd PPFMobile && npx react-native run-ios --simulator='iPhone 16 Pro Max'

# Check build status
open https://appstoreconnect.apple.com
```

---

**🚀 Ready to deploy?** Start with: `./scripts/validate-submission.sh`
