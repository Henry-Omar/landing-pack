#!/usr/bin/env bash
# Landing Pack DB backup — run daily via cron (e.g. `0 4 * * * /opt/landing-pack/backup.sh`).
# Keeps last 14 daily snapshots in BACKUP_DIR. landing.db is the ONLY data store;
# losing it loses all users/checklists/community — back it up.
set -e
SRC="/var/lib/landingpack/landing.db"
BACKUP_DIR="/var/lib/landingpack/backups"
mkdir -p "$BACKUP_DIR"
TS=$(date +%Y%m%d_%H%M%S)
# Use sqlite .backup for a consistent copy even if the server is writing.
sqlite3 "$SRC" ".backup '$BACKUP_DIR/landing_$TS.db'" 2>/dev/null \
  || cp "$SRC" "$BACKUP_DIR/landing_$TS.db"   # fallback if sqlite3 CLI absent
# WAL sidecars
[ -f "$SRC-wal" ] && cp "$SRC-wal" "$BACKUP_DIR/landing_$TS.db-wal" 2>/dev/null || true
[ -f "$SRC-shm" ] && cp "$SRC-shm" "$BACKUP_DIR/landing_$TS.db-shm" 2>/dev/null || true
# Prune older than 14 days
find "$BACKUP_DIR" -name 'landing_*.db*' -mtime +14 -delete 2>/dev/null || true
echo "[$(date)] backup done: $BACKUP_DIR/landing_$TS.db"
