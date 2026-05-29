#!/bin/bash
# Pre-Submission Validator
# Checks all requirements before TestFlight upload

set -e

echo "🔍 App Store Pre-Submission Validator"
echo "======================================"
echo ""

PASS=0
WARN=0
FAIL=0

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

check_pass() {
  echo -e "${GREEN}✓${NC} $1"
  PASS=$((PASS + 1))
}

check_warn() {
  echo -e "${YELLOW}⚠${NC} $1"
  WARN=$((WARN + 1))
}

check_fail() {
  echo -e "${RED}✗${NC} $1"
  FAIL=$((FAIL + 1))
}

echo "🔐 SECURITY & KEYS"
echo "──────────────────"

# Check .env.production exists
if [ -f "PPFMobile/.env.production" ]; then
  check_pass ".env.production exists"
  
  # Check Supabase keys
  if grep -q "SUPABASE_URL=" PPFMobile/.env.production && \
     grep -q "SUPABASE_ANON_KEY=" PPFMobile/.env.production; then
    check_pass "Supabase keys present"
  else
    check_fail "Missing Supabase keys in .env.production"
  fi
  
  # Check Stripe key
  if grep -q "STRIPE_PUBLISHABLE_KEY=pk_test_" PPFMobile/.env.production; then
    check_warn "Using Stripe TEST key (ok for v1, swap for production later)"
  elif grep -q "STRIPE_PUBLISHABLE_KEY=pk_live_" PPFMobile/.env.production; then
    check_pass "Using Stripe LIVE key"
  else
    check_fail "Missing Stripe key"
  fi
else
  check_fail ".env.production not found"
fi

# Check Apple API key
if [ -f "$HOME/.appstoreconnect/private_keys/AuthKey_H5WP4Y25KF.p8" ]; then
  check_pass "Apple API key found"
else
  check_fail "Apple API key missing at ~/.appstoreconnect/private_keys/"
fi

echo ""
echo "📱 APP CONFIGURATION"
echo "────────────────────"

# Check bundle ID
if grep -q "com.ironoak.projectflow" PPFMobile/ios/PPFMobile.xcodeproj/project.pbxproj; then
  check_pass "Bundle ID: com.ironoak.projectflow"
else
  check_fail "Bundle ID not set correctly"
fi

# Check display name
DISPLAY_NAME=$(/usr/libexec/PlistBuddy -c "Print CFBundleDisplayName" PPFMobile/ios/PPFMobile/Info.plist 2>/dev/null || echo "")
if [ "$DISPLAY_NAME" = "Precision Project Flow" ]; then
  check_pass "Display name: $DISPLAY_NAME"
else
  check_fail "Display name incorrect: '$DISPLAY_NAME'"
fi

# Check app icons
ICON_COUNT=$(ls PPFMobile/ios/PPFMobile/Images.xcassets/AppIcon.appiconset/*.png 2>/dev/null | wc -l | tr -d ' ')
if [ "$ICON_COUNT" -ge 9 ]; then
  check_pass "App icons: $ICON_COUNT PNG files"
else
  check_fail "Missing app icons (found $ICON_COUNT, need 9)"
fi

# Check PrivacyInfo.xcprivacy
if [ -f "PPFMobile/ios/PPFMobile/PrivacyInfo.xcprivacy" ]; then
  check_pass "PrivacyInfo.xcprivacy present"
else
  check_fail "Missing PrivacyInfo.xcprivacy"
fi

echo ""
echo "🚫 iOS COMPLIANCE"
echo "─────────────────"

# Check iOS payment guard
if grep -q "Platform.OS !== 'ios'" PPFMobile/src/screens/TokenScreen.tsx; then
  check_pass "iOS token purchase UI hidden (Guideline 3.1.1 compliant)"
else
  check_fail "CRITICAL: iOS token purchase not guarded — WILL BE REJECTED"
fi

# Check for NSLocationWhenInUseUsageDescription
if grep -q "NSLocationWhenInUseUsageDescription" PPFMobile/ios/PPFMobile/Info.plist; then
  check_fail "Location permission found — remove if not used"
else
  check_pass "No location permissions (good)"
fi

echo ""
echo "📦 BUILD CONFIGURATION"
echo "──────────────────────"

# Check version
VERSION=$(grep "MARKETING_VERSION" PPFMobile/ios/PPFMobile.xcodeproj/project.pbxproj | head -1 | sed 's/.*= \(.*\);/\1/')
if [ -n "$VERSION" ]; then
  check_pass "Marketing version: $VERSION"
else
  check_warn "Could not detect version"
fi

# Check build number
BUILD=$(grep "CURRENT_PROJECT_VERSION" PPFMobile/ios/PPFMobile.xcodeproj/project.pbxproj | head -1 | sed 's/.*= \(.*\);/\1/')
if [ -n "$BUILD" ]; then
  check_pass "Build number: $BUILD"
else
  check_warn "Could not detect build number"
fi

# Check for TODO/FIXME
TODO_COUNT=$(grep -r "TODO\|FIXME" PPFMobile/src/ --exclude-dir=node_modules 2>/dev/null | wc -l | tr -d ' ')
if [ "$TODO_COUNT" -eq 0 ]; then
  check_pass "No TODO/FIXME in code"
else
  check_warn "Found $TODO_COUNT TODO/FIXME comments"
fi

echo ""
echo "📄 APP STORE METADATA (Manual Check Required)"
echo "──────────────────────────────────────────────"

check_warn "Screenshots uploaded to App Store Connect?"
check_warn "App description written?"
check_warn "Keywords added?"
check_warn "Support/Privacy URLs set?"
check_warn "Demo account created and seeded?"
check_warn "Review notes added explaining iOS restrictions?"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓ Passed:${NC} $PASS"
echo -e "${YELLOW}⚠ Warnings:${NC} $WARN"
echo -e "${RED}✗ Failed:${NC} $FAIL"
echo ""

if [ $FAIL -gt 0 ]; then
  echo -e "${RED}❌ NOT READY FOR TESTFLIGHT${NC}"
  echo "Fix failed checks above before uploading."
  exit 1
elif [ $WARN -gt 5 ]; then
  echo -e "${YELLOW}⚠️  WARNINGS DETECTED${NC}"
  echo "Address App Store Connect metadata items before production."
  echo ""
  echo "✅ You can proceed to TestFlight, but production will require:"
  echo "   • Screenshots (6.7\" + 5.5\")"
  echo "   • Complete app description & keywords"
  echo "   • Demo account with seeded data"
  echo "   • Review notes"
  exit 0
else
  echo -e "${GREEN}✅ READY FOR TESTFLIGHT${NC}"
  echo ""
  echo "🚀 Run: cd PPFMobile && ENVFILE=.env.production ../scripts/build-ios-release.sh"
  exit 0
fi
