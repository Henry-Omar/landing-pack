# ◈ 留学生落地包 · Landing Pack

A bilingual (中文 / EN) hub for international Chinese students: pre-arrival checklist,
city survival guides, peer Q&A, document templates, and destination-specific checklists.

**Stack:** Python 3 stdlib only (no pip deps). Single-file backend (`server.py`) +
static frontend (`static/`). SQLite for storage.

## Run locally
```bash
cd landing
python3 server.py
# open http://localhost:8000
```

## Features
- Real login/registration with **httpOnly session cookies** (XSS-safe)
- Email verification + password reset (dev link mode)
- Login lockout after 5 failures (423 for 5 min)
- Pre-arrival checklist with progress tracking
- City survival guides (London, New York, Sydney, Toronto, Tokyo)
- Peer Q&A (bilingual)
- Document templates (copyable, bilingual)
- Destination-specific checklist presets

## Deploy
The app is PaaS-ready:
- Reads `$PORT` at runtime
- Set `LP_HTTPS=1` in production so session cookies are marked `Secure` (HTTPS only)

### Render
1. New → Web Service → connect repo
2. Runtime: Docker (or Build Command `pip install -r requirements.txt`, Start `python server.py`)
3. Add env var `LP_HTTPS=1`
4. Deploy

### Railway
1. New Project → Deploy from repo (Dockerfile auto-detected)
2. Set env `LP_HTTPS=1`
3. Generate domain (HTTPS) → cookies become Secure automatically

### Fly.io
```bash
fly launch --no-deploy
fly secrets set LP_HTTPS=1
fly deploy
```

### Heroku
```bash
heroku create
heroku config:set LP_HTTPS=1
git push heroku main
```

### Docker anywhere
```bash
docker build -t landing-pack .
docker run -p 8000:8000 -e LP_HTTPS=1 landing-pack
```
