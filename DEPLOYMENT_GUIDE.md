# Precision Project Flow - Deployment Guide

## ✅ Completed: iOS Setup

### iOS Configuration
- **Bundle ID**: `com.maxdeleonardis.precisionprojectflow`
- **Team ID**: VT82GSPGZ4 (Max Deleonardis - Personal)
- **App Store Connect**: "Precision Project Flow2"
- **Archive Status**: ✅ Built successfully with iPad icons

### iOS Next Steps
1. Open Xcode → Window → Organizer
2. Select the PPFMobile archive
3. Click "Distribute App" → "App Store Connect" → "Upload"
4. Wait 30-60 minutes for Apple processing
5. Go to https://appstoreconnect.apple.com
6. Add yourself as internal tester in TestFlight
7. Distribute to testers

---

## 🚀 In Progress: Android Setup

### Android Configuration  
- **Package Name**: `com.ppfmobile`
- **Keystore**: `/PPFMobile/android/app/ppf-release.keystore`
- **Keystore Password**: `ppfmobile2026`
- **Key Alias**: `ppf-key-alias`
- **Version**: 1.0 (versionCode 1)

### Current Status
**Building release APK** - compiling native code (takes 5-10 minutes)

### Once APK Build Completes

#### Option 1: Quick Testing (For Your Coworker)
**Location**: `PPFMobile/android/app/build/outputs/apk/release/app-release.apk`

**How to Share**:
1. Email/AirDrop the APK file directly to your coworker
2. On Android device: Enable "Install from Unknown Sources" in Settings
3. Open the APK file and install
4. ✅ **Instant testing - no accounts needed!**

#### Option 2: Firebase App Distribution (Recommended)
**Best for**: Team testing, like TestFlight for Android

**Setup** (5 minutes):
1. Go to https://console.firebase.google.com
2. Create project "Precision Project Flow"
3. Add Android app with package name `com.ppfmobile`
4. Download `google-services.json` → place in `android/app/`
5. Install Firebase CLI: `npm install -g firebase-tools`
6. Upload: `firebase appdistribution:distribute app-release.apk --app [YOUR_APP_ID] --groups "testers"`
7. Testers get email with download link

**Cost**: Free for up to 100 testers

#### Option 3: Google Play Internal Testing
**Best for**: Professional beta testing before public release

**Setup**:
1. Pay $25 one-time for Google Play Developer account
2. Create app in Play Console
3. Upload AAB (not APK): `./gradlew bundleRelease`
4. Add testers by email
5. They download from Play Store (looks professional!)

**Requirements**:
- Google Play Developer account ($25)
- App must meet Play Store policies
- Takes 1-2 hours for first review

---

## Production Release Checklist

### iOS App Store
- [ ] Complete App Store Connect metadata
  - [ ] App name, subtitle, description
  - [ ] Screenshots (iPhone 6.9", 6.7", 5.5")
  - [ ] App icon 1024x1024
  - [ ] Privacy policy URL
  - [ ] Support URL
  - [ ] Demo account (if needed)
- [ ] Submit for review
- [ ] Wait 24-48 hours for approval

### Android Play Store  
- [ ] Pay $25 for Google Play Developer account
- [ ] Build AAB: `cd android && ./gradlew bundleRelease`
- [ ] Complete Play Console listing
  - [ ] Screenshots (phone, 7" tablet, 10" tablet)
  - [ ] Feature graphic (1024x500)
  - [ ] App icon 512x512
  - [ ] Privacy policy
  - [ ] Content rating questionnaire
- [ ] Submit for review
- [ ] Wait 1-3 days for approval

---

## Environment Variables

### Production (Both iOS & Android)
Already configured in `.env.production`:
```
SUPABASE_URL=https://ifrxzmemiihxfdimwvcw.supabase.co
SUPABASE_ANON_KEY=[your-key]
STRIPE_PK=pk_test_[your-key]
```

**Note**: You're using Stripe TEST key - acceptable for v1 launch, but remember to switch to live key when ready for real payments.

---

## Key Files Reference

### iOS
- Archive: `~/Library/Developer/Xcode/Archives/2026-05-27/PPFMobile.xcarchive`
- Project: `PPFMobile/ios/PPFMobile.xcworkspace`
- Bundle ID config: `PPFMobile/ios/PPFMobile.xcodeproj/project.pbxproj`

### Android
- APK (once built): `PPFMobile/android/app/build/outputs/apk/release/app-release.apk`
- AAB (for Play Store): `PPFMobile/android/app/build/outputs/bundle/release/app-release.aab`
- Keystore: `PPFMobile/android/app/ppf-release.keystore` ⚠️ **KEEP SECURE! Cannot recreate!**
- Config: `PPFMobile/android/app/build.gradle`

---

## Troubleshooting

### iOS Upload Fails
- Verify you're signed into Xcode with max@amarketology.com
- Check bundle ID matches App Store Connect: `com.maxdeleonardis.precisionprojectflow`
- Ensure device is registered in Apple Developer Portal

### Android Build Fails
- Check Java is in PATH: `java -version` (should show 17.x)
- Verify Android SDK: `echo $ANDROID_HOME` 
- Clean build: `cd android && ./gradlew clean`

### Coworker Can't Install APK
- Enable "Unknown Sources" on Android device
- Check APK isn't corrupted during transfer
- Try Firebase App Distribution instead

---

## Quick Commands

### iOS
```bash
# Archive
cd PPFMobile/ios
xcodebuild archive -workspace PPFMobile.xcworkspace -scheme PPFMobile -configuration Release -archivePath ../build/PPFMobile.xcarchive -allowProvisioningUpdates

# Then use Xcode Organizer to upload
```

### Android
```bash
# Build APK (for direct sharing)
cd PPFMobile/android
./gradlew assembleRelease

# Build AAB (for Play Store)
./gradlew bundleRelease

# Output locations:
# APK: app/build/outputs/apk/release/app-release.apk
# AAB: app/build/outputs/bundle/release/app-release.aab
```

---

## Security Reminders

1. ⚠️ **Never commit** `ppf-release.keystore` or `gradle.properties` to git!
2. ⚠️ **Backup keystore** securely - you cannot recreate it!
3. 🔐 Store passwords in password manager
4. 🔐 Switch to Stripe live keys before accepting real payments

---

**Questions?** Check the build logs or reach out for help!
