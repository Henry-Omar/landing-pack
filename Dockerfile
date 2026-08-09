# Landing Pack · 留学生落地包
# Stdlib-only Python app (http.server + sqlite3). No build step.
FROM python:3.11-slim

WORKDIR /app

# Copy app (DB is created at runtime; we keep a clean slate on first boot)
COPY server.py        /app/server.py
COPY static/          /app/static/
COPY start.sh         /app/start.sh
COPY requirements.txt /app/requirements.txt

RUN chmod +x /app/start.sh

# Persist SQLite data across restarts (mount a volume here in the platform)
ENV PORT=8000
ENV HOST=0.0.0.0
EXPOSE 8000

# One-command launch; reads env vars for payments/port
CMD ["bash", "start.sh"]
