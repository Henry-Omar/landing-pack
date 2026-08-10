# Deploy in China · 国内部署 (留学生落地包 / Landing Pack)

Target launch = **Shanghai / mainland China**. This doc covers the China-facing half of
Plan B. The app itself is host-agnostic stdlib Python (runs on any host); what differs in
China is the **network, payments, and legal layer**.

> Rule of thumb: **Render / Railway / overseas hosts are WRONG for Chinese end-users** —
> they sit behind the GFW and will be slow or blocked. Deploy in China; keep an overseas
> mirror only for students who have already landed abroad (US/UK/EU/AU/NZ).

---

## 1. Pick a China host (your real-name account needed)

| Option | What | Notes |
|--------|------|-------|
| **阿里云 ECS** | Lightweight app server (2 vCPU / 2 GB is enough) | Cheapest, full control, you manage the process |
| **腾讯云 CVM / 轻量应用服务器** | Same as above | Often cheaper first year |
| **阿里云 / 腾讯云 Function (函数计算)** | Serverless, no always-on process | Good if traffic is low; cold starts |
| **微信云开发 (CloudBase)** | Hosts the mini-program backend too | Best if you also build the 微信小程序 (Phase 3) |

You must register with **real-name verification (实名认证)** — required by Chinese law and
impossible for me to do. Use your own account.

## 2. Domain + ICP备案 (ICP filing) — REQUIRED for a China-facing domain

1. Buy a domain from 阿里云万网 / 腾讯云 DNSPod (e.g. `landingpack.cn`).
2. File **ICP备案 (Beian)** via the host's console. Needs:
   - Your ID (实名),
   - The server's IP (must be a China mainland IP),
   - ~10–20 business days to approve.
3. After approval you get an **备案号** — display it in the site footer (`沪ICP备XXXX号`).
4. Point the domain at the server; enable **HTTPS** (免费 cert via the host, or 阿里云 SSL).
   Set `APP_BASE_URL=https://your-domain.cn` so payment redirects work.

> No ICP备案 = you can still run on an IP / overseas, but a public China domain is illegal
> without it. Do the filing early — it's the long pole.

## 3. Run the app (one command, same as elsewhere)

```bash
# on the China server
git clone <your-repo> && cd landing-pack
pip3 install -r requirements.txt        # stdlib only; stripe optional
PORT=8000 HOST=0.0.0.0 python3 server.py
# behind nginx/Caddy: HOST=127.0.0.1, proxy / -> 127.0.0.1:8000, terminate TLS
```

Persist `landing.db` (ECS disk / mounted volume) so users, orders, and bookings survive
restarts. The DB seeds itself on first boot.

## 4. Payments in China — 微信支付 + 支付宝

The code already supports all four providers via `PAYMENT_PROVIDER`. For China you set
**wechat** and/or **alipay** (keep `stripe` for the overseas mirror).

### 4a. WeChat Pay (微信支付)
1. Register a **微信商户号 (WeChat Pay merchant account)** at https://pay.weixin.qq.com
   (needs business license / 个体工商户; real-name).
2. Get: `商户号 (mch_id)`, `AppID` (from 微信公众号/小程序), and the **APIv3 key**.
3. Set env:
   ```
   PAYMENT_PROVIDER=wechat
   WECHAT_MCH_ID=你的商户号
   WECHAT_APP_ID=你的AppID
   WECHAT_APIV3_KEY=你的APIv3密钥
   ```
4. Point WeChat's **支付通知 (notify) URL** at `https://your-domain.cn/api/wechat_notify`.
   The server verifies the signature (stdlib HMAC-SHA256) and unlocks the Kit — same flow
   as Stripe, already built and tested.

### 4b. Alipay (支付宝)
1. Register **支付宝开放平台** merchant at https://open.alipay.com (needs 营业执照).
2. Create an app, get `APP_ID` + **app private key** + **支付宝公钥 (platform public key)**.
3. Set env:
   ```
   PAYMENT_PROVIDER=alipay
   ALIPAY_APP_ID=你的APPID
   ALIPAY_APP_SECRET=你的app secret
   ALIPAY_PUBLIC_KEY=支付宝公钥
   ```
4. Point Alipay's **异步通知 (notify)** URL at `https://your-domain.cn/api/alipay_notify`.
   > Note: production Alipay signs notifies with **RSA2** (platform cert). The server's
   > `verify_alipay_sig` currently uses HMAC-SHA256 (testable, stdlib). Swap to RSA2 once
   > `cryptography` is installed on the host — flagged in `server.py`.

### 4c. You can run BOTH
Set `PAYMENT_PROVIDER=wechat` (the primary China one) and keep Stripe configured on the
**separate overseas mirror** so students who landed abroad can pay with Visa/MC. The
webhook/unlock logic is provider-agnostic — one backend pattern, two payment worlds.

## 5. Dual-deploy / 双机部署 (China + global mirror) — so it works AFTER they land abroad

Students use the app in Shanghai **and** the moment they land in Sydney/London/NYC.

- **China instance**: steps 1–4 above (fast in China, 微信/支付宝).
- **Global mirror**: deploy the *same* repo to Render/Railway (see `DEPLOY.md`) or
  阿里云国际 / AWS, with `PAYMENT_PROVIDER=stripe` + `STRIPE_*` and `APP_BASE_URL` = that URL.
- **Shared accounts/Kits**: easiest is one DB replicated, or accept that a Kit bought in
  China shows on the mirror if both point at the same database (e.g. a managed SQLite sync
  or Postgres later). For v1, keep it simple: each instance has its own DB; a user who
  buys in China keeps the Kit on the China instance (which they can still reach abroad,
  just slower). Phase 4 = unify the DB.

## 6. What I (the agent) did vs. what you must do

| Done by agent (code) | You must do (real-name / money) |
|----------------------|--------------------------------|
| Multi-provider payment (mock/stripe/wechat/alipay) | Register 微信商户号 + 支付宝商户 (business license) |
| Notify webhooks that unlock Kits | Point notify URLs at your domain |
| Health check `/api/health` | Buy domain + **ICP备案** |
| Host-agnostic server (runs anywhere) | Create 阿里云/腾讯云 account (实名) |
| Affiliate partner slots (`YOUR_xxx_ID`) | Sign up for affiliate programs, paste links (`PARTNERS.md`) |
| Mentor 20% platform fee | Recruit mentors, receive payouts (微信/支付宝) |

## 7. Mini-program (optional, Phase 3)
A 微信小程序 is the natural China distribution (no App Store, scan-to-open). The backend
already serves `/api/*`; Phase 3 scaffolds a `miniprogram/` frontend calling these APIs and
hosted via 微信云开发. Students in China get the smoothest experience there.

## Health check
`GET https://your-domain.cn/api/health` →
`{"status":"ok","provider":"wechat","wechat":true,"alipay":true,"stripe":false,"webhook":false}`
(health reflects whichever providers have keys set.)

## Files
- `server.py` — all provider logic + `/api/wechat_notify`, `/api/alipay_notify`
- `Dockerfile`, `render.yaml`, `railway.json` — global mirror (overseas) deploy
- `DEPLOY.md` — overseas / Render / Railway walkthrough
- `PARTNERS.md` — how to sign up affiliate partners and paste tracking links
- `.env.example` — every env var documented
