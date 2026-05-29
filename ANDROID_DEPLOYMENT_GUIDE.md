# Android Deployment Guide - Precision Project Flow

## Current Status ✅
- Release keystore created: `ppf-release.keystore`
- Keystore password: `ppfmobile2026`
- Key alias: `ppf-key-alias`
- Building release APK now...

## Option 1: Quick Testing (For Your Coworker)

### Once APK Build Completes:

1. **Find the APK**:
   ```bash
   ls -lh PPFMobile/android/app/build/outputs/apk/release/
   # You'll see: app-release.apk
   ```

2. **Share with coworker**:
   - Email the APK
   - Upload to Google Drive/Dropbox
   - Use AirDrop (if nearby)

3. **Your coworker installs**:
   - Download APK to Android phone
   - Go to Settings → Security → Enable "Install unknown apps"
   - Tap the APK file to install
   - May need to enable "Install from this source" for their browser/file manager

**Pros**: Instant, no accounts needed
**Cons**: Manual distribution, need to enable "unknown sources"

---

## Option 2: Google Play Console - Internal Testing (Recommended)

### Setup (One-time, $25):

1. **Create Google Play Developer Account**:
   - Go to: https://play.google.com/console/signup
   - Pay $25 one-time fee
   - Complete registration

2. **Create App in Console**:
   - Click "Create app"
   - Name: "Precision Project Flow"
   - Default language: English (US)
   - App type: App
   - Free or Paid: Free

3. **Build AAB (Android App Bundle)**:
   ```bash
   cd PPFMobile/android
   ./gradlew bundleRelease
   ```
   - Output: `app/build/outputs/bundle/release/app-release.aab`

4. **Upload to Internal Testing**:
   - In Play Console → Testing → Internal testing
   - Create new release
   - Upload `app-release.aab`
   - Add release notes: "Initial TestFlight beta"
   - Review and roll out

5. **Add Testers**:
   - Create tester list with email addresses
   - Share testing link with your coworker
   - They install from Play Store (shows as "internal test")

**Pros**: 
- Professional distribution
- Automatic updates
- No "unknown sources" needed
- Crash reporting included

**Cons**: 
- $25 one-time fee
- Takes 1-2 hours for first review
- Requires Google account

---

## Option 3: Production Release to Google Play Store

### Prerequisites:
- Completed Option 2 setup
- App content rating questionnaire
- Privacy policy URL
- App screenshots (phone + tablet)
- Feature graphic (1024 x 500px)
- App icon (512 x 512px)

### Steps:

1. **Complete Store Listing**:
   - App name: "Precision Project Flow"
   - Short description (80 chars): Construction project management made simple
   - Full description (4000 chars): [Write compelling description]
   - Screenshots: Take from iOS + Android
   - Category: Business → Project Management

2. **Content Rating**:
   - Complete questionnaire
   - Likely rating: ESRB Everyone, PEGI 3

3. **Set up Pricing**:
   - Free app
   - Select countries: All or specific regions

4. **Create Production Release**:
   - Upload same AAB as internal testing
   - Set rollout percentage (start with 20%, then 50%, then 100%)
   - Submit for review

5. **Review Timeline**:
   - First submission: 3-7 days
   - Updates: 1-3 days
   - Can take longer if flagged for additional review

---

## Quick Commands Reference

### Build APK (for testing):
```bash
cd PPFMobile/android
./gradlew assembleRelease
# Output: app/build/outputs/apk/release/app-release.apk
```

### Build AAB (for Play Store):
```bash
cd PPFMobile/android
./gradlew bundleRelease
# Output: app/build/outputs/bundle/release/app-release.aab
```

### Check APK size:
```bash
ls -lh PPFMobile/android/app/build/outputs/apk/release/app-release.apk
```

### Install APK on connected Android device:
```bash
adb install PPFMobile/android/app/build/outputs/apk/release/app-release.apk
```

---

## Troubleshooting

### "App not installed" error:
- Uninstall any existing version first
- Enable "Install unknown apps" for your installer

### Build errors:
- Clean build: `./gradlew clean`
- Delete build folder: `rm -rf android/app/build`
- Re-run build

### Keystore issues:
- Keystore location: `PPFMobile/android/app/ppf-release.keystore`
- **NEVER commit this file to git!**
- Backup securely - if lost, you can't update the app

---

## Environment Variables

Your Android build uses `.env.production` automatically (configured in build.gradle).

Current setup:
- Supabase: Production keys
- Stripe: Test keys (switch to live keys before production)

---

## Next Steps

1. ✅ APK building now (wait for completion)
2. 📱 Send APK to coworker for immediate testing
3. 💳 Decide: Pay $25 for Play Console? (Recommended for ongoing testing)
4. 🚀 If yes: Set up Google Play Internal Testing
5. 📝 Before production: Complete store listing, screenshots, privacy policy
6. 🎯 Production release: After thorough testing

---

## Important Notes

### Security:
- **ppf-release.keystore**: Store securely, never share publicly
- Passwords are in `gradle.properties` - add to `.gitignore`
- For production, consider using Play App Signing (Google manages keys)

### Updates:
- Android: Increment `versionCode` in `build.gradle` for each release
- Current: versionCode 1, versionName "1.0"

### Testing URLs:
- APK direct install: For developers/testers
- Internal Testing track: Like TestFlight, for team
- Closed Testing: For beta users (up to 100)
- Open Testing: Public beta
- Production: Everyone

---

## Contact Info

If build fails or you need help:
1. Check `android/build_log.txt` for errors
2. Run: `./gradlew assembleRelease --stacktrace` for detailed errors
3. Common issues: Java version, SDK path, keystore password
