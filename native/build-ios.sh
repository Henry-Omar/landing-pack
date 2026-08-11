#!/usr/bin/env bash
# Build the iOS app (.ipa) for App Store submission.
# Prereqs (on your Mac): Node 18+, Xcode (full, from App Store), CocoaPods.
# Run:  bash build-ios.sh
set -e
cd "$(dirname "$0")"

# 1) Install deps + Capacitor
npm install

# 2) Copy web assets, pointing API at YOUR deployed backend.
#    Replace the URL with your Render / 阿里云 URL.
export API_BASE="${API_BASE:-https://landing-pack.onrender.com}"
node copy-web.js

# 3) Add iOS platform (first time only) and sync
npx cap add ios 2>/dev/null || true
npx cap sync ios

# 4) Open in Xcode so you can set signing + archive
npx cap open ios
echo "---"
echo "In Xcode: Signing & Capabilities -> set Team (your Apple Dev account)."
echo "Product -> Archive -> Distribute App -> App Store Connect."
echo "App ID / Bundle: com.landingpack.app"
