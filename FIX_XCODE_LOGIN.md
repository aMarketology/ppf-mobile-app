# 🔐 Fix: Xcode Apple Account Login Required

## Problem
The build is failing with:
```
error: Unable to log in with account 'max@amarketology.com'.
The login details for account 'max@amarketology.com' were rejected.
```

## Solution: Sign in to Xcode with your Apple Developer account

### Option 1: Sign in via Xcode GUI (Recommended)

1. Open Xcode
2. Go to **Xcode → Settings** (or **Preferences** on older versions)
3. Click **Accounts** tab
4. Look for `max@amarketology.com` account
   - If it exists with ⚠️ warning: Click it → Click **Download Manual Profiles** or **Sign In Again**
   - If it doesn't exist: Click **+** → **Add Apple ID** → Sign in with your credentials
5. After signing in successfully, you should see:
   - ✅ Your Apple ID
   - Team: `Iron Oak Texas LLC (XG25GS9VQQ)`
   - Role: Agent or Admin

6. Click **Manage Certificates** → Ensure you have a valid **Apple Development** certificate

7. Close Settings and retry the build

### Option 2: Sign in via Command Line

```bash
# Remove existing account and re-add
xcrun simctl delete unavailable
security delete-generic-password -s "Xcode" -a "max@amarketology.com" 2>/dev/null || true

# Then open Xcode and sign in via GUI (Xcode → Settings → Accounts)
open -a Xcode
```

### Option 3: Use App-Specific Password (if 2FA is enabled)

If your Apple ID has two-factor authentication:

1. Go to https://appleid.apple.com
2. Sign in with `max@amarketology.com`
3. **Security** section → **App-Specific Passwords**
4. Click **Generate Password**
5. Label it: "Xcode Build Upload"
6. Copy the generated password (e.g., `abcd-efgh-ijkl-mnop`)
7. In Xcode Settings → Accounts → Sign in using the app-specific password instead of your regular password

---

## After Fixing

Once you're signed in successfully, re-run the build:

```bash
cd /Users/thelegendofzjui/Documents/GitHub/ppf-mobile-app/PPFMobile
ENVFILE=.env.production ../scripts/build-ios-release.sh
```

---

## Verify Account is Working

```bash
# Check if Xcode can see your account
xcrun xcodebuild -showBuildSettings \
  -workspace ios/PPFMobile.xcworkspace \
  -scheme PPFMobile \
  -configuration Release \
  | grep -E "DEVELOPMENT_TEAM|CODE_SIGN"
```

Expected output:
```
DEVELOPMENT_TEAM = XG25GS9VQQ
CODE_SIGN_IDENTITY = Apple Development
CODE_SIGN_STYLE = Automatic
```

---

## Alternative: Manual Signing (Not Recommended)

If automatic signing continues to fail, you can switch to manual signing, but this requires downloading provisioning profiles manually from Apple Developer Portal.

**Stick with automatic signing for now** — it's much easier once the account login is fixed.
