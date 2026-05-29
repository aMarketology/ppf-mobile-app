#!/bin/bash
# Screenshot Helper for App Store Submission
# Takes screenshots from running iOS Simulator for App Store Connect

set -e

echo "📸 Screenshot Helper — Precision Project Flow"
echo "============================================="
echo ""

# Check if simulator is running
if ! xcrun simctl list | grep -q "Booted"; then
  echo "❌ No simulator is running. Please:"
  echo "   1. Open Simulator.app"
  echo "   2. Choose iPhone 16 Pro Max (6.7\")"
  echo "   3. Run the app: cd PPFMobile && npx react-native run-ios --simulator='iPhone 16 Pro Max'"
  exit 1
fi

# Get booted device
DEVICE=$(xcrun simctl list devices | grep Booted | head -1 | sed 's/.*(\(.*\)).*/\1/')
echo "✓ Found booted simulator: $DEVICE"
echo ""

# Create screenshots directory
SCREENSHOTS_DIR="./app-store-screenshots"
mkdir -p "$SCREENSHOTS_DIR"
echo "✓ Screenshots will be saved to: $SCREENSHOTS_DIR"
echo ""

echo "📋 INSTRUCTIONS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Take 5-8 screenshots by navigating in the app and pressing Enter after each screen:"
echo ""
echo "  1️⃣  HOME SCREEN — Hero with 'Browse Marketplace' CTA"
echo "  2️⃣  MARKETPLACE — Supplier cards with filters active"
echo "  3️⃣  MARKETPLACE (scrolled) — Show verified badges"
echo "  4️⃣  FEED — Posts with engagement"
echo "  5️⃣  MESSAGES — Conversations list"
echo "  6️⃣  TOKENS — Balance card and 'Coming Soon' info"
echo "  7️⃣  PROFILE — User profile with stats"
echo "  8️⃣  (OPTIONAL) Supplier detail or search results"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Screenshot counter
COUNT=1

# Function to take screenshot
take_screenshot() {
  FILENAME="$SCREENSHOTS_DIR/screenshot_$COUNT.png"
  xcrun simctl io "$DEVICE" screenshot "$FILENAME"
  echo "✅ Screenshot $COUNT saved: $FILENAME"
  COUNT=$((COUNT + 1))
}

echo "🎬 Ready! Navigate to the first screen and press ENTER..."
read
take_screenshot

while true; do
  echo ""
  echo "Navigate to next screen and press ENTER (or type 'done' to finish):"
  read INPUT
  
  if [ "$INPUT" = "done" ] || [ "$INPUT" = "d" ]; then
    break
  fi
  
  take_screenshot
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Complete! Saved $((COUNT - 1)) screenshots"
echo ""
echo "📤 NEXT STEPS:"
echo "   1. Review screenshots in: $SCREENSHOTS_DIR"
echo "   2. Go to App Store Connect → Precision Project Flow → App Store tab"
echo "   3. Upload screenshots for 6.7\" iPhone display"
echo "   4. Repeat for 5.5\" display (iPhone 8 Plus) if needed"
echo ""
echo "💡 TIP: App Store requires:"
echo "   • Minimum 3 screenshots, maximum 10"
echo "   • Must be 1290x2796 (6.7\") or 1242x2208 (5.5\")"
echo "   • No alpha channels, RGB color space"
echo ""
echo "🚀 Once uploaded, you're ready for TestFlight!"
