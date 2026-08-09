#!/usr/bin/env bash
# One-command production launch for 留学生落地包 · Landing Pack
set -e
cd "$(dirname "$0")"

# Optional: only needed if you switch PAYMENT_PROVIDER=stripe
# pip install -r requirements.txt

export PORT="${PORT:-8000}"
export HOST="${HOST:-0.0.0.0}"
export APP_BASE_URL="${APP_BASE_URL:-http://localhost:${PORT}}"
export PAYMENT_PROVIDER="${PAYMENT_PROVIDER:-mock}"
export STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-}"
export STRIPE_PUBLISHABLE_KEY="${STRIPE_PUBLISHABLE_KEY:-}"

exec python3 server.py
