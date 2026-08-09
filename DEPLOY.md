# Deploy · 留学生落地包 (Landing Pack)

## What it is
A stdlib-only Python (`http.server` + `sqlite3`) bilingual web app. No build step, no external
services required for local/dev. Data lives in `landing.db` (SQLite, WAL mode).

## Run (local / dev)
```bash
cd /Users/ahmatjanomar/landing
python3 server.py                 # http://localhost:8000
```

## Run (production, one command)
```bash
chmod +x start.sh
./start.sh                        # reads env vars below; default PORT=8000, HOST=0.0.0.0
```

## Config via environment variables
| Var | Default | Notes |
|-----|---------|-------|
| `PORT` | `8000` | Listening port |
| `HOST` | `0.0.0.0` | Bind address (use `127.0.0.1` behind a reverse proxy) |
| `APP_BASE_URL` | `http://localhost:8000` | Used in Stripe redirect URLs |
| `PAYMENT_PROVIDER` | `mock` | `mock` = instant fake checkout; `stripe` = real Stripe Checkout |
| `STRIPE_SECRET_KEY` | _(empty)_ | Required only when `PAYMENT_PROVIDER=stripe` |
| `STRIPE_PUBLISHABLE_KEY` | _(empty)_ | Frontend key (for future inline Stripe Elements) |

## Enable real payments (Stripe)
1. `pip install stripe` (uncomment in `requirements.txt`)
2. Set `PAYMENT_PROVIDER=stripe` and `STRIPE_SECRET_KEY=sk_live_...`
3. Restart. `/api/buy_kit` then returns a `checkout_url` the app redirects to.
   Webhook/confirmation of `pending` orders is the next hardening step.

## Behind a reverse proxy (nginx / Caddy)
Proxy `/` → `http://127.0.0.1:8000`, set `HOST=127.0.0.1`, terminate TLS at the proxy.

## Health check
`GET /api/health` → `{"status":"ok","provider":"mock","stripe":false}`

## Data
- SQLite file: `landing.db` (+ `-wal`/`-shm`). Back it up; it holds users, orders, bookings, progress.
- Seeded on first run (demo account `demo@landing.pack` / `demo1234`, 10 schools, products, kits, mentors).

## Notes / next hardening
- Add Stripe webhook to flip `pending`→`paid` and unlock kits reliably.
- Add an admin panel to manage schools/products/kits without code edits.
- For heavy traffic, swap `ThreadingHTTPServer` for gunicorn (`gunicorn server:H`) once a WSGI shim is added.

## One-click deploy (live host)
- **Render:** connect the repo → uses `render.yaml` → builds `Dockerfile` → serves at a public URL. Health check = `GET /api/health`.
- **Railway:** uses `railway.json` + `Dockerfile`, same health check.
- **Any Docker host / VPS:** `docker build -t landing-pack . && docker run -p 8000:8000 -v $(pwd)/data:/app landing-pack`.
- Persist `landing.db` (mount a volume / disk) so users, orders, and progress survive restarts. Set `APP_BASE_URL` to the public URL before enabling Stripe.
