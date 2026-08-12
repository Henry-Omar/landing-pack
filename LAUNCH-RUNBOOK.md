# Launch Runbook · 上线手册 (your step-by-step)

Everything in CODE is done and pushed. This file is **your** checklist — the parts that
need your identity, money, or real-world action. Do them in order. Each step says exactly
what to click. Nothing here is code.

---

## PHASE A — Get the backend live (the app needs a server)

The app (web + native) talks to a backend. You must host it. For China + global from one
place, **Ali Cloud (阿里云)** is the right choice (you mentioned talking to them).

### A1. Ali Cloud account + real-name (实名认证)
1. Go to https://www.aliyun.com → 注册 → **实名认证** (upload ID). Required by law.
2. This is YOU doing it — I can't.

### A2. Buy a server + domain
1. **ECS / 轻量应用服务器**: 2 vCPU, 2 GB RAM is enough (~¥60–100/mo).
2. **Domain**: buy `landingpack.cn` (or your brand) from 万网.
3. **ICP备案 (Beian)**: in the Ali Cloud console → 备案. Needs your ID + server IP.
   Takes ~10–20 business days. **Start this FIRST — it's the long pole.**
   Put the 备案号 in the site footer.

### A3. Deploy the app on Ali Cloud
1. On the server: `git clone https://github.com/Henry-Omar/landing-pack.git`
2. `cd landing-pack && pip3 install -r requirements.txt`
3. `PORT=8000 HOST=0.0.0.0 python3 server.py`
   (or use the Dockerfile: `docker build -t landing-pack . && docker run -p 8000:8000 landing-pack`)
4. Put it behind **Ali Cloud CDN / SLB + HTTPS** (free cert). Set `APP_BASE_URL=https://landingpack.cn`.

### A4. Payments (so you actually earn)
1. **微信支付商户号**: https://pay.weixin.qq.com → register (needs 营业执照).
   Get `商户号`, `AppID`, `APIv3密钥`.
2. **支付宝开放平台**: https://open.alipay.com → create app → get `APP_ID`, keys.
3. On the server, set env (in `start.sh` or the console):
   ```
   PAYMENT_PROVIDER=wechat   (or alipay)
   WECHAT_MCH_ID=...  WECHAT_APP_ID=...  WECHAT_APIV3_KEY=...
   ALIPAY_APP_ID=...  ALIPAY_APP_SECRET=...  ALIPAY_PUBLIC_KEY=...
   ```
4. Point WeChat/Alipay notify URLs at `https://landingpack.cn/api/wechat_notify`
   and `https://landingpack.cn/api/alipay_notify`. (Already built + tested.)

### A5. Overseas mirror (students who landed abroad)
- Option: deploy the SAME repo to **Render** (see DEPLOY.md) with `PAYMENT_PROVIDER=stripe`
  + `STRIPE_*` keys, `APP_BASE_URL` = the Render URL. Students abroad use that; China users
  use the Ali Cloud URL. Both share the same app logic.

---

## PHASE B — Fill the admin console (your control center)

Log in as **admin@landing.pack / admin1234** → the **管理 (Admin)** tab appears (only you see it).

1. **Partnerships**: for each of the 9 products, paste your real affiliate tracking link
   (from Airalo/Holafly/AXA/etc. — sign up on their "Affiliates" page) into the URL field,
   set commission, **Save**. The "待填链接" badge turns to "已上线". Users see the Shop;
   they never see this screen.
2. **Moderation**: delete any bad Q&A.
3. **Overview**: watch users / clicks / kit revenue / mentor revenue grow.
4. **Change the admin password** after first login (register a new admin email, or just
   remember to rotate). Set `ADMIN_EMAIL` env to your own email on the server.

> Sign up for affiliate programs: go to each partner site → footer "Affiliates" / "Partners"
> → apply (free) → paste the link. See PARTNERS.md.

---

## PHASE C — Publish the NATIVE app (iOS + Android shelves)

Code is in `native/` (Capacitor). You compile + publish.

### C1. On your Mac
```bash
cd landing-pack/native
npm install
API_BASE=https://landingpack.cn node copy-web.js   # your Ali Cloud URL
npx cap sync
```
- **iOS**: `npx cap open ios` → Xcode. Install full **Xcode** (App Store) + **CocoaPods**
  (`sudo gem install cocoapods` then `pod install` in `ios/App`). Set **Signing Team**
  (your Apple Dev account). **Product → Archive → Distribute → App Store Connect.**
- **Android**: `npx cap open android` → Android Studio. **Build → Generate Signed Bundle
  (.aab)** → upload to Play Console.

### C2. Developer accounts (your money)
- **Apple Developer Program**: $99/yr — https://developer.apple.com → enroll.
- **Google Play Console**: $25 one-time — https://play.google.com/console.

### C3. Store listing
- Use `native/STORE_LISTING.md` (EN + 中文 copy, keywords, categories).
- Host `native/PRIVACY.md` at `https://landingpack.cn/privacy` (stores require it).
- Screenshots: take them from the app (Simulator / phone).

### C4. Review
- Both stores review (~1–2 days to weeks). Fix anything they flag.
- iOS may question a webview app — our app is a real toolkit (original content), so it passes.

### C5. China Android stores (华为 / 小米 / OPPO / vivo) — REQUIRED for mainland users
Google Play is **blocked in mainland China**, so Chinese Android users cannot install from it.
You must also publish to the local Chinese app stores. They all consume the **same Android
`.aab`/`.apk`** we built in C1 (no extra code), but each has its own console + review.

| Store | Developer console | Notes |
|---|---|---|
| 华为 Huawei AppGallery | https://developer.huawei.com/consumer/en/ | Largest in China. Needs Huawei Developer account (free). Upload `.aab`. May need HarmonyOS NEXT check later. |
| 小米 Xiaomi GetApps | https://dev.mi.com/ | Xiaomi account; upload `.apk`/`.aab`. |
| OPPO / OnePlus | https://open.oppomobile.com/ | OPPO account; `.apk`. |
| vivo | https://dev.vivo.com.cn/ | vivo account; `.apk`. |
| 腾讯应用宝 (Tencent MyApp) | https://open.qq.com/ | Optional but high reach; `.apk`. |

**Steps (same for each):**
1. Register a **developer account** (real-name + often a small fee ¥0–¥600 one-time per store).
2. Create an app → fill name (留学生落地包 / Landing Pack), category **教育/Education**,
   description (reuse `native/STORE_LISTING.md`), screenshots, privacy policy URL.
3. Upload the signed build from C1 (`Build → Generate Signed Bundle/APK` in Android Studio).
4. Submit for review (~1–7 days). They may ask for **《计算机软件著作权》 (software copyright)**
   or ICP备案 number — have your Ali Cloud 备案号 ready.
5. Once approved, Chinese users find it in their phone's store app.

**Tip:** Keep the **same package name `com.landingpack.app`** and version across all stores so
updates are consistent. The web app (H5) is also fine as a fallback QR link for any store
that rejects it.

---

## PHASE D — Launch
1. Backend live (A) + payments (A4) + admin filled (B) → web app is LIVE.
2. Native apps submitted (C) → on shelves after review.
3. Tell students: scan QR / open link / find on App Store / Play.

---

## What I (agent) did — what you MUST do
| Done by code (me) | You must do |
|---|---|
| Web app (all features) | Ali Cloud account + 实名 + ICP备案 |
| Native iOS+Android scaffold | Buy server + domain; deploy |
| Payments (wechat/alipay/stripe) wiring | 微信/支付宝 merchant accounts |
| Admin console (partner mgmt, revenue, mod) | Paste affiliate links; recruit mentors |
| Store listing + privacy copy | Apple $99 / Google $25; upload + review |
| Partnership list (PARTNERS.md) | Sign up affiliates |

**You are NOT "launching blind" — every code piece is built and verified. Your steps are
account creation, deployment, and store submission.** Take them one at a time.
