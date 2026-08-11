# Landing Pack · Native App (iOS + Android)

Capacitor wrapper over the web app (`../static`, served by `../server.py`).
Produces a **real native app** (not a website) for the App Store + Google Play.

## What's here
- `capacitor.config.json` — appId `com.landingpack.app`, name `Landing Pack`
- `ios/` — native Xcode project (open in Xcode)
- `android/` — native Gradle project (open in Android Studio)
- `copy-web.js` — bundles `../static` into `www/` + writes `api-base.js` (your backend URL)
- `build-ios.sh` / `build-android.sh` — one-command builds
- `STORE_LISTING.md` — EN + 中文 listing copy
- `PRIVACY.md` — privacy policy (host it at your domain for store review)

## How the app talks to the backend
The web UI is bundled locally; API calls (`/api/*`) are routed to `API_BASE`
(see the fetch shim at the top of `../static/app.js`). Set it at build time:
```bash
API_BASE=https://YOUR-BACKEND-URL node copy-web.js
```
`build-ios.sh` / `build-android.sh` default `API_BASE` to the Render URL — change it to your domain.

## Build on your Mac (final step — needs Xcode / Android Studio)
```bash
cd native
npm install
API_BASE=https://landing-pack.onrender.com node copy-web.js
npx cap sync
# iOS:
npx cap open ios      # Xcode -> Signing (your Team) -> Archive -> App Store Connect
# Android:
npx cap open android  # Build -> Signed Bundle (.aab) -> upload to Play Console
```
iOS requires `pod install` (CocoaPods) + full Xcode. Android requires Android SDK (API 34).

## Icons / splash
Provide a 1024×1024 PNG and run `npx cap copy` after adding it to `assets/icon.png`,
or let Xcode/Android Studio generate from the source in `assets/`. Stores reject
missing icons, so do this before submission.

## You (the developer) must:
- Apple Developer Program ($99/yr) to publish to iOS App Store
- Google Play Console ($25) to publish to Play Store
- Deploy the backend (Render / 阿里云) and set API_BASE to its URL
- Generate + upload signed artifacts; pass store review
