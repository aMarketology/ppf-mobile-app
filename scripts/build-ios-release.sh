#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# scripts/build-ios-release.sh
# Bundles JS, archives the Xcode project, and uploads to App Store Connect.
#
# Usage:
#   ./scripts/build-ios-release.sh
#
# Prerequisites:
#   1. Fill in YOUR_TEAM_ID in ios/ExportOptions.plist
#   2. Fill in .env.production with real keys
#   3. Be signed in to Xcode with your Apple ID (Xcode → Preferences → Accounts)
#   4. App ID "com.ironoak.projectflow" registered at developer.apple.com
#   5. App record created in App Store Connect
# ─────────────────────────────────────────────────────────────────────────────

set -e

WORKSPACE="ios/PPFMobile.xcworkspace"
SCHEME="PPFMobile"
ARCHIVE_PATH="build/PPFMobile.xcarchive"
EXPORT_OPTIONS="ios/ExportOptions.plist"
EXPORT_PATH="build/AppStoreExport"

echo "▶︎  Using .env.production"
export ENVFILE=.env.production

echo "▶︎  Installing JS dependencies..."
yarn install --frozen-lockfile

echo "▶︎  Installing CocoaPods..."
cd ios && pod install && cd ..

echo "▶︎  Cleaning previous build..."
rm -rf build/

echo "▶︎  Archiving (this takes a few minutes)..."
xcodebuild archive \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Release \
  -archivePath "$ARCHIVE_PATH" \
  -destination "generic/platform=iOS" \
  -allowProvisioningUpdates \
  CODE_SIGN_STYLE=Automatic \
  | xcpretty || true

echo "▶︎  Exporting & uploading to App Store Connect..."
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportOptionsPlist "$EXPORT_OPTIONS" \
  -exportPath "$EXPORT_PATH" \
  -allowProvisioningUpdates \
  | xcpretty || true

echo ""
echo "✅  Done! Check App Store Connect → TestFlight for the new build."
echo "    https://appstoreconnect.apple.com"
