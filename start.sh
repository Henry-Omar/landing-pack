#!/usr/bin/env bash
# Landing Pack — production start script (stdlib-only, no pip).
# Run on your Ali Cloud server (上海 region). Set env vars to configure:
#   PORT=8000  (Ali Cloud firewall must open this port)
#   ADMIN_EMAIL=you@domain.com
#   ADMIN_TOKEN=$(openssl rand -hex 16)   # persist this! save it somewhere safe
#   APP_BASE_URL=https://landingpackapp.com
#   PAYMENTS_ENABLED=0                     # flip to 1 after 个体工商户 + merchant
#   DATA_DIR=/var/lib/landingpack          # where landing.db lives (persistent volume)
set -e
cd "$(dirname "$0")"
export PYTHONUNBUFFERED=1
# Use all cores; ThreadingHTTPServer handles concurrency. WAL is enabled in db().
exec python3 server.py
