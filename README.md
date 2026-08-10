# 留学生落地包 · Landing Pack

> Bilingual (中文 / English) landing hub for international Chinese students — your first stop before studying abroad.

[![Deploy on Render](https://img.shields.io/badge/deploy-Render-46E3B7)](https://render.com/deploy)
[![Deploy on Railway](https://img.shields.io/badge/deploy-Railway-8B5CF6)](https://railway.app)

## What it is

A real, deployable web app (not a mini-program) that helps Chinese students landing
abroad with:

- **✅ 落地清单 Checklist** — generic pre-departure tasks + **school-specific** checklists (10 schools across UK / US / AU / CA / JP), with progress that persists per user.
- **🗺 城市指南 City Guide** — survival guides per destination.
- **💬 前辈问答 Peer Q&A** — ask and answer questions from seniors at your school.
- **🛒 商城 Affiliate Shop** — curated study-abroad products (affiliate links).
- **📦 落地包 Paid Kits** — bilingual digital kits (visa checklists, lease-safety, packing) for one-time purchase.
- **🎓 前辈 Mentor Booking** — 1-on-1 bookable sessions with alumni.

Everything is **bilingual by design** — a 中文 / EN toggle in the UI, and both languages
in the data layer.

## Tech

- **Zero dependencies** — Python standard library only (`http.server` + `sqlite3`).
- No build step, no frontend framework, no external services required for local/dev.
- Single-file backend (`server.py`), static frontend (`static/`).
- SQLite database (`landing.db`) with WAL mode.

## Run locally

```bash
cd landing
python3 server.py                 # http://localhost:8000
```

Demo account: `demo@landing.pack` / `demo1234`

## Environment variables

| Var | Default | Notes |
|-----|---------|-------|
| `PORT` | `8000` | Listening port |
| `HOST` | `0.0.0.0` | Bind address (use `127.0.0.1` behind a reverse proxy) |
| `DATA_DIR` | script dir | Where `landing.db` is stored (mount a volume here in Docker) |
| `APP_BASE_URL` | `http://localhost:8000` | Used in Stripe redirect URLs |
| `PAYMENT_PROVIDER` | `mock` | `mock` = instant fake checkout; `stripe` = real Stripe Checkout |
| `STRIPE_SECRET_KEY` | _(empty)_ | Required only when `PAYMENT_PROVIDER=stripe` |
| `STRIPE_PUBLISHABLE_KEY` | _(empty)_ | Frontend key (for future inline Stripe Elements) |

Copy `.env.example` to `.env` and fill in as needed.

## Deploy (one click)

The repo ships with container + platform configs:

- **Render** — `render.yaml` + `Dockerfile`, health check `GET /api/health`
- **Railway** — `railway.json` + `Dockerfile`
- **Fly.io** — `fly.toml`
- **Any Docker host** — `docker build -t landing-pack . && docker run -p 8000:8000 -v $(pwd)/data:/app landing-pack`

Persist `landing.db` (mount a volume / disk) so users, orders, and progress survive
restarts. Set `APP_BASE_URL` to the public URL before enabling Stripe.

## Enable real payments (Stripe)

1. `pip install stripe` (uncomment in `requirements.txt`)
2. Set `PAYMENT_PROVIDER=stripe` and `STRIPE_SECRET_KEY=sk_live_...`
3. Restart. `/api/buy_kit` then returns a `checkout_url` the app redirects to.
4. Add a **webhook endpoint** in Stripe pointing to `https://YOUR_DOMAIN/api/stripe_webhook`
   with the signing secret set as `STRIPE_WEBHOOK_SECRET`. On `checkout.session.completed`
   the matching `pending` order flips to `paid` and the kit unlocks automatically.

## Enable China payments (WeChat Pay + Alipay) — Plan B

The same backend serves both overseas (Stripe) and China (WeChat Pay / Alipay). Set the
env vars and the matching `PAYMENT_PROVIDER`; the app returns a `pay_url` and a notify
webhook unlocks the kit on payment.

**WeChat Pay (V3):**
- `PAYMENT_PROVIDER=wechat` + `WECHAT_MCH_ID` + `WECHAT_APIV3_KEY` + `WECHAT_APP_ID`
- Notify: `https://YOUR_DOMAIN/api/wechat_notify` (signature verified with APIv3 key,
  stdlib HMAC-SHA256 — no SDK needed). On success the `pending` order flips to `paid`.

**Alipay:**
- `PAYMENT_PROVIDER=alipay` + `ALIPAY_APP_ID` + `ALIPAY_APP_SECRET` (+ `ALIPAY_PUBLIC_KEY`
  for production RSA2). Notify: `https://YOUR_DOMAIN/api/alipay_notify` (HMAC-SHA256 verify;
  production Alipay uses RSA2 with the platform cert — swap `verify_alipay_sig` for RSA2
  when `cryptography` is available).

> Note: WeChat/Alipay require a **China-registered merchant account** (商户号 / 支付宝商户).
> Until keys are set, the app falls back to `mock` (instant unlock) for local dev. For a
> Shanghai launch, deploy on a domestic host (阿里云/腾讯云) behind an ICP备案 domain, and
> keep Stripe enabled for students who pay after landing abroad. See `DEPLOY-CN.md`.

## Health check

`GET /api/health` → `{"status":"ok","provider":"mock","stripe":false,"webhook":false,"wechat":false,"alipay":false}`

## Project layout

```
landing/
├── server.py            # stdlib backend + REST API + SQLite
├── static/
│   ├── index.html       # Hermes-style techno home + 6-tab app shell
│   ├── style.css
│   ├── app.js           # auth, i18n, monetization, school logic
│   └── templates/       # downloadable bilingual packing lists
├── Dockerfile           # container build
├── render.yaml          # Render deploy
├── railway.json         # Railway deploy
├── fly.toml             # Fly.io deploy
├── Procfile            # generic PaaS
├── start.sh            # one-command launch (reads env)
├── .env.example        # env template
├── requirements.txt    # optional stripe dep
└── DEPLOY.md           # deploy notes
```

## License

MIT — free to use, modify, and deploy.
