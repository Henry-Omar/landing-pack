#!/bin/bash
# Robust supervisor for 留学生落地包 (Landing Pack) server.
# - Detaches into its own session (survives terminal/session teardown -> no more SIGTERM churn)
# - Logs each run to a timestamped file in /tmp/lp_logs/ (evidence preserved, not truncated)
# - Does NOT wipe app.db unless you pass --reset
# - Restarts the server if it exits, logging the exit code
set -u
cd /Users/ahmatjanomar/landing

LOGDIR=/tmp/lp_logs
mkdir -p "$LOGDIR"

if [ "${1:-}" = "--reset" ]; then
  rm -f app.db
  echo "$(date) --reset: wiped app.db" >> "$LOGDIR/supervisor.log"
fi

# Run the supervisor in its own session so a SIGTERM to the terminal can't reach it.
run_supervisor() {
  while true; do
    TS=$(date +%Y%m%d_%H%M%S)
    LOG="$LOGDIR/server_$TS.log"
    echo "$(date) launching server.py (supervised)" >> "$LOG"
    python3 server.py >> "$LOG" 2>&1
    CODE=$?
    echo "$(date) server.py exited with code $CODE — restarting in 3s" >> "$LOG"
    sleep 3
  done
}

echo "$(date) supervisor starting (detached)" >> "$LOGDIR/supervisor.log"
setsid bash -c "$(declare -f run_supervisor); run_supervisor" >> "$LOGDIR/supervisor.log" 2>&1 < /dev/null &
disown
echo "started. supervisor PID $!. Logs in $LOGDIR/"
