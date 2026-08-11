#!/usr/bin/env bash
# Build the Android app (.aab) for Google Play submission.
# Prereqs (on your Mac/PC): Node 18+, Android Studio, Android SDK (API 34), Java 17.
# Run:  bash build-android.sh
set -e
cd "$(dirname "$0")"

npm install

export API_BASE="${API_BASE:-https://landing-pack.onrender.com}"
node copy-web.js

npx cap add android 2>/dev/null || true
npx cap sync android

npx cap open android
echo "---"
echo "In Android Studio: Build -> Generate Signed Bundle / APK -> Android App Bundle (.aab)."
echo "Upload the .aab to Google Play Console (Production track)."
echo "Package: com.landingpack.app"
